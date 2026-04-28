"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { RolePermissions, PermissionKey, UserPermissionsOverride } from "@/lib/permissions";
import { PERMISSION_DEFS } from "@/lib/permissions";

export async function updateProfile(formData: FormData) {
  const full_name = (formData.get("full_name") as string)?.trim();
  if (!full_name || full_name.length < 2) return { error: "Nombre demasiado corto" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/crm");
  revalidatePath("/crm/settings");
  return { success: true };
}

export async function createTeamUser(data: {
  full_name: string;
  email: string;
  password: string;
  role: "admin" | "supervisor" | "agent";
}) {
  // Verify caller is admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Solo el admin puede crear usuarios" };

  // Create user via Admin API (requires service role key)
  const admin = createServiceClient();
  const { data: newUser, error: authError } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { full_name: data.full_name },
  });

  if (authError) return { error: authError.message };

  // Upsert profile with role
  await admin
    .from("profiles")
    .upsert({ id: newUser.user.id, full_name: data.full_name, role: data.role });

  revalidatePath("/crm/settings");
  return { success: true };
}

export async function deleteTeamUser(targetUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Solo el admin puede eliminar usuarios" };
  if (targetUserId === user.id) return { error: "No puedes eliminarte a ti mismo" };

  const admin = createServiceClient();
  const { error } = await admin.auth.admin.deleteUser(targetUserId);
  if (error) return { error: error.message };

  revalidatePath("/crm/settings");
  return { success: true };
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Solo el admin puede modificar permisos" as const };
  return { user, error: null };
}

export async function updateRolePermissions(
  role: "admin" | "supervisor" | "agent",
  permissions: Partial<RolePermissions>
) {
  const { error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  if (role === "admin") return { error: "Los permisos de Admin no se pueden modificar" };

  const service = createServiceClient();
  const { error } = await service
    .from("role_permissions")
    .update({
      see_all_leads:   permissions.see_all_leads,
      create_leads:    permissions.create_leads,
      edit_leads:      permissions.edit_leads,
      delete_leads:    permissions.delete_leads,
      reassign_leads:  permissions.reassign_leads,
      manage_pipeline: permissions.manage_pipeline,
      view_stats:      permissions.view_stats,
      updated_at:      new Date().toISOString(),
    })
    .eq("role", role);

  if (error) return { error: error.message };
  revalidatePath("/crm/settings");
  revalidatePath("/crm");
  return { success: true };
}

export async function updateUserPermissions(
  targetUserId: string,
  overrides: Record<PermissionKey, boolean | null>
) {
  const { error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const service = createServiceClient();
  const allNull = PERMISSION_DEFS.every(({ key }) => overrides[key] === null);

  if (allNull) {
    await service.from("user_permissions").delete().eq("user_id", targetUserId);
  } else {
    await service.from("user_permissions").upsert({
      user_id:         targetUserId,
      see_all_leads:   overrides.see_all_leads,
      create_leads:    overrides.create_leads,
      edit_leads:      overrides.edit_leads,
      delete_leads:    overrides.delete_leads,
      reassign_leads:  overrides.reassign_leads,
      manage_pipeline: overrides.manage_pipeline,
      view_stats:      overrides.view_stats,
      updated_at:      new Date().toISOString(),
    });
  }

  revalidatePath("/crm/settings");
  return { success: true };
}
