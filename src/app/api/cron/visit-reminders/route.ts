import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendVisitReminderEmail } from "@/lib/email";

// Vercel Cron: runs every 30 minutes (requires Pro plan)
// Sends a reminder email 4 hours before each visit that hasn't been reminded yet.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date();
  const windowStart = new Date(now.getTime() + 3.5 * 60 * 60 * 1000); // 3.5 h from now
  const windowEnd = new Date(now.getTime() + 4.5 * 60 * 60 * 1000);   // 4.5 h from now

  const { data: visits, error } = await supabase
    .from("visits")
    .select("id, lead_id, scheduled_at, address, notes, agent_id")
    .eq("reminder_sent", false)
    .eq("status", "pending")
    .gte("scheduled_at", windowStart.toISOString())
    .lte("scheduled_at", windowEnd.toISOString());

  if (error) {
    console.error("[Cron/visit-reminders] query error:", error.message);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const visit of visits ?? []) {
    try {
      const { data: lead } = await supabase
        .from("leads")
        .select("id, name, phone, property_city, property_type")
        .eq("id", visit.lead_id)
        .single();

      if (!lead) continue;

      // Get agent email (agent_id may be null — fall back to all team)
      let agentEmail: string | null = null;
      if (visit.agent_id) {
        const { data: { user } } = await supabase.auth.admin.getUserById(visit.agent_id);
        agentEmail = user?.email ?? null;
      }

      if (!agentEmail) continue;

      await sendVisitReminderEmail(visit, lead, agentEmail);

      await supabase
        .from("visits")
        .update({ reminder_sent: true })
        .eq("id", visit.id);

      sent++;
    } catch (e) {
      console.error(`[Cron/visit-reminders] failed for visit=${visit.id}:`, e);
      failed++;
    }
  }

  console.log(`[Cron/visit-reminders] sent=${sent} failed=${failed}`);
  return NextResponse.json({ sent, failed });
}
