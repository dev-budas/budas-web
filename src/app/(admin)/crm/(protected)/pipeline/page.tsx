import { createClient } from "@/lib/supabase/server";
import { PipelineBoard } from "@/components/crm/PipelineBoard";
import type { Lead } from "@/types";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const supabase = await createClient();

  const [{ data: leadsData }, { data: profilesData }] = await Promise.all([
    supabase.from("leads").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name").order("full_name"),
  ]);

  const leads = (leadsData ?? []) as Lead[];
  const profiles = (profilesData ?? []) as { id: string; full_name: string }[];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{leads.length} leads en total</p>
        </div>
      </div>

      <PipelineBoard leads={leads} profiles={profiles} />
    </div>
  );
}
