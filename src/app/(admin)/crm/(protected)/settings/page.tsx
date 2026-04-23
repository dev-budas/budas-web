import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/crm/ProfileForm";
import { Shield, User } from "lucide-react";

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
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Equipo</h2>
                <p className="text-xs text-muted-foreground">{(team ?? []).length} miembro{(team ?? []).length !== 1 ? "s" : ""}</p>
              </div>
            </div>

            <div className="divide-y divide-border">
              {(team ?? []).map((member) => (
                <div key={member.id} className="flex items-center gap-3 py-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {member.full_name?.charAt(0).toUpperCase() ?? "?"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{member.full_name ?? "—"}</p>
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-border/60 text-muted-foreground capitalize">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-muted-foreground bg-border/30 rounded-lg px-3 py-2.5">
              Para añadir o eliminar usuarios, usa el panel de autenticación de Supabase →{" "}
              <span className="font-medium text-foreground">Authentication → Users</span>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
