"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendQualifiedLeadEmail, sendUnqualifiedLeadEmail, sendLeadAssignedEmail, sendVisitConfirmationEmail } from "@/lib/email";
import type { LeadStatus, PropertyType, SellUrgency } from "@/types";

async function getSession() {
  // Auth check via session client, writes via service client (bypasses RLS)
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const supabase = createServiceClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();
  return { supabase, user, profile };
}

// Fetches lead assignment and checks if the current user can edit it.
// Rules: admin always yes | agent only if lead.assigned_agent === user.id
async function requireEditAccess(leadId: string) {
  const { supabase, user, profile } = await getSession();
  const isAdmin = profile?.role === "admin";
  if (isAdmin) return { supabase, user, profile, isAdmin };

  const { data: lead } = await supabase
    .from("leads")
    .select("assigned_agent")
    .eq("id", leadId)
    .single();

  if (lead?.assigned_agent !== user.id) {
    throw new Error("No tienes permiso para editar este lead");
  }
  return { supabase, user, profile, isAdmin };
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const { supabase } = await requireEditAccess(leadId);
  const { error } = await supabase
    .from("leads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", leadId);
  if (error) throw error;
  revalidatePath("/crm");
  revalidatePath("/crm/leads");
  revalidatePath("/crm/pipeline");
  revalidatePath("/crm/clientes");
  revalidatePath(`/crm/leads/${leadId}`);

  if (status === "calificado" || status === "no_calificado") {
    const { data: lead } = await supabase
      .from("leads")
      .select("id, name, phone, property_city, property_type")
      .eq("id", leadId)
      .single();
    if (lead) {
      const fn = status === "calificado" ? sendQualifiedLeadEmail : sendUnqualifiedLeadEmail;
      try {
        await fn(lead);
        console.log(`[Email] sent for status=${status} lead=${leadId}`);
      } catch (e) {
        console.error("[Email] failed:", e);
      }
    }
  }
}

export async function addLeadNote(leadId: string, content: string) {
  const { supabase, user, profile } = await requireEditAccess(leadId);
  const { data, error } = await supabase
    .from("lead_notes")
    .insert({
      lead_id: leadId,
      content,
      author_id: user.id,
      author_name: profile?.full_name ?? "Usuario",
    })
    .select()
    .single();
  if (error) throw error;
  revalidatePath(`/crm/leads/${leadId}`);
  return data;
}

export async function assignAgent(leadId: string, agentId: string | null) {
  const { supabase, user, profile } = await getSession();
  const isAdmin = profile?.role === "admin";

  if (!isAdmin) {
    // Agent can only self-assign a currently unassigned lead
    const { data: lead } = await supabase
      .from("leads")
      .select("assigned_agent")
      .eq("id", leadId)
      .single();

    if (lead?.assigned_agent !== null) {
      throw new Error("Solo el admin puede reasignar un lead ya asignado");
    }
    if (agentId !== user.id) {
      throw new Error("Solo puedes asignarte leads a ti mismo");
    }
  }

  const { error } = await supabase
    .from("leads")
    .update({ assigned_agent: agentId, updated_at: new Date().toISOString() })
    .eq("id", leadId);
  if (error) throw error;
  revalidatePath(`/crm/leads/${leadId}`);
  revalidatePath("/crm/pipeline");

  if (agentId) {
    const { data: lead } = await supabase
      .from("leads")
      .select("id, name, phone, property_city, property_type")
      .eq("id", leadId)
      .single();
    if (lead) {
      try {
        await sendLeadAssignedEmail(lead, agentId);
        console.log(`[Email] assignment sent lead=${leadId} agent=${agentId}`);
      } catch (e) {
        console.error("[Email] assignment failed:", e);
      }
    }
  }
}

export async function createVisit(data: {
  lead_id: string;
  agent_id?: string;
  scheduled_at: string;
  address?: string;
  notes?: string;
}) {
  const { supabase, user } = await requireEditAccess(data.lead_id);

  const { data: visit, error } = await supabase
    .from("visits")
    .insert(data)
    .select()
    .single();
  if (error) throw error;

  const { error: statusError } = await supabase
    .from("leads")
    .update({ status: "visita_agendada", updated_at: new Date().toISOString() })
    .eq("id", data.lead_id);
  if (statusError) throw statusError;

  revalidatePath(`/crm/leads/${data.lead_id}`);
  revalidatePath("/crm/pipeline");
  revalidatePath("/crm/calendario");
  revalidatePath("/crm/clientes");
  revalidatePath("/crm");

  // Send confirmation email to the agent who created the visit
  try {
    const { data: { user: agentUser } } = await supabase.auth.admin.getUserById(user.id);
    const agentEmail = agentUser?.email;
    if (agentEmail) {
      const { data: lead } = await supabase
        .from("leads")
        .select("id, name, phone, property_city, property_type")
        .eq("id", data.lead_id)
        .single();
      if (lead) {
        await sendVisitConfirmationEmail(visit, lead, agentEmail);
        console.log(`[Email] visit confirmation sent lead=${data.lead_id} agent=${user.id}`);
      }
    }
  } catch (e) {
    console.error("[Email] visit confirmation failed:", e);
  }
}

export async function updateLeadInfo(
  leadId: string,
  data: {
    email?: string;
    property_address?: string;
    property_city?: string;
    property_type?: PropertyType;
    rooms?: number;
    bathrooms?: number;
    estimated_value?: number;
    is_owner?: boolean;
    urgency?: SellUrgency;
    has_mortgage?: boolean;
  }
) {
  const { supabase } = await requireEditAccess(leadId);
  const { error } = await supabase
    .from("leads")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", leadId);
  if (error) throw error;
  revalidatePath(`/crm/leads/${leadId}`);
  revalidatePath("/crm/clientes");
}

export async function updateVisitStatus(visitId: string, status: string) {
  const { supabase } = await getSession();
  const { error } = await supabase
    .from("visits")
    .update({ status })
    .eq("id", visitId);
  if (error) throw error;
  revalidatePath("/crm/calendario");
}
