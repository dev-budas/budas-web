import { createClient } from "@/lib/supabase/server";
import { getAdSets } from "@/lib/meta-ads";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get("campaignId");
  const preset = searchParams.get("preset") ?? "last_30d";

  if (!campaignId) {
    return Response.json({ error: "Missing campaignId" }, { status: 400 });
  }

  try {
    const adSets = await getAdSets(campaignId, preset);
    return Response.json(adSets);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}
