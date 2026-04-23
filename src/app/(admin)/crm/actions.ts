"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { LeadStatus } from "@/types";

async function getSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();
  return { supabase, user, profile };
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const { supabase } = await getSession();
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
  const { supabase } = await getSession();
  const { error } = await supabase
    .from("leads")
    .update({ notes, updated_at: new Date().toISOString() })
    .eq("id", leadId);
  if (error) throw error;
  revalidatePath(`/crm/leads/${leadId}`);
}

export async function assignAgent(leadId: string, agentId: string | null) {
  const { supabase, profile } = await getSession();
  if (profile?.role !== "admin") throw new Error("Solo el admin puede asignar agentes");
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
  const { supabase } = await getSession();
  const { error } = await supabase.from("visits").insert(data);
  if (error) throw error;
  // Set lead status to visita_agendada
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
