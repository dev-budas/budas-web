import { createClient } from "@/lib/supabase/server";
import { PipelineBoard } from "@/components/crm/PipelineBoard";
import type { Lead } from "@/types";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: leadsData },
    { data: profilesData },
    { data: profileData },
  ] = await Promise.all([
    supabase.from("leads").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name").order("full_name"),
    user ? supabase.from("profiles").select("role").eq("id", user.id).single() : Promise.resolve({ data: null }),
  ]);

  const leads = (leadsData ?? []) as Lead[];
  const profiles = (profilesData ?? []) as { id: string; full_name: string }[];
  const isAdmin = profileData?.role === "admin";

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{leads.length} leads en total</p>
      </div>

      <PipelineBoard leads={leads} profiles={profiles} isAdmin={isAdmin} />
    </div>
  );
}
