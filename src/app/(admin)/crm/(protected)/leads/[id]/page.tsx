import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { LeadDetail } from "@/components/crm/LeadDetail";
import type { Lead, LeadFile, LeadNote, Visit } from "@/types";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/crm/login");

  const service = createServiceClient();

  const [
    { data: leadData },
    { data: profileData },
    { data: profilesData },
    { data: visitsData },
    { data: notesData },
    { data: filesData },
  ] = await Promise.all([
    service.from("leads").select("*").eq("id", id).single(),
    service.from("profiles").select("role").eq("id", user.id).single(),
    service.from("profiles").select("id, full_name").order("full_name"),
    service.from("visits").select("*").eq("lead_id", id).order("scheduled_at"),
    service.from("lead_notes").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
    service.from("lead_files").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
  ]);

  if (!leadData) notFound();

  const lead = leadData as Lead;
  const visits = (visitsData ?? []) as Visit[];
  const notes = (notesData ?? []) as LeadNote[];
  const files = (filesData ?? []) as LeadFile[];
  const profiles = (profilesData ?? []) as { id: string; full_name: string }[];
  const isAdmin = profileData?.role === "admin";

  return (
    <LeadDetail
      lead={lead}
      visits={visits}
      notes={notes}
      files={files}
      profiles={profiles}
      isAdmin={isAdmin}
      currentUserId={user.id}
    />
  );
}
