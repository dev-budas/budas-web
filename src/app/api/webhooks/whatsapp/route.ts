import { NextRequest, NextResponse } from "next/server";
import { processBotMessage } from "@/lib/bot";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import {
  getLeadByPhone,
  updateLeadStatus,
  appendWhatsAppMessage,
} from "@/lib/supabase";
import { formatPhone } from "@/lib/utils";
import { sendQualifiedLeadEmail, sendUnqualifiedLeadEmail } from "@/lib/email";
import type { WhatsAppWebhookPayload, Lead } from "@/types";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!;

// GET: Meta webhook verification
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// POST: Incoming messages
export async function POST(req: NextRequest) {
  try {
    const payload: WhatsAppWebhookPayload = await req.json();

    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        const { messages } = change.value;
        if (!messages?.length) continue;

        const msg = messages[0];
        if (msg.type !== "text" || !msg.text?.body) continue;

        const fromPhone = formatPhone(msg.from);
        const incomingText = msg.text.body;

        await handleIncomingMessage(fromPhone, incomingText);
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("[Webhook/WhatsApp] Error:", err);
    // Always return 200 to Meta to prevent retries
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}

async function handleIncomingMessage(phone: string, text: string) {
  const lead = await getLeadByPhone(phone);

  if (!lead) {
    console.warn(`[Bot] Received message from unknown phone: ${phone}`);
    return;
  }

  // Don't process if already qualified/disqualified
  if (["calificado", "no_calificado", "captado", "perdido"].includes(lead.status)) {
    return;
  }

  // Update status to "respondió" on first reply
  if (lead.status === "bot_enviado") {
    await updateLeadStatus(lead.id, "respondio");
  }

  // Save incoming message to conversation history
  await appendWhatsAppMessage(lead.id, { role: "lead", content: text });

  // Build conversation history for Claude
  const history = (lead.whatsapp_conversation ?? []).map((m) => ({
    role: m.role === "bot" ? ("assistant" as const) : ("user" as const),
    content: m.content,
  }));

  // Get bot response
  const result = await processBotMessage(history, text);

  // Send bot response to WhatsApp
  if (result.response) {
    await sendWhatsAppMessage(phone, {
      type: "text",
      text: { body: result.response },
    });
    await appendWhatsAppMessage(lead.id, { role: "bot", content: result.response });
  }

  // Handle qualification result
  if (result.conversationEnded && result.qualified !== undefined) {
    const newStatus: Lead["status"] = result.qualified ? "calificado" : "no_calificado";

    const updatePayload: Partial<Lead> = {
      status: newStatus,
      bot_qualified_at: new Date().toISOString(),
      ...result.extractedData,
    };

    const { createServerClient } = await import("@/lib/supabase");
    const client = createServerClient();
    await client
      .from("leads")
      .update(updatePayload)
      .eq("id", lead.id);

    // Notify team by email
    const emailLead = { id: lead.id, name: lead.name, phone: lead.phone, property_city: lead.property_city, property_type: lead.property_type };
    if (result.qualified) {
      await sendQualifiedLeadEmail(emailLead).catch((e) => console.error("[Email] qualified:", e));
    } else {
      await sendUnqualifiedLeadEmail(emailLead).catch((e) => console.error("[Email] unqualified:", e));
    }
  }
}
