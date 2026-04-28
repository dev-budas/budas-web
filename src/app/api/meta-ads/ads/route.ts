import { createClient } from "@/lib/supabase/server";
import { getAds } from "@/lib/meta-ads";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const adsetId = searchParams.get("adsetId");
  const preset = searchParams.get("preset") ?? "last_30d";

  if (!adsetId) return Response.json({ error: "Missing adsetId" }, { status: 400 });

  try {
    const ads = await getAds(adsetId, preset);
    return Response.json(ads);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
