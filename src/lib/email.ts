import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/service";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "notificaciones@budasdelmediterraneo.com";
const APP_URL = process.env.APP_URL ?? "https://lp1.budasdelmediterraneo.com";

async function getTeamEmails(): Promise<string[]> {
  const supabase = createServiceClient();
  const { data: { users } } = await supabase.auth.admin.listUsers();
  return users.map((u) => u.email).filter(Boolean) as string[];
}

interface LeadSummary {
  id: string;
  name: string;
  phone: string;
  property_city?: string | null;
  property_type?: string | null;
}

export async function sendQualifiedLeadEmail(lead: LeadSummary) {
  const to = await getTeamEmails();
  if (!to.length) return;

  const leadUrl = `${APP_URL}/crm/leads/${lead.id}`;
  const propertyInfo = [lead.property_city, lead.property_type?.replace("_", " ")]
    .filter(Boolean)
    .join(" · ");

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Nuevo lead calificado: ${lead.name}`,
    html: buildEmail({
      title: "Nuevo lead calificado",
      accentColor: "#10B981",
      badge: "Calificado",
      badgeColor: "#10B981",
      headline: lead.name,
      subline: lead.phone + (propertyInfo ? ` · ${propertyInfo}` : ""),
      body: "El bot de WhatsApp ha calificado este lead positivamente. Está esperando ser asignado a un agente para continuar el seguimiento.",
      ctaLabel: "Ver lead y asignar agente",
      ctaUrl: leadUrl,
    }),
  });
}

export async function sendLeadAssignedEmail(lead: LeadSummary, agentId: string) {
  const supabase = createServiceClient();
  const { data: { user } } = await supabase.auth.admin.getUserById(agentId);
  const agentEmail = user?.email;
  if (!agentEmail) return;

  const leadUrl = `${APP_URL}/crm/leads/${lead.id}`;
  const propertyInfo = [lead.property_city, lead.property_type?.replace("_", " ")]
    .filter(Boolean)
    .join(" · ");

  await getResend().emails.send({
    from: FROM,
    to: agentEmail,
    subject: `Lead asignado: ${lead.name}`,
    html: buildEmail({
      title: "Nuevo lead asignado",
      accentColor: "#C9A96E",
      badge: "Asignado a ti",
      badgeColor: "#C9A96E",
      headline: lead.name,
      subline: lead.phone + (propertyInfo ? ` · ${propertyInfo}` : ""),
      body: "Se te ha asignado un nuevo lead calificado. Entra en el CRM para ver el historial de conversación y comenzar el seguimiento.",
      ctaLabel: "Ver lead",
      ctaUrl: leadUrl,
    }),
  });
}

export async function sendUnqualifiedLeadEmail(lead: LeadSummary) {
  const to = await getTeamEmails();
  if (!to.length) return;

  const leadUrl = `${APP_URL}/crm/leads/${lead.id}`;
  const propertyInfo = [lead.property_city, lead.property_type?.replace("_", " ")]
    .filter(Boolean)
    .join(" · ");

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Lead no calificado por revisar: ${lead.name}`,
    html: buildEmail({
      title: "Lead no calificado — revisión necesaria",
      accentColor: "#F59E0B",
      badge: "No calificado",
      badgeColor: "#EF4444",
      headline: lead.name,
      subline: lead.phone + (propertyInfo ? ` · ${propertyInfo}` : ""),
      body: "El bot ha marcado este lead como no calificado. Por favor revisa el historial de conversación y decide si se descarta definitivamente o si conviene pasarlo a calificado para seguimiento manual.",
      ctaLabel: "Revisar conversación",
      ctaUrl: leadUrl,
    }),
  });
}

interface VisitSummary {
  id: string;
  scheduled_at: string;
  address?: string | null;
  notes?: string | null;
}

export async function sendVisitConfirmationEmail(
  visit: VisitSummary,
  lead: LeadSummary,
  agentEmail: string
) {
  const leadUrl = `${APP_URL}/crm/leads/${lead.id}`;
  const date = new Date(visit.scheduled_at).toLocaleString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  await getResend().emails.send({
    from: FROM,
    to: agentEmail,
    subject: `Visita confirmada: ${lead.name} — ${date}`,
    html: buildEmail({
      title: "Visita confirmada",
      accentColor: "#EC4899",
      badge: "Visita confirmada",
      badgeColor: "#EC4899",
      headline: lead.name,
      subline: `${lead.phone}${lead.property_city ? ` · ${lead.property_city}` : ""}`,
      body: `Se ha programado una visita para el <strong>${date}</strong>${visit.address ? ` en <strong>${visit.address}</strong>` : ""}.${visit.notes ? `<br/><br/>Notas: ${visit.notes}` : ""}`,
      ctaLabel: "Ver lead",
      ctaUrl: leadUrl,
    }),
  });
}

export async function sendVisitReminderEmail(
  visit: VisitSummary,
  lead: LeadSummary,
  agentEmail: string
) {
  const leadUrl = `${APP_URL}/crm/leads/${lead.id}`;
  const date = new Date(visit.scheduled_at).toLocaleString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  await getResend().emails.send({
    from: FROM,
    to: agentEmail,
    subject: `Recordatorio de visita en 4 horas: ${lead.name}`,
    html: buildEmail({
      title: "Recordatorio de visita",
      accentColor: "#F59E0B",
      badge: "Recordatorio — 4 horas",
      badgeColor: "#F59E0B",
      headline: lead.name,
      subline: `${lead.phone}${lead.property_city ? ` · ${lead.property_city}` : ""}`,
      body: `Tu visita con <strong>${lead.name}</strong> está programada para las <strong>${date}</strong>${visit.address ? ` en <strong>${visit.address}</strong>` : ""}. ¡Recuerda prepararte con tiempo!`,
      ctaLabel: "Ver lead",
      ctaUrl: leadUrl,
    }),
  });
}

interface EmailParams {
  title: string;
  accentColor: string;
  badge: string;
  badgeColor: string;
  headline: string;
  subline: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
}

function buildEmail(p: EmailParams): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${p.title}</title>
</head>
<body style="margin:0;padding:0;background:#F5F4F1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F4F1;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Logo / Brand -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <span style="font-size:13px;font-weight:600;letter-spacing:0.08em;color:#1B3A5C;text-transform:uppercase;">Budas del Mediterráneo</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

              <!-- Accent bar -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:4px;background:${p.accentColor};"></td>
                </tr>
              </table>

              <!-- Content -->
              <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 36px;">
                <tr>
                  <td>
                    <!-- Badge -->
                    <div style="margin-bottom:16px;">
                      <span style="display:inline-block;font-size:11px;font-weight:600;letter-spacing:0.06em;color:#FFFFFF;background:${p.badgeColor};padding:4px 12px;border-radius:100px;text-transform:uppercase;">
                        ${p.badge}
                      </span>
                    </div>

                    <!-- Lead name -->
                    <h1 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1B3A5C;line-height:1.3;">${p.headline}</h1>
                    <p style="margin:0 0 20px;font-size:13px;color:#6B7280;">${p.subline}</p>

                    <!-- Divider -->
                    <hr style="border:none;border-top:1px solid #F0EEE9;margin:0 0 20px;" />

                    <!-- Body text -->
                    <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#374151;">${p.body}</p>

                    <!-- CTA -->
                    <a href="${p.ctaUrl}"
                      style="display:inline-block;background:#1B3A5C;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:600;padding:13px 28px;border-radius:10px;letter-spacing:0.01em;">
                      ${p.ctaLabel} →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#9CA3AF;">
                Este correo fue enviado automáticamente por el CRM de Budas del Mediterráneo.<br/>
                <a href="${APP_URL}/crm" style="color:#C9A96E;text-decoration:none;">Acceder al CRM</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
