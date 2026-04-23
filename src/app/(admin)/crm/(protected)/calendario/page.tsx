import { createClient } from "@/lib/supabase/server";
import { CalendarView } from "@/components/crm/CalendarView";
import type { Visit } from "@/types";

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
  const supabase = await createClient();

  const [{ data: visitsData }, { data: leadsData }, { data: profilesData }] = await Promise.all([
    supabase
      .from("visits")
      .select("*")
      .order("scheduled_at"),
    supabase
      .from("leads")
      .select("id, name"),
    supabase
      .from("profiles")
      .select("id, full_name"),
  ]);

  const visits = (visitsData ?? []) as Visit[];
  const leads = (leadsData ?? []) as { id: string; name: string }[];
  const profiles = (profilesData ?? []) as { id: string; full_name: string }[];

  const enriched = visits.map((v) => ({
    ...v,
    leadName: leads.find((l) => l.id === v.lead_id)?.name ?? "Lead desconocido",
    agentName: v.agent_id ? profiles.find((p) => p.id === v.agent_id)?.full_name : undefined,
  }));

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Calendario</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{visits.length} visita{visits.length !== 1 ? "s" : ""} programada{visits.length !== 1 ? "s" : ""}</p>
      </div>

      <CalendarView visits={enriched} />
    </div>
  );
}
