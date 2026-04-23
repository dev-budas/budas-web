import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CRMSidebar } from "@/components/crm/Sidebar";

export default async function CRMLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/crm/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <CRMSidebar
        userEmail={user.email}
        userName={profile?.full_name}
        userRole={profile?.role}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
