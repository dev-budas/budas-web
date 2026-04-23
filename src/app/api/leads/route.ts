import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createLead } from "@/lib/supabase";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { formatPhone } from "@/lib/utils";

const leadSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(9),
  email: z.string().email().optional().or(z.literal("")),
  property_type: z.enum(["piso", "casa", "chalet", "local_comercial", "terreno", "otro"]),
  property_city: z.string().min(2),
  rooms: z.coerce.number().int().positive().optional(),
  bathrooms: z.coerce.number().int().positive().optional(),
  utm_source: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_medium: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = leadSchema.safeParse(body);

    if (!parsed.success) {
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
    console.error("[API /leads] Error:", err);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

async function sendWhatsAppBotIntro(leadId: string, phone: string, name: string) {
  const firstName = name.split(" ")[0];
  await sendWhatsAppMessage(phone, {
    type: "text",
    text: {
      body: `¡Hola ${firstName}! 👋 Soy Mediterra, del equipo de *Budas del Mediterráneo*.\n\nAcabo de recibir tu solicitud de valoración. ¿Tienes un momento para contarme un poco más sobre tu propiedad?`,
    },
  });

  // Update lead status
  const { updateLeadStatus } = await import("@/lib/supabase");
  await updateLeadStatus(leadId, "bot_enviado");
}
