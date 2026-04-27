import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getEffectivePermissions } from "@/lib/permissions";
import { LEAD_STATUS_CONFIG } from "@/types";
import type { Lead } from "@/types";
import {
  Phone,
  MapPin,
  Calendar,
  User,
  Search,
  Building2,
} from "lucide-react";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const authClient = await createClient();
  const service = createServiceClient();
  const { q, status } = await searchParams;

  const { data: { user } } = await authClient.auth.getUser();
  const { data: profile } = await authClient
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  const permissions = await getEffectivePermissions(user!.id, profile?.role ?? "agent");

  let query = service
    .from("leads")
    .select("*")
    .in("status", ["cliente", "captado"])
    .order("updated_at", { ascending: false });

  if (!permissions.see_all_leads) {
    query = query.eq("assigned_agent", user!.id);
  }

  if (status && (status === "cliente" || status === "captado")) {
    query = query.eq("status", status);
  }

  const [{ data: leadsData }, { data: visitsData }, { data: profilesData }] = await Promise.all([
    query,
    service
      .from("visits")
      .select("lead_id, scheduled_at, address, status")
      .eq("status", "pending")
      .order("scheduled_at", { ascending: true }),
    service.from("profiles").select("id, full_name"),
  ]);

  const leads = (leadsData ?? []) as Lead[];
  const profileMap = Object.fromEntries(
    ((profilesData ?? []) as { id: string; full_name: string }[]).map((p) => [p.id, p.full_name])
  );

  // Map upcoming visits by lead_id
  const upcomingVisits: Record<string, { scheduled_at: string; address?: string }> = {};
  for (const v of visitsData ?? []) {
    if (!upcomingVisits[v.lead_id]) {
      upcomingVisits[v.lead_id] = { scheduled_at: v.scheduled_at, address: v.address };
    }
  }

  const filtered = q
    ? leads.filter(
        (l) =>
          l.name.toLowerCase().includes(q.toLowerCase()) ||
          l.phone.includes(q) ||
          l.property_city?.toLowerCase().includes(q.toLowerCase()) ||
          l.property_address?.toLowerCase().includes(q.toLowerCase())
      )
    : leads;

  const clienteCount = leads.filter((l) => l.status === "cliente").length;
  const captadoCount = leads.filter((l) => l.status === "captado").length;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Propietarios con visita agendada o propiedad captada
        </p>
      </div>

      {/* Stats pills */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-4 py-2">
          <span className="w-2 h-2 rounded-full bg-[#059669]" />
          <span className="text-sm text-muted-foreground">Cliente</span>
          <span className="text-sm font-semibold text-foreground">{clienteCount}</span>
        </div>
        <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-4 py-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">Captado</span>
          <span className="text-sm font-semibold text-foreground">{captadoCount}</span>
        </div>
        <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-4 py-2">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-sm font-semibold text-foreground">{leads.length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <form>
            <input
              name="q"
              defaultValue={q}
              placeholder="Nombre, teléfono, dirección..."
              className="w-full h-9 pl-8 pr-3 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {status && <input type="hidden" name="status" value={status} />}
          </form>
        </div>

        <div className="flex gap-1.5">
          <a
            href={q ? `/crm/clientes?q=${q}` : "/crm/clientes"}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              !status ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            Todos
          </a>
          {(["cliente", "captado"] as const).map((s) => {
            const cfg = LEAD_STATUS_CONFIG[s];
            return (
              <a
                key={s}
                href={`/crm/clientes?status=${s}${q ? `&q=${q}` : ""}`}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  status === s
                    ? "text-white border-transparent"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
                style={status === s ? { backgroundColor: cfg.color, borderColor: cfg.color } : {}}
              >
                {cfg.label}
              </a>
            );
          })}
        </div>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">No hay clientes que coincidan con tu búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((lead) => {
            const cfg = LEAD_STATUS_CONFIG[lead.status];
            const visit = upcomingVisits[lead.id];
            const agentName = lead.assigned_agent ? (profileMap[lead.assigned_agent] ?? null) : null;

            return (
              <a
                key={lead.id}
                href={`/crm/leads/${lead.id}`}
                className="group bg-surface border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all duration-200 flex flex-col gap-4"
              >
                {/* Top row: avatar + status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">
                        {lead.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm leading-tight group-hover:text-primary transition-colors">
                        {lead.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{lead.phone}</p>
                    </div>
                  </div>
                  {cfg && (
                    <span
                      className="text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0"
                      style={{ backgroundColor: `${cfg.color}18`, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                  )}
                </div>

                {/* Property info */}
                <div className="space-y-1.5">
                  {(lead.property_city || lead.property_type) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="capitalize">
                        {[lead.property_type?.replace("_", " "), lead.property_city]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </div>
                  )}
                  {lead.property_address && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{lead.property_address}</span>
                    </div>
                  )}
                  {lead.estimated_value && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Valoración:</span>
                      <span className="font-medium text-foreground">
                        {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(lead.estimated_value)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-border" />

                {/* Bottom: visit + agent */}
                <div className="space-y-1.5">
                  {visit ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-accent" />
                      <span>
                        Visita:{" "}
                        <span className="font-medium text-foreground">
                          {new Date(visit.scheduled_at).toLocaleString("es-ES", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Sin visita pendiente</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{agentName ?? "Sin asignar"}</span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
