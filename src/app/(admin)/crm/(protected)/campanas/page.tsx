import { getCampaigns, getAccountSummary, getDailyInsights } from "@/lib/meta-ads";
import type { Campaign, AccountSummary } from "@/lib/meta-ads";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Euro, Users, TrendingUp, MousePointer, AlertCircle } from "lucide-react";
import type { ElementType } from "react";
import CampaignsTable from "@/components/crm/CampaignsTable";
import CampaignChart from "@/components/crm/CampaignChart";
import AudienceBreakdown from "@/components/crm/AudienceBreakdown";

const DATE_PRESETS = [
  { value: "today", label: "Hoy" },
  { value: "yesterday", label: "Ayer" },
  { value: "last_7d", label: "7 días" },
  { value: "last_14d", label: "14 días" },
  { value: "last_30d", label: "30 días" },
  { value: "this_month", label: "Este mes" },
  { value: "last_month", label: "Mes anterior" },
];

export default async function CampanasPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/crm");

  const { preset = "last_30d" } = await searchParams;

  const isConfigured =
    !!process.env.META_AD_ACCOUNT_ID && !!process.env.META_ADS_ACCESS_TOKEN;

  let campaigns: Campaign[] = [];
  let summary: AccountSummary = { spend: 0, impressions: 0, clicks: 0, leads: 0, cpl: 0, ctr: 0 };
  let fetchError: string | null = null;
  let dailyData: Awaited<ReturnType<typeof getDailyInsights>> = [];

  if (isConfigured) {
    const [campaignsResult, summaryResult, dailyResult] = await Promise.allSettled([
      getCampaigns(preset),
      getAccountSummary(preset),
      getDailyInsights(preset),
    ]);
    if (campaignsResult.status === "fulfilled") campaigns = campaignsResult.value;
    else fetchError = campaignsResult.reason instanceof Error ? campaignsResult.reason.message : "Error al conectar con Meta Ads";
    if (summaryResult.status === "fulfilled") summary = summaryResult.value;
    if (dailyResult.status === "fulfilled") dailyData = dailyResult.value;
  }

  const fmtEur = (n: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n);
  const fmtN = (n: number) => new Intl.NumberFormat("es-ES").format(n);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Campañas</h1>
          <p className="text-sm text-muted-foreground">Meta Ads — rendimiento y control</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DATE_PRESETS.map(({ value, label }) => (
            <a
              key={value}
              href={`/crm/campanas?preset=${value}`}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                preset === value
                  ? "bg-primary text-white border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* Not configured */}
      {!isConfigured && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Meta Ads no configurado</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Añade <code className="font-mono bg-amber-100 px-1 rounded">META_AD_ACCOUNT_ID</code> y{" "}
              <code className="font-mono bg-amber-100 px-1 rounded">META_ADS_ACCESS_TOKEN</code> en Vercel.
            </p>
          </div>
        </div>
      )}

      {/* API error */}
      {fetchError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Error al cargar datos</p>
            <p className="text-xs text-red-700 mt-0.5">{fetchError}</p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Gasto total" value={fmtEur(summary.spend)} icon={Euro} color="#1B3A5C" />
        <StatCard label="Leads generados" value={fmtN(summary.leads)} icon={Users} color="#10B981" />
        <StatCard label="Coste por lead" value={summary.leads > 0 ? fmtEur(summary.cpl) : "—"} icon={TrendingUp} color="#C9A96E" />
        <StatCard label="CTR medio" value={summary.ctr > 0 ? `${summary.ctr.toFixed(2)}%` : "—"} icon={MousePointer} color="#8B5CF6" />
      </div>

      {/* Tendencia chart */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Tendencia — Gasto y Leads</h2>
        <CampaignChart data={dailyData} />
      </div>

      {/* Audience breakdown */}
      <AudienceBreakdown datePreset={preset} />

      {/* Campaigns table */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Campañas</h2>
        <CampaignsTable campaigns={campaigns} datePreset={preset} />
      </div>

    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string; icon: ElementType; color: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
