"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const BASE = "https://graph.facebook.com/v21.0";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    throw new Error("Solo administradores pueden gestionar campañas");
  }
}

export async function updateCampaignStatus(
  campaignId: string,
  status: "ACTIVE" | "PAUSED"
) {
  await requireAdmin();

  const res = await fetch(`${BASE}/${campaignId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status,
      access_token: process.env.META_ADS_ACCESS_TOKEN,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  revalidatePath("/crm/campanas");
}

export async function updateCampaignBudget(
  campaignId: string,
  dailyBudget: number
) {
  await requireAdmin();

  const daily_budget = Math.round(dailyBudget * 100).toString();

  const res = await fetch(`${BASE}/${campaignId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      daily_budget,
      access_token: process.env.META_ADS_ACCESS_TOKEN,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  revalidatePath("/crm/campanas");
}

export async function updateCampaignName(campaignId: string, name: string) {
  await requireAdmin();

  const res = await fetch(`${BASE}/${campaignId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, access_token: process.env.META_ADS_ACCESS_TOKEN }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  revalidatePath("/crm/campanas");
}

export async function updateCampaignDates(
  campaignId: string,
  startTime?: string,
  stopTime?: string
) {
  await requireAdmin();

  const body: Record<string, string> = {
    access_token: process.env.META_ADS_ACCESS_TOKEN!,
  };
  if (startTime) body.start_time = startTime;
  if (stopTime) body.stop_time = stopTime;

  const res = await fetch(`${BASE}/${campaignId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  revalidatePath("/crm/campanas");
}
