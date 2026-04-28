const BASE = "https://graph.facebook.com/v21.0";

function token() {
  return process.env.META_ADS_ACCESS_TOKEN ?? "";
}
function adAccount() {
  const id = process.env.META_AD_ACCOUNT_ID ?? "";
  return id.startsWith("act_") ? id : `act_${id}`;
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

const EMPTY_INSIGHTS: CampaignInsights = {
  spend: 0,
  impressions: 0,
  clicks: 0,
  leads: 0,
  cpl: 0,
  ctr: 0,
  cpc: 0,
};

function parseInsightsRow(d: any): CampaignInsights {
  if (!d) return EMPTY_INSIGHTS;
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

  const campaignParams = new URLSearchParams({
    fields: "id,name,status,objective,daily_budget,lifetime_budget",
    access_token: token(),
    limit: "50",
  });

  const insightParams = new URLSearchParams({
    date_preset: datePreset,
    level: "campaign",
    fields: `campaign_id,${INSIGHT_FIELDS}`,
    access_token: token(),
    limit: "50",
  });

  const [campaignsRes, insightsRes] = await Promise.all([
    fetch(`${BASE}/${adAccount()}/campaigns?${campaignParams}`, {
      next: { revalidate: 300 },
    }),
    fetch(`${BASE}/${adAccount()}/insights?${insightParams}`, {
      next: { revalidate: 300 },
    }),
  ]);

  const [campaignsData, insightsData] = await Promise.all([
    campaignsRes.json(),
    insightsRes.json(),
  ]);

  if (campaignsData.error) throw new Error(campaignsData.error.message);
  // Insights error is non-fatal — campaigns may have no spend yet
  const insightsMap: Record<string, CampaignInsights> = {};
  for (const row of insightsData.data ?? []) {
    insightsMap[row.campaign_id] = parseInsightsRow(row);
  }

  return (campaignsData.data ?? [])
    .filter((c: any) => c.status !== "DELETED")
    .map((c: any) => ({
    id: c.id,
    name: c.name,
    status: c.status as CampaignStatus,
    objective: c.objective ?? "",
    daily_budget: c.daily_budget ? parseInt(c.daily_budget) / 100 : undefined,
    lifetime_budget: c.lifetime_budget ? parseInt(c.lifetime_budget) / 100 : undefined,
    insights: insightsMap[c.id] ?? EMPTY_INSIGHTS,
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

  const ins = parseInsightsRow(d);
  return {
    spend: ins.spend,
    impressions: ins.impressions,
    clicks: ins.clicks,
    leads: ins.leads,
    cpl: ins.cpl,
    ctr: ins.ctr,
  };
}

export async function getAdSets(campaignId: string, datePreset = "last_30d"): Promise<AdSet[]> {
  if (!token() || !adAccount()) return [];

  const adsetParams = new URLSearchParams({
    fields: "id,name,status,daily_budget,lifetime_budget",
    access_token: token(),
    limit: "20",
  });

  const insightBase = new URLSearchParams({
    date_preset: datePreset,
    level: "adset",
    fields: `adset_id,${INSIGHT_FIELDS}`,
    access_token: token(),
    limit: "20",
  });
  const insightUrl =
    `${BASE}/${adAccount()}/insights?${insightBase}` +
    `&filtering=[{"field":"campaign.id","operator":"IN","value":["${campaignId}"]}]`;

  const [adsetsRes, insightsRes] = await Promise.all([
    fetch(`${BASE}/${campaignId}/adsets?${adsetParams}`, { cache: "no-store" }),
    fetch(insightUrl, { cache: "no-store" }),
  ]);

  const [adsetsData, insightsData] = await Promise.all([
    adsetsRes.json(),
    insightsRes.json(),
  ]);

  if (adsetsData.error) throw new Error(adsetsData.error.message);

  const insightsMap: Record<string, CampaignInsights> = {};
  for (const row of insightsData.data ?? []) {
    insightsMap[row.adset_id] = parseInsightsRow(row);
  }

  return (adsetsData.data ?? []).map((s: any) => ({
    id: s.id,
    name: s.name,
    status: s.status as CampaignStatus,
    daily_budget: s.daily_budget ? parseInt(s.daily_budget) / 100 : undefined,
    lifetime_budget: s.lifetime_budget ? parseInt(s.lifetime_budget) / 100 : undefined,
    insights: insightsMap[s.id] ?? EMPTY_INSIGHTS,
  }));
}

/* ─── Daily insights (chart) ─────────────────────────────────────────────── */

export interface DailyInsight {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
}

export async function getDailyInsights(datePreset = "last_30d"): Promise<DailyInsight[]> {
  if (!token() || !adAccount()) return [];

  const params = new URLSearchParams({
    date_preset: datePreset,
    time_increment: "1",
    fields: "spend,impressions,clicks,actions",
    access_token: token(),
    limit: "90",
  });

  const res = await fetch(`${BASE}/${adAccount()}/insights?${params}`, {
    next: { revalidate: 300 },
  });
  const data = await res.json();
  if (data.error) return [];

  return (data.data ?? []).map((d: any) => ({
    date: d.date_start as string,
    spend: parseFloat(d.spend ?? "0"),
    impressions: parseInt(d.impressions ?? "0"),
    clicks: parseInt(d.clicks ?? "0"),
    leads: parseInt(
      d.actions?.find((a: any) => LEAD_ACTIONS.includes(a.action_type))?.value ?? "0"
    ),
  }));
}

/* ─── Audience breakdown ─────────────────────────────────────────────────── */

export interface AudienceRow {
  key: string;
  label: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
}

const BREAKDOWN_LABELS: Record<string, Record<string, string>> = {
  gender: { male: "Hombres", female: "Mujeres", unknown: "Desconocido" },
  device_platform: {
    mobile_app: "App móvil",
    desktop: "Escritorio",
    mobile_web: "Web móvil",
    instagram: "Instagram",
    facebook: "Facebook",
    messenger: "Messenger",
    audience_network: "Audience Network",
  },
};

function breakdownLabel(type: string, value: string): string {
  return BREAKDOWN_LABELS[type]?.[value] ?? value;
}

export async function getAudienceBreakdown(
  breakdown: "age" | "gender" | "region" | "device_platform",
  datePreset = "last_30d"
): Promise<AudienceRow[]> {
  if (!token() || !adAccount()) return [];

  const params = new URLSearchParams({
    date_preset: datePreset,
    breakdowns: breakdown,
    fields: `spend,impressions,clicks,actions,${breakdown}`,
    access_token: token(),
    limit: "50",
  });

  const res = await fetch(`${BASE}/${adAccount()}/insights?${params}`, {
    cache: "no-store",
  });
  const data = await res.json();
  if (data.error) return [];

  return (data.data ?? [])
    .map((d: any) => ({
      key: d[breakdown] as string,
      label: breakdownLabel(breakdown, d[breakdown]),
      spend: parseFloat(d.spend ?? "0"),
      impressions: parseInt(d.impressions ?? "0"),
      clicks: parseInt(d.clicks ?? "0"),
      leads: parseInt(
        d.actions?.find((a: any) => LEAD_ACTIONS.includes(a.action_type))?.value ?? "0"
      ),
    }))
    .sort((a: AudienceRow, b: AudienceRow) => b.spend - a.spend);
}

/* ─── Ads ────────────────────────────────────────────────────────────────── */

export interface Ad {
  id: string;
  name: string;
  status: string;
  thumbnail_url?: string;
  headline?: string;
  body?: string;
  insights: CampaignInsights;
}

export async function getAds(adsetId: string, datePreset = "last_30d"): Promise<Ad[]> {
  if (!token() || !adAccount()) return [];

  const adParams = new URLSearchParams({
    fields: "id,name,status,creative{thumbnail_url,body,title,object_story_spec}",
    access_token: token(),
    limit: "20",
  });

  const insightBase = new URLSearchParams({
    date_preset: datePreset,
    level: "ad",
    fields: `ad_id,${INSIGHT_FIELDS}`,
    access_token: token(),
    limit: "20",
  });
  const insightUrl =
    `${BASE}/${adAccount()}/insights?${insightBase}` +
    `&filtering=[{"field":"adset.id","operator":"IN","value":["${adsetId}"]}]`;

  const [adsRes, insightsRes] = await Promise.all([
    fetch(`${BASE}/${adsetId}/ads?${adParams}`, { cache: "no-store" }),
    fetch(insightUrl, { cache: "no-store" }),
  ]);

  const [adsData, insightsData] = await Promise.all([
    adsRes.json(),
    insightsRes.json(),
  ]);

  if (adsData.error) throw new Error(adsData.error.message);

  const insightsMap: Record<string, CampaignInsights> = {};
  for (const row of insightsData.data ?? []) {
    insightsMap[row.ad_id] = parseInsightsRow(row);
  }

  return (adsData.data ?? [])
    .filter((a: any) => a.status !== "DELETED")
    .map((a: any) => {
      const creative = a.creative;
      const linkData = creative?.object_story_spec?.link_data;
      return {
        id: a.id,
        name: a.name,
        status: a.status as string,
        thumbnail_url: creative?.thumbnail_url ?? linkData?.picture ?? undefined,
        headline: creative?.title ?? linkData?.name ?? undefined,
        body: creative?.body ?? linkData?.message ?? undefined,
        insights: insightsMap[a.id] ?? EMPTY_INSIGHTS,
      };
    });
}
