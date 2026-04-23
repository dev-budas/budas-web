"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
