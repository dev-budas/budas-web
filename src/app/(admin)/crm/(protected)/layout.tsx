import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CRMSidebar } from "@/components/crm/Sidebar";
import { getEffectivePermissions } from "@/lib/permissions";

export default async function CRMLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/crm/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const permissions = await getEffectivePermissions(user.id, profile?.role ?? "agent");

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F0EDE7" }}>
      <CRMSidebar
        userEmail={user.email}
        userName={profile?.full_name}
        userRole={profile?.role}
        permissions={permissions}
      />
      <main
        className="flex-1 overflow-y-auto"
        style={{
          background: "linear-gradient(180deg, #F4F1EB 0%, #EEE9E1 100%)",
          boxShadow: "inset 2px 0 8px rgba(0,0,0,0.04)",
        }}
      >
        {children}
      </main>
    </div>
  );
}
