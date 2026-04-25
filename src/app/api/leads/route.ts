import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createLead } from "@/lib/supabase";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { formatPhone } from "@/lib/utils";
import { checkRateLimit } from "@/lib/ratelimit";

const leadSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(9),
  email: z.string().email().optional().or(z.literal("")),
  property_type: z.enum(["piso", "casa", "chalet", "local_comercial", "terreno", "otro"]),
  property_city: z.string().min(2),
  property_address: z.string().min(3).optional(),
  rooms: z.coerce.number().int().min(1).max(20).optional(),
  bathrooms: z.coerce.number().int().min(1).max(10).optional(),
  utm_source: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_medium: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const { allowed, retryAfterSeconds } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { message: "Demasiadas solicitudes. Inténtalo más tarde." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  try {
    const body = await req.json();
    const parsed = leadSchema.safeParse(body);

    if (!parsed.success) {
      console.error("[API /leads] Validation error:", JSON.stringify(parsed.error.flatten()));
      return NextResponse.json(
        { message: "Datos del formulario inválidos", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data } = parsed;
    const normalizedPhone = formatPhone(data.phone);

    const lead = await createLead({
      ...data,
      phone: normalizedPhone,
      email: data.email || undefined,
    });

    // Fire & forget: send WhatsApp bot message
    sendWhatsAppBotIntro(lead.id, normalizedPhone, lead.name).catch((err) =>
      console.error("[WhatsApp] Failed to send intro message:", err)
    );

    return NextResponse.json({ success: true, id: lead.id }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno del servidor";
    console.error("[API /leads] Error:", err);
    return NextResponse.json({ message }, { status: 500 });
  }
}

async function sendWhatsAppBotIntro(leadId: string, phone: string, name: string) {
  const firstName = name.split(" ")[0];
  await sendWhatsAppMessage(phone, {
    type: "text",
    text: {
      body: `¡Hola ${firstName}! 👋 Soy Silvina, del equipo comercial de *Budas del Mediterráneo*.\n\nAcabo de recibir tu solicitud de valoración. ¿Tienes un momento para contarme un poco más sobre la propiedad?`,
    },
  });

  // Update lead status
  const { updateLeadStatus } = await import("@/lib/supabase");
  await updateLeadStatus(leadId, "bot_enviado");
}
