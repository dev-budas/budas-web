"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { LeadStatus } from "@/types";

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
  revalidatePath(`/crm/leads/${leadId}`);
}

export async function updateLeadNotes(leadId: string, notes: string) {
  const { supabase } = await requireEditAccess(leadId);
  const { error } = await supabase
    .from("leads")
    .update({ notes, updated_at: new Date().toISOString() })
    .eq("id", leadId);
  if (error) throw error;
  revalidatePath(`/crm/leads/${leadId}`);
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
}

export async function createVisit(data: {
  lead_id: string;
  agent_id?: string;
  scheduled_at: string;
  address?: string;
  notes?: string;
}) {
  const { supabase } = await requireEditAccess(data.lead_id);
  const { error } = await supabase.from("visits").insert(data);
  if (error) throw error;
  await supabase
    .from("leads")
    .update({ status: "visita_agendada", updated_at: new Date().toISOString() })
    .eq("id", data.lead_id);
  revalidatePath(`/crm/leads/${data.lead_id}`);
  revalidatePath("/crm/pipeline");
  revalidatePath("/crm/calendario");
  revalidatePath("/crm");
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
