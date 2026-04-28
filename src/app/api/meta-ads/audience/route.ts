import { createClient } from "@/lib/supabase/server";
import { getAudienceBreakdown } from "@/lib/meta-ads";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const breakdown = searchParams.get("breakdown") as "age" | "gender" | "region" | "device_platform";
  const preset = searchParams.get("preset") ?? "last_30d";

  if (!breakdown) return Response.json({ error: "Missing breakdown" }, { status: 400 });

  const rows = await getAudienceBreakdown(breakdown, preset);
  return Response.json(rows);
}
