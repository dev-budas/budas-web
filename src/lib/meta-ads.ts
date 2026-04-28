const BASE = "https://graph.facebook.com/v21.0";

function token() {
  return process.env.META_ADS_ACCESS_TOKEN ?? "";
}
function adAccount() {
  return process.env.META_AD_ACCOUNT_ID ?? "";
}

export type CampaignStatus = "ACTIVE" | "PAUSED" | "ARCHIVED" | "DELETED";

export interface CampaignInsights {
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  cpl: number;
  ctr: number;
  cpc: number;
}

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  objective: string;
  daily_budget?: number;
  lifetime_budget?: number;
  insights: CampaignInsights;
}

export interface AdSet {
  id: string;
  name: string;
  status: CampaignStatus;
  daily_budget?: number;
  lifetime_budget?: number;
  insights: CampaignInsights;
}

export interface AccountSummary {
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  cpl: number;
  ctr: number;
}

const INSIGHT_FIELDS =
  "spend,impressions,clicks,actions,cost_per_action_type,ctr,cpc";

const LEAD_ACTIONS = ["lead", "onsite_conversion.lead_grouped"];

function parseInsights(raw: unknown): CampaignInsights {
  const d = (raw as any)?.data?.[0];
  if (!d) return { spend: 0, impressions: 0, clicks: 0, leads: 0, cpl: 0, ctr: 0, cpc: 0 };

  const leadAction = d.actions?.find((a: any) => LEAD_ACTIONS.includes(a.action_type));
  const leadCost = d.cost_per_action_type?.find((a: any) =>
    LEAD_ACTIONS.includes(a.action_type)
  );

  return {
    spend: parseFloat(d.spend ?? "0"),
    impressions: parseInt(d.impressions ?? "0"),
    clicks: parseInt(d.clicks ?? "0"),
    leads: parseInt(leadAction?.value ?? "0"),
    cpl: parseFloat(leadCost?.value ?? "0"),
    ctr: parseFloat(d.ctr ?? "0"),
    cpc: parseFloat(d.cpc ?? "0"),
  };
}

export async function getCampaigns(datePreset = "last_30d"): Promise<Campaign[]> {
  if (!token() || !adAccount()) return [];

  const fields = [
    "id",
    "name",
    "status",
    "objective",
    "daily_budget",
    "lifetime_budget",
    `insights.date_preset(${datePreset}){${INSIGHT_FIELDS}}`,
  ].join(",");

  const params = new URLSearchParams({
    fields,
    access_token: token(),
    limit: "50",
    effective_status: JSON.stringify(["ACTIVE", "PAUSED"]),
  });

  const res = await fetch(`${BASE}/${adAccount()}/campaigns?${params}`, {
    next: { revalidate: 300 },
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  return (data.data ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    status: c.status as CampaignStatus,
    objective: c.objective ?? "",
    daily_budget: c.daily_budget ? parseInt(c.daily_budget) / 100 : undefined,
    lifetime_budget: c.lifetime_budget ? parseInt(c.lifetime_budget) / 100 : undefined,
    insights: parseInsights(c.insights),
  }));
}

export async function getAccountSummary(datePreset = "last_30d"): Promise<AccountSummary> {
  if (!token() || !adAccount()) {
    return { spend: 0, impressions: 0, clicks: 0, leads: 0, cpl: 0, ctr: 0 };
  }

  const params = new URLSearchParams({
    date_preset: datePreset,
    fields: INSIGHT_FIELDS,
    access_token: token(),
  });

  const res = await fetch(`${BASE}/${adAccount()}/insights?${params}`, {
    next: { revalidate: 300 },
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  const d = data.data?.[0];
  if (!d) return { spend: 0, impressions: 0, clicks: 0, leads: 0, cpl: 0, ctr: 0 };

  const leadAction = d.actions?.find((a: any) => LEAD_ACTIONS.includes(a.action_type));
  const leadCost = d.cost_per_action_type?.find((a: any) =>
    LEAD_ACTIONS.includes(a.action_type)
  );

  return {
    spend: parseFloat(d.spend ?? "0"),
    impressions: parseInt(d.impressions ?? "0"),
    clicks: parseInt(d.clicks ?? "0"),
    leads: parseInt(leadAction?.value ?? "0"),
    cpl: parseFloat(leadCost?.value ?? "0"),
    ctr: parseFloat(d.ctr ?? "0"),
  };
}

export async function getAdSets(campaignId: string, datePreset = "last_30d"): Promise<AdSet[]> {
  if (!token()) return [];

  const fields = [
    "id",
    "name",
    "status",
    "daily_budget",
    "lifetime_budget",
    `insights.date_preset(${datePreset}){${INSIGHT_FIELDS}}`,
  ].join(",");

  const params = new URLSearchParams({
    fields,
    access_token: token(),
    limit: "20",
  });

  const res = await fetch(`${BASE}/${campaignId}/adsets?${params}`, {
    cache: "no-store",
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  return (data.data ?? []).map((s: any) => ({
    id: s.id,
    name: s.name,
    status: s.status as CampaignStatus,
    daily_budget: s.daily_budget ? parseInt(s.daily_budget) / 100 : undefined,
    lifetime_budget: s.lifetime_budget ? parseInt(s.lifetime_budget) / 100 : undefined,
    insights: parseInsights(s.insights),
  }));
}
