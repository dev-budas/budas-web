import { createClient } from "@/lib/supabase/server";
import { LEAD_STATUS_CONFIG } from "@/types";
import { Users, TrendingUp, MessageSquare, CalendarCheck } from "lucide-react";
import type { Lead, Visit } from "@/types";

export const dynamic = "force-dynamic";

/* ── SVG Donut Chart ───────────────────────────────────────────────────────── */
function DonutChart({ leads }: { leads: Lead[] }) {
  const total = leads.length;

  const segments = Object.entries(LEAD_STATUS_CONFIG)
    .map(([key, cfg]) => ({
      status: key,
      label: cfg.label,
      color: cfg.color,
      value: leads.filter((l) => l.status === key).length,
    }))
    .filter((s) => s.value > 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        Sin datos
      </div>
    );
  }

  let cumulative = 0;

  return (
    <div className="flex items-center gap-6">
      {/* SVG donut */}
      <div className="relative flex-shrink-0 w-28 h-28">
        <svg viewBox="0 0 42 42" className="w-full h-full">
          {/* Background track */}
          <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#E2DDD5" strokeWidth="3.5" />
          {segments.map((seg, i) => {
            const pct = (seg.value / total) * 100;
            const rotation = cumulative * 3.6 - 90;
            cumulative += pct;
            return (
              <circle
                key={i}
                cx="21" cy="21" r="15.9155"
                fill="none"
                stroke={seg.color}
                strokeWidth="3.5"
                strokeDasharray={`${pct} ${100 - pct}`}
                transform={`rotate(${rotation} 21 21)`}
              />
            );
          })}
          {/* Center label */}
          <text x="21" y="19.5" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#1A1814">{total}</text>
          <text x="21" y="24.5" textAnchor="middle" fontSize="3.5" fill="#6B6560">leads</text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex-1 grid grid-cols-1 gap-1 min-w-0">
        {segments.slice(0, 6).map((seg) => (
          <div key={seg.status} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-xs text-muted-foreground truncate">{seg.label}</span>
            </div>
            <span className="text-xs font-semibold text-foreground flex-shrink-0">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Upcoming Visits ───────────────────────────────────────────────────────── */
function UpcomingVisits({
  visits,
  leads,
}: {
  visits: Visit[];
  leads: { id: string; name: string }[];
}) {
  const now = new Date();
  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const upcoming = visits
    .filter((v) => {
      const d = new Date(v.scheduled_at);
      return d >= now && d <= in7days && v.status !== "cancelled";
    })
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 5);

  const VISIT_STATUS_COLORS: Record<string, string> = {
    pending:   "#F59E0B",
    confirmed: "#3B82F6",
    completed: "#10B981",
    cancelled: "#9CA3AF",
  };

  if (upcoming.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        Sin visitas esta semana
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {upcoming.map((v) => {
        const lead = leads.find((l) => l.id === v.lead_id);
        const d = new Date(v.scheduled_at);
        const color = VISIT_STATUS_COLORS[v.status] ?? "#9CA3AF";
        return (
          <a
            key={v.id}
            href={`/crm/leads/${v.lead_id}`}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-border/40 flex flex-col items-center justify-center flex-shrink-0 group-hover:bg-primary/8 transition-colors">
              <span className="text-[10px] font-bold text-foreground leading-none">
                {d.getDate()}
              </span>
              <span className="text-[9px] text-muted-foreground uppercase">
                {d.toLocaleDateString("es-ES", { month: "short" })}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {lead?.name ?? "Lead"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                {v.address ? ` · ${v.address}` : ""}
              </p>
            </div>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          </a>
        );
      })}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────────── */
export default async function CRMDashboard() {
  const supabase = await createClient();

  const [{ data: leadsData }, { data: visitsData }] = await Promise.all([
    supabase.from("leads").select("*").order("created_at", { ascending: false }),
    supabase.from("visits").select("*").order("scheduled_at"),
  ]);

  const all = (leadsData ?? []) as Lead[];
  const visits = (visitsData ?? []) as Visit[];
  const leadIndex = all.map((l) => ({ id: l.id, name: l.name }));

  const stats = {
    total:       all.length,
    calificados: all.filter((l) => l.status === "calificado").length,
    activos:     all.filter((l) => ["bot_enviado", "respondio", "en_seguimiento"].includes(l.status)).length,
    captados:    all.filter((l) => l.status === "captado").length,
  };

  const recent = all.slice(0, 6);

  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1 capitalize">{today}</p>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total leads",    value: stats.total,       icon: Users,         color: "text-blue-600",   bg: "bg-blue-50" },
          { label: "Calificados",    value: stats.calificados, icon: TrendingUp,    color: "text-accent",     bg: "bg-accent/10" },
          { label: "Conversaciones", value: stats.activos,     icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Captados",       value: stats.captados,    icon: CalendarCheck, color: "text-primary",    bg: "bg-primary/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-surface border border-border/60 rounded-2xl p-5 shadow-sm">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Chart + Upcoming visits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

        {/* Status distribution */}
        <div className="bg-surface border border-border/60 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-4">Distribución por estado</h2>
          <DonutChart leads={all} />
        </div>

        {/* Upcoming visits */}
        <div className="bg-surface border border-border/60 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Próximas visitas</h2>
            <a href="/crm/calendario" className="text-xs text-accent hover:underline">Ver calendario →</a>
          </div>
          <UpcomingVisits visits={visits} leads={leadIndex} />
        </div>
      </div>

      {/* Recent leads */}
      <div className="bg-surface border border-border/60 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Leads recientes</h2>
          <a href="/crm/leads" className="text-xs text-accent hover:underline">Ver todos →</a>
        </div>
        <div className="divide-y divide-border">
          {recent.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">No hay leads todavía.</p>
          ) : (
            recent.map((lead) => {
              const config = LEAD_STATUS_CONFIG[lead.status];
              if (!config) return null;
              return (
                <a
                  key={lead.id}
                  href={`/crm/leads/${lead.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-border/30 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">{lead.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{lead.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{lead.property_city} · {lead.phone}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: `${config.color}18`, color: config.color }}
                    >
                      {config.label}
                    </span>
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {new Date(lead.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </a>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
