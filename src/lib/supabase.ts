import { createClient } from "@supabase/supabase-js";
import type { Lead } from "@/types";

// Lazy clients — created on first call, not at module evaluation time
let _anonClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!_anonClient) {
    _anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _anonClient;
}

// Server-only client with elevated privileges (for API routes)
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/* ─── Lead queries ───────────────────────────────────────────────────────── */

export async function createLead(
  data: Pick<Lead, "name" | "phone" | "email" | "property_type" | "property_city"> & {
    rooms?: number;
    bathrooms?: number;
    utm_source?: string;
    utm_campaign?: string;
    utm_medium?: string;
  }
) {
  const client = createServerClient();
  const { data: lead, error } = await client
    .from("leads")
    .insert({ ...data, status: "nuevo" })
    .select()
    .single();

  if (error) throw error;
  return lead as Lead;
}

export async function getLeads(status?: Lead["status"]) {
  const client = createServerClient();
  let query = client
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Lead[];
}

export async function updateLeadStatus(id: string, status: Lead["status"]) {
  const client = createServerClient();
  const { error } = await client
    .from("leads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function appendWhatsAppMessage(
  leadId: string,
  message: { role: "bot" | "lead"; content: string }
) {
  const client = createServerClient();

  const { data: lead, error: fetchError } = await client
    .from("leads")
    .select("whatsapp_conversation")
    .eq("id", leadId)
    .single();

  if (fetchError) throw fetchError;

  const conversation = lead.whatsapp_conversation ?? [];
  conversation.push({
    id: crypto.randomUUID(),
    ...message,
    timestamp: new Date().toISOString(),
  });

  const { error } = await client
    .from("leads")
    .update({ whatsapp_conversation: conversation, updated_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) throw error;
}

export async function getLeadByPhone(phone: string) {
  const client = createServerClient();
  const { data, error } = await client
    .from("leads")
    .select("*")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data as Lead | null;
}
