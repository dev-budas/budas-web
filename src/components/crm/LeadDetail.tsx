"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LEAD_STATUS_CONFIG } from "@/types";
import type { Lead, LeadStatus, Visit } from "@/types";
import { updateLeadStatus, updateLeadNotes, assignAgent, createVisit } from "@/app/(admin)/crm/actions";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  MessageSquare,
  StickyNote,
  CalendarPlus,
  Check,
  X,
  User,
  Lock,
} from "lucide-react";

/* ── Status Badge ──────────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: LeadStatus }) {
  const cfg = LEAD_STATUS_CONFIG[status];
  return (
    <span
      className="text-xs font-medium px-2.5 py-1 rounded-full"
      style={{ backgroundColor: `${cfg.color}18`, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

/* ── Status Selector ───────────────────────────────────────────────────────── */
function StatusSelector({ leadId, current, disabled }: { leadId: string; current: LeadStatus; disabled?: boolean }) {
  const [value, setValue] = useState(current);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setValue(e.target.value as LeadStatus);
    setDirty(e.target.value !== current);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateLeadStatus(leadId, value);
      setDirty(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const cfg = LEAD_STATUS_CONFIG[value];

  if (disabled) {
    return (
      <div className="flex items-center gap-2">
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ backgroundColor: `${cfg.color}18`, color: cfg.color }}
        >
          {cfg.label}
        </span>
        <Lock className="w-3 h-3 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <select
        value={value}
        onChange={handleChange}
        className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-primary/30"
        style={{ color: cfg.color }}
      >
        {Object.entries(LEAD_STATUS_CONFIG).map(([key, c]) => (
          <option key={key} value={key} style={{ color: c.color }}>
            {c.label}
          </option>
        ))}
      </select>
      {dirty && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-8 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar cambio"}
        </button>
      )}
    </div>
  );
}

/* ── Agent Selector ────────────────────────────────────────────────────────── */
function AgentSelector({
  leadId,
  currentAgentId,
  profiles,
  isAdmin,
  currentUserId,
}: {
  leadId: string;
  currentAgentId: string | null;
  profiles: { id: string; full_name: string }[];
  isAdmin: boolean;
  currentUserId: string;
}) {
  const [value, setValue] = useState(currentAgentId ?? "");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setValue(e.target.value);
    setDirty(e.target.value !== (currentAgentId ?? ""));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await assignAgent(leadId, value || null);
      setDirty(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleClaim() {
    setSaving(true);
    try {
      await assignAgent(leadId, currentUserId);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (isAdmin) {
    return (
      <div className="space-y-2">
        <select
          value={value}
          onChange={handleChange}
          className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-primary/30"
        >
          <option value="">Sin asignar</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.full_name}</option>
          ))}
        </select>
        {dirty && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-8 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Asignar agente"}
          </button>
        )}
      </div>
    );
  }

  // Agent: if unassigned, allow self-assign
  if (!currentAgentId) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Sin asignar</p>
        <button
          onClick={handleClaim}
          disabled={saving}
          className="w-full h-8 rounded-lg bg-accent/10 text-accent border border-accent/20 text-xs font-semibold hover:bg-accent/20 transition-colors disabled:opacity-60"
        >
          {saving ? "Asignando..." : "Asignarme este lead"}
        </button>
      </div>
    );
  }

  // Agent: show assigned name (read-only)
  const agent = profiles.find((p) => p.id === currentAgentId);
  return (
    <p className="text-sm text-foreground">{agent?.full_name ?? "Sin asignar"}</p>
  );
}

/* ── Notes Editor ──────────────────────────────────────────────────────────── */
function NotesEditor({ leadId, initial, disabled }: { leadId: string; initial: string; disabled?: boolean }) {
  const [notes, setNotes] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await updateLeadNotes(leadId, notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  if (disabled) {
    return (
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
        {initial || "Sin notas"}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={5}
        placeholder="Añadir notas sobre este lead..."
        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface resize-none focus:outline-none focus:ring-1 focus:ring-primary/30"
      />
      <button
        onClick={handleSave}
        disabled={isPending}
        className={cn(
          "w-full h-8 rounded-lg text-xs font-semibold transition-colors",
          saved
            ? "bg-green-500/10 text-green-600"
            : "bg-primary text-white hover:bg-primary-hover disabled:opacity-60"
        )}
      >
        {saved ? "✓ Guardado" : isPending ? "Guardando..." : "Guardar notas"}
      </button>
    </div>
  );
}

/* ── Visit Form ────────────────────────────────────────────────────────────── */
function VisitForm({
  leadId,
  profiles,
  currentAgentId,
  disabled,
}: {
  leadId: string;
  profiles: { id: string; full_name: string }[];
  currentAgentId: string | null;
  disabled?: boolean;
}) {
  if (disabled) return null;
  const [open, setOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [agentId, setAgentId] = useState(currentAgentId ?? "");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!scheduledAt) return;
    setSaving(true);
    try {
      await createVisit({
        lead_id: leadId,
        agent_id: agentId || undefined,
        scheduled_at: scheduledAt,
        address: address || undefined,
        notes: notes || undefined,
      });
      setDone(true);
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
        <Check className="w-4 h-4" />
        Visita agendada correctamente
      </div>
    );
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
        >
          <CalendarPlus className="w-4 h-4" />
          Agendar visita
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 bg-border/20 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-foreground">Nueva visita</span>
            <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Fecha y hora *
            </label>
            <input
              type="datetime-local"
              required
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="mt-1 w-full h-8 px-2.5 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Dirección
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Calle, número, ciudad..."
              className="mt-1 w-full h-8 px-2.5 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Agente
            </label>
            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="mt-1 w-full h-8 px-2.5 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-primary/30"
            >
              <option value="">Sin asignar</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Notas
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instrucciones, observaciones..."
              className="mt-1 w-full px-2.5 py-1.5 text-sm rounded-lg border border-border bg-surface resize-none focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !scheduledAt}
            className="w-full h-9 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60"
          >
            {saving ? "Agendando..." : "Confirmar visita"}
          </button>
        </form>
      )}
    </div>
  );
}

/* ── WhatsApp Conversation ─────────────────────────────────────────────────── */
interface WaMessage {
  id: string;
  role: "bot" | "lead";
  content: string;
  timestamp: string;
}

function WhatsAppConversation({ messages }: { messages: WaMessage[] }) {
  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageSquare className="w-8 h-8 text-border mb-3" />
        <p className="text-sm text-muted-foreground">Sin conversación registrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={cn(
            "flex",
            msg.role === "bot" ? "justify-start" : "justify-end"
          )}
        >
          <div
            className={cn(
              "max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm",
              msg.role === "bot"
                ? "bg-white border border-border text-foreground rounded-tl-sm"
                : "bg-[#DCF8C6] text-foreground rounded-tr-sm"
            )}
          >
            <p className="leading-relaxed">{msg.content}</p>
            <p className="text-[10px] text-muted-foreground mt-1 text-right">
              {new Date(msg.timestamp).toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Visits List ───────────────────────────────────────────────────────────── */
const VISIT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "#F59E0B" },
  confirmed: { label: "Confirmada", color: "#3B82F6" },
  completed: { label: "Completada", color: "#10B981" },
  cancelled: { label: "Cancelada", color: "#EF4444" },
};

function VisitsList({ visits, profiles }: { visits: Visit[]; profiles: { id: string; full_name: string }[] }) {
  if (visits.length === 0) return null;

  return (
    <div className="space-y-2">
      {visits.map((visit) => {
        const st = VISIT_STATUS_LABELS[visit.status] ?? VISIT_STATUS_LABELS.pending;
        const agent = profiles.find((p) => p.id === visit.agent_id);
        return (
          <div key={visit.id} className="flex items-start gap-3 p-3 bg-border/20 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-medium text-foreground">
                  {new Date(visit.scheduled_at).toLocaleDateString("es-ES", {
                    weekday: "short", day: "numeric", month: "short",
                  })}{" "}
                  {new Date(visit.scheduled_at).toLocaleTimeString("es-ES", {
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${st.color}18`, color: st.color }}
                >
                  {st.label}
                </span>
              </div>
              {visit.address && (
                <p className="text-xs text-muted-foreground truncate">{visit.address}</p>
              )}
              {agent && (
                <p className="text-xs text-muted-foreground">{agent.full_name}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────────────────── */
interface LeadDetailProps {
  lead: Lead;
  visits: Visit[];
  profiles: { id: string; full_name: string }[];
  isAdmin: boolean;
  currentUserId: string;
}

export function LeadDetail({ lead, visits, profiles, isAdmin, currentUserId }: LeadDetailProps) {
  const canEdit = isAdmin || lead.assigned_agent === currentUserId;
  const messages = (lead.whatsapp_conversation ?? []) as WaMessage[];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <a
          href="/crm/leads"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a leads
        </a>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-primary">{lead.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{lead.name}</h1>
              <p className="text-sm text-muted-foreground">{lead.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!canEdit && (
              <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-border/50 px-2.5 py-1 rounded-full">
                <Lock className="w-3 h-3" />
                Solo lectura
              </span>
            )}
            <StatusBadge status={lead.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

        {/* Left column - Main content */}
        <div className="space-y-6">

          {/* Lead info */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Información del lead</h2>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Email" value={lead.email ?? "—"} />
              <InfoRow label="Ciudad" value={lead.property_city ?? "—"} />
              <InfoRow label="Tipo de propiedad" value={lead.property_type?.replace("_", " ") ?? "—"} />
              <InfoRow label="Habitaciones" value={lead.rooms != null ? String(lead.rooms) : "—"} />
              <InfoRow label="Baños" value={lead.bathrooms != null ? String(lead.bathrooms) : "—"} />
              <InfoRow label="Valor estimado" value={lead.estimated_value ? `${lead.estimated_value.toLocaleString("es-ES")} €` : "—"} />
              <InfoRow label="Propietario" value={lead.is_owner === true ? "Sí" : lead.is_owner === false ? "No" : "—"} />
              <InfoRow label="Urgencia" value={lead.urgency?.replace("_", " ") ?? "—"} />
              <InfoRow label="Hipoteca" value={lead.has_mortgage === true ? "Sí" : lead.has_mortgage === false ? "No" : "—"} />
              <InfoRow label="Fuente" value={lead.utm_source ?? "—"} />
              <InfoRow
                label="Fecha de entrada"
                value={new Date(lead.created_at).toLocaleDateString("es-ES", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <StickyNote className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Notas</h2>
              {!canEdit && <Lock className="w-3 h-3 text-muted-foreground ml-auto" />}
            </div>
            <NotesEditor leadId={lead.id} initial={lead.notes ?? ""} disabled={!canEdit} />
          </div>

          {/* WhatsApp conversation */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Conversación WhatsApp</h2>
              <span className="text-xs text-muted-foreground ml-auto">{messages.length} mensajes</span>
            </div>
            <div className="bg-[#ECE5DD] min-h-[200px]">
              <WhatsAppConversation messages={messages} />
            </div>
          </div>
        </div>

        {/* Right column - Sidebar */}
        <div className="space-y-4">

          {/* Status */}
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Estado</p>
            <StatusSelector leadId={lead.id} current={lead.status} disabled={!canEdit} />
          </div>

          {/* Agent */}
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Agente asignado
            </p>
            <AgentSelector
              leadId={lead.id}
              currentAgentId={lead.assigned_agent ?? null}
              profiles={profiles}
              isAdmin={isAdmin}
              currentUserId={currentUserId}
            />
          </div>

          {/* Visits */}
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Visitas
            </p>
            <div className="space-y-3">
              <VisitsList visits={visits} profiles={profiles} />
              <VisitForm
                leadId={lead.id}
                profiles={profiles}
                currentAgentId={lead.assigned_agent ?? null}
                disabled={!canEdit}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-foreground capitalize">{value}</p>
    </div>
  );
}
