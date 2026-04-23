import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { LEAD_STATUS_CONFIG } from "@/types";
import type { Lead } from "@/types";
import { Search } from "lucide-react";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const supabase = await createClient();
  const service = createServiceClient();
  const { status, q } = await searchParams;

  let query = service
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const [{ data }, { data: profilesData }] = await Promise.all([
    query,
    service.from("profiles").select("id, full_name"),
  ]);

  const leads = (data ?? []) as Lead[];
  const profileMap = Object.fromEntries(
    ((profilesData ?? []) as { id: string; full_name: string }[]).map((p) => [p.id, p.full_name])
  );

  const filtered = q
    ? leads.filter(
        (l) =>
          l.name.toLowerCase().includes(q.toLowerCase()) ||
          l.phone.includes(q) ||
          l.property_city?.toLowerCase().includes(q.toLowerCase())
      )
    : leads;

  const statuses = Object.entries(LEAD_STATUS_CONFIG);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Leads</h1>
        <span className="text-sm text-muted-foreground">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <form>
            <input
              name="q"
              defaultValue={q}
              placeholder="Nombre, teléfono, ciudad..."
              className="w-full h-9 pl-8 pr-3 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {status && <input type="hidden" name="status" value={status} />}
          </form>
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap gap-1.5">
          <a
            href={q ? `/crm/leads?q=${q}` : "/crm/leads"}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              !status ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            Todos
          </a>
          {statuses.map(([key, cfg]) => (
            <a
              key={key}
              href={`/crm/leads?status=${key}${q ? `&q=${q}` : ""}`}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                status === key
                  ? "text-white border-transparent"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
              style={status === key ? { backgroundColor: cfg.color, borderColor: cfg.color } : {}}
            >
              {cfg.label}
            </a>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">
            No se encontraron leads.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-border/20">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lead</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Propiedad</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Agente</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((lead) => {
                  const config = LEAD_STATUS_CONFIG[lead.status];
                  if (!config) return null;
                  return (
                    <tr key={lead.id} className="hover:bg-border/20 transition-colors">
                      <td className="px-5 py-4">
                        <a href={`/crm/leads/${lead.id}`} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary">
                              {lead.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{lead.name}</p>
                            <p className="text-xs text-muted-foreground">{lead.phone}</p>
                          </div>
                        </a>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <a href={`/crm/leads/${lead.id}`} className="block">
                          <p className="text-foreground">{lead.property_city ?? "—"}</p>
                          <p className="text-xs text-muted-foreground capitalize">{lead.property_type?.replace("_", " ") ?? "—"}</p>
                        </a>
                      </td>
                      <td className="px-5 py-4">
                        <a href={`/crm/leads/${lead.id}`} className="block">
                          <span
                            className="text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
                            style={{ backgroundColor: `${config.color}18`, color: config.color }}
                          >
                            {config.label}
                          </span>
                        </a>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell text-xs text-muted-foreground">
                        <a href={`/crm/leads/${lead.id}`} className="block">
                          {lead.assigned_agent ? (profileMap[lead.assigned_agent] ?? "—") : "Sin asignar"}
                        </a>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell text-xs text-muted-foreground">
                        <a href={`/crm/leads/${lead.id}`} className="block">
                          {new Date(lead.created_at).toLocaleDateString("es-ES", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
