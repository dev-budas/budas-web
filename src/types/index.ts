/* ─── Lead ───────────────────────────────────────────────────────────────── */

export type LeadStatus =
  | "nuevo"
  | "bot_enviado"
  | "respondio"
  | "calificado"
  | "no_calificado"
  | "en_seguimiento"
  | "visita_agendada"
  | "captado"
  | "perdido";

export type PropertyType =
  | "piso"
  | "casa"
  | "chalet"
  | "local_comercial"
  | "terreno"
  | "otro";

export type SellUrgency = "inmediato" | "3_meses" | "6_meses" | "sin_prisa";

export interface Lead {
  id: string;
  created_at: string;
  updated_at: string;

  // Contact
  name: string;
  phone: string;
  email?: string;

  // Property
  property_type?: PropertyType;
  property_address?: string;
  property_city?: string;
  estimated_value?: number;
  rooms?: number;
  bathrooms?: number;

  // Qualification
  status: LeadStatus;
  urgency?: SellUrgency;
  has_mortgage?: boolean;
  is_owner?: boolean;
  notes?: string;

  // Source
  utm_source?: string;
  utm_campaign?: string;
  utm_medium?: string;

  // WhatsApp bot
  whatsapp_conversation?: WhatsAppMessage[];
  bot_qualified_at?: string;
  assigned_agent?: string;
}

export interface LeadFormData {
  name: string;
  phone: string;
  email?: string;
  property_type: PropertyType;
  property_city: string;
  consent: boolean;
}

/* ─── WhatsApp ───────────────────────────────────────────────────────────── */

export type MessageRole = "bot" | "lead";

export interface WhatsAppMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: WebhookEntry[];
}

interface WebhookEntry {
  id: string;
  changes: WebhookChange[];
}

interface WebhookChange {
  value: {
    messaging_product: string;
    metadata: { phone_number_id: string };
    contacts?: [{ profile: { name: string }; wa_id: string }];
    messages?: [
      {
        from: string;
        id: string;
        timestamp: string;
        text?: { body: string };
        type: string;
      }
    ];
    statuses?: [
      {
        id: string;
        status: string;
        timestamp: string;
        recipient_id: string;
      }
    ];
  };
  field: string;
}

/* ─── Visits ─────────────────────────────────────────────────────────────── */

export type VisitStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface Visit {
  id: string;
  lead_id: string;
  agent_id?: string;
  scheduled_at: string;
  address?: string;
  notes?: string;
  status: VisitStatus;
  created_at: string;
}

/* ─── CRM ────────────────────────────────────────────────────────────────── */

export interface PipelineColumn {
  status: LeadStatus;
  label: string;
  color: string;
  leads: Lead[];
}

export const LEAD_STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; color: string; description: string }
> = {
  nuevo: {
    label: "Nuevo",
    color: "#6B7280",
    description: "Lead recién llegado",
  },
  bot_enviado: {
    label: "Bot enviado",
    color: "#3B82F6",
    description: "Mensaje de WhatsApp enviado",
  },
  respondio: {
    label: "Respondió",
    color: "#8B5CF6",
    description: "Lead contestó al bot",
  },
  calificado: {
    label: "Calificado",
    color: "#10B981",
    description: "Lead validado por el bot",
  },
  no_calificado: {
    label: "No calificado",
    color: "#EF4444",
    description: "Lead descartado",
  },
  en_seguimiento: {
    label: "En seguimiento",
    color: "#F59E0B",
    description: "Agente en contacto",
  },
  visita_agendada: {
    label: "Visita agendada",
    color: "#EC4899",
    description: "Cita para valoración",
  },
  captado: {
    label: "Captado",
    color: "#1B3A5C",
    description: "Inmueble en cartera",
  },
  perdido: {
    label: "Perdido",
    color: "#9CA3AF",
    description: "No se cerró",
  },
};
