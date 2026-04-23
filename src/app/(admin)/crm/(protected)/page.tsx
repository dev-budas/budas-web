import { createClient } from "@/lib/supabase/server";
import { LEAD_STATUS_CONFIG } from "@/types";
import { Users, TrendingUp, MessageSquare, CalendarCheck } from "lucide-react";
import type { Lead } from "@/types";

export default async function CRMDashboard() {
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  const all = (leads ?? []) as Lead[];

  const stats = {
    total:       all.length,
    calificados: all.filter((l) => l.status === "calificado").length,
    activos:     all.filter((l) => ["bot_enviado", "respondio", "en_seguimiento"].includes(l.status)).length,
    captados:    all.filter((l) => l.status === "captado").length,
  };

  const recent = all.slice(0, 8);

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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total leads",    value: stats.total,       icon: Users,         color: "text-blue-600",  bg: "bg-blue-50" },
          { label: "Calificados",    value: stats.calificados, icon: TrendingUp,    color: "text-accent",    bg: "bg-accent/10" },
          { label: "Conversaciones", value: stats.activos,     icon: MessageSquare, color: "text-purple-600",bg: "bg-purple-50" },
          { label: "Captados",       value: stats.captados,    icon: CalendarCheck, color: "text-primary",   bg: "bg-primary/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-surface border border-border rounded-xl p-5">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent Leads */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Leads recientes</h2>
          <a href="/crm/leads" className="text-xs text-accent hover:underline">Ver todos →</a>
        </div>
        <div className="divide-y divide-border">
          {recent.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              No hay leads todavía.
            </p>
          ) : (
            recent.map((lead) => {
              const config = LEAD_STATUS_CONFIG[lead.status];
              return (
                <a
                  key={lead.id}
                  href={`/crm/leads/${lead.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-border/30 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {lead.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{lead.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {lead.property_city} · {lead.phone}
                    </p>
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
