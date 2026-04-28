import { createClient } from "@/lib/supabase/server";
import { LEAD_STATUS_CONFIG } from "@/types";
import type { Lead } from "@/types";

export const dynamic = "force-dynamic";

/* ── Horizontal bar ────────────────────────────────────────────────────────── */
function BarRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-28 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-border/40 rounded-full h-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-semibold text-foreground w-6 text-right flex-shrink-0">{value}</span>
      <span className="text-xs text-muted-foreground w-8 flex-shrink-0">{pct}%</span>
    </div>
  );
}

/* ── Weekly bars ───────────────────────────────────────────────────────────── */
function WeeklyChart({ weeklyData }: { weeklyData: { label: string; count: number }[] }) {
  const max = Math.max(...weeklyData.map((w) => w.count), 1);
  return (
    <div className="flex items-end gap-2 h-24">
      {weeklyData.map((w) => {
        const pct = (w.count / max) * 100;
        return (
          <div key={w.label} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-muted-foreground">{w.count || ""}</span>
            <div className="w-full bg-border/40 rounded-t-md overflow-hidden" style={{ height: "64px" }}>
              <div
                className="w-full bg-primary/70 rounded-t-md transition-all duration-500 mt-auto"
                style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">{w.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default async function EstadisticasPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  const leads = (data ?? []) as Lead[];
  const total = leads.length;

  // Leads por estado
  const byStatus = Object.entries(LEAD_STATUS_CONFIG).map(([key, cfg]) => ({
    status: key,
    label: cfg.label,
    color: cfg.color,
    value: leads.filter((l) => l.status === key).length,
  }));

  // Leads por fuente
  const sourceMap: Record<string, number> = {};
  leads.forEach((l) => {
    const src = l.utm_source ?? "Directo";
    sourceMap[src] = (sourceMap[src] ?? 0) + 1;
  });
  const bySources = Object.entries(sourceMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Leads por tipo de propiedad
  const typeMap: Record<string, number> = {};
  leads.forEach((l) => {
    const t = l.property_type ?? "otro";
    typeMap[t] = (typeMap[t] ?? 0) + 1;
  });
  const byType = Object.entries(typeMap).sort((a, b) => b[1] - a[1]);

  // Últimas 8 semanas
  const now = new Date();
  const weeklyData = Array.from({ length: 8 }, (_, i) => {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (7 - i) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const count = leads.filter((l) => {
      const d = new Date(l.created_at);
      return d >= weekStart && d < weekEnd;
    }).length;
    const label = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
    return { label, count };
  });

  // Tasa de calificación
  const qualified = leads.filter((l) => ["calificado", "en_seguimiento", "visita_agendada", "captado"].includes(l.status)).length;
  const qualRate = total > 0 ? Math.round((qualified / total) * 100) : 0;
  const captados = leads.filter((l) => l.status === "captado").length;
  const captRate = total > 0 ? Math.round((captados / total) * 100) : 0;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Estadísticas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{total} leads en total</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total leads",        value: total,            suffix: "" },
          { label: "Tasa calificación",  value: qualRate,         suffix: "%" },
          { label: "Tasa captación",     value: captRate,         suffix: "%" },
          { label: "Captados",           value: captados,         suffix: "" },
        ].map(({ label, value, suffix }) => (
          <div key={label} className="bg-surface border border-border/60 rounded-2xl shadow-sm p-5 text-center">
            <p className="text-3xl font-bold text-foreground">{value}<span className="text-lg">{suffix}</span></p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* Leads por semana */}
        <div className="bg-surface border border-border/60 rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Leads por semana</h2>
          <WeeklyChart weeklyData={weeklyData} />
        </div>

        {/* Por estado */}
        <div className="bg-surface border border-border/60 rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Por estado</h2>
          <div className="space-y-3">
            {byStatus.filter((s) => s.value > 0).map((s) => (
              <BarRow key={s.status} label={s.label} value={s.value} total={total} color={s.color} />
            ))}
            {byStatus.every((s) => s.value === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">Sin datos</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Por fuente */}
        <div className="bg-surface border border-border/60 rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Por fuente de tráfico</h2>
          <div className="space-y-3">
            {bySources.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin datos</p>
            ) : (
              bySources.map(([src, count]) => (
                <BarRow key={src} label={src} value={count} total={total} color="#1B3A5C" />
              ))
            )}
          </div>
        </div>

        {/* Por tipo de propiedad */}
        <div className="bg-surface border border-border/60 rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Por tipo de propiedad</h2>
          <div className="space-y-3">
            {byType.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin datos</p>
            ) : (
              byType.map(([type, count]) => (
                <BarRow
                  key={type}
                  label={type.replace("_", " ")}
                  value={count}
                  total={total}
                  color="#C9A96E"
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
