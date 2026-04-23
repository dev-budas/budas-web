import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LeadDetail } from "@/components/crm/LeadDetail";
import type { Lead, Visit } from "@/types";

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

  const [
    { data: leadData },
    { data: profileData },
    { data: profilesData },
    { data: visitsData },
  ] = await Promise.all([
    supabase.from("leads").select("*").eq("id", id).single(),
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase.from("profiles").select("id, full_name").order("full_name"),
    supabase.from("visits").select("*").eq("lead_id", id).order("scheduled_at"),
  ]);

  if (!leadData) notFound();

  const lead = leadData as Lead;
  const visits = (visitsData ?? []) as Visit[];
  const profiles = (profilesData ?? []) as { id: string; full_name: string }[];
  const isAdmin = profileData?.role === "admin";

  return (
    <LeadDetail
      lead={lead}
      visits={visits}
      profiles={profiles}
      isAdmin={isAdmin}
      currentUserId={user.id}
    />
  );
}
