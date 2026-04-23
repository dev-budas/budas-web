import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/crm/ProfileForm";
import { TeamPanel } from "@/components/crm/TeamPanel";
import { User } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/crm/login");

  const [{ data: profile }, { data: team }] = await Promise.all([
    supabase.from("profiles").select("full_name, role").eq("id", user.id).single(),
    supabase.from("profiles").select("id, full_name, role").order("full_name"),
  ]);

  const isAdmin = profile?.role === "admin";

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
      </div>

      <div className="space-y-5">

        {/* Profile */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Mi perfil</h2>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <span className="ml-auto text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary capitalize">
              {profile?.role ?? "agent"}
            </span>
          </div>
          <ProfileForm currentName={profile?.full_name ?? ""} />
        </div>

        {/* Team — admin only */}
        {isAdmin && (
          <TeamPanel
            currentUserId={user.id}
            team={(team ?? []) as { id: string; full_name: string; role: string }[]}
          />
        )}
      </div>
    </div>
  );
}
