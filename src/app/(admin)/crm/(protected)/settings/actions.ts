"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase";

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
  role: "admin" | "agent";
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
  const admin = createServerClient();
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

  const admin = createServerClient();
  const { error } = await admin.auth.admin.deleteUser(targetUserId);
  if (error) return { error: error.message };

  revalidatePath("/crm/settings");
  return { success: true };
}
