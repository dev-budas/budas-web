"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, MessageSquare, StickyNote, CalendarPlus, User, MapPin, Check } from "lucide-react";
import { LEAD_STATUS_CONFIG } from "@/types";
import type { Lead, LeadStatus, Visit } from "@/types";
import { updateLeadStatus, updateLeadNotes, assignAgent, createVisit } from "@/app/(admin)/crm/actions";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/* ── Helpers ───────────────────────────────────────────────────────────────── */
const VISIT_STATUS = {
  pending:   { label: "Pendiente", color: "#F59E0B" },
  confirmed: { label: "Confirmada", color: "#3B82F6" },
  completed: { label: "Completada", color: "#10B981" },
  cancelled: { label: "Cancelada", color: "#9CA3AF" },
};

interface WaMessage {
  id: string;
  role: "bot" | "lead";
  content: string;
  timestamp: string;
}

/* ── Status Selector ───────────────────────────────────────────────────────── */
function StatusSelector({
  leadId,
  current,
  onChange,
}: {
  leadId: string;
  current: LeadStatus;
  onChange: (s: LeadStatus) => void;
}) {
  const [value, setValue] = useState(current);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateLeadStatus(leadId, value);
      onChange(value);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <select
        value={value}
        onChange={(e) => { setValue(e.target.value as LeadStatus); setDirty(e.target.value !== current); }}
        className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-primary/30"
        style={{ color: LEAD_STATUS_CONFIG[value].color }}
      >
        {Object.entries(LEAD_STATUS_CONFIG).map(([key, c]) => (
          <option key={key} value={key} style={{ color: c.color }}>{c.label}</option>
        ))}
      </select>
      {dirty && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-8 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar estado"}
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
}: {
  leadId: string;
  currentAgentId: string | null;
  profiles: { id: string; full_name: string }[];
  isAdmin: boolean;
}) {
  const [value, setValue] = useState(currentAgentId ?? "");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await assignAgent(leadId, value || null);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  if (!isAdmin) {
    const agent = profiles.find((p) => p.id === currentAgentId);
    return <p className="text-sm text-foreground">{agent?.full_name ?? "Sin asignar"}</p>;
  }

  return (
    <div className="space-y-2">
      <select
        value={value}
        onChange={(e) => { setValue(e.target.value); setDirty(e.target.value !== (currentAgentId ?? "")); }}
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

/* ── Notes Editor ──────────────────────────────────────────────────────────── */
function NotesEditor({ leadId, initial }: { leadId: string; initial: string }) {
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

  return (
    <div className="space-y-2">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
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
  onCreated,
}: {
  leadId: string;
  profiles: { id: string; full_name: string }[];
  currentAgentId: string | null;
  onCreated: (v: Visit) => void;
}) {
  const [open, setOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [agentId, setAgentId] = useState(currentAgentId ?? "");
  const [saving, setSaving] = useState(false);

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
      // Optimistic: add a fake visit to list
      onCreated({
        id: crypto.randomUUID(),
        lead_id: leadId,
        agent_id: agentId || undefined,
        scheduled_at: scheduledAt,
        address: address || undefined,
        notes: notes || undefined,
        status: "pending",
        created_at: new Date().toISOString(),
      });
      setOpen(false);
      setScheduledAt(""); setAddress(""); setNotes("");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
      >
        <CalendarPlus className="w-4 h-4" />
        Agendar visita
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5 bg-border/20 rounded-xl p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">Nueva visita</span>
        <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div>
        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Fecha y hora *</label>
        <input
          type="datetime-local"
          required
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="mt-1 w-full h-8 px-2.5 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>
      <div>
        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Dirección</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Calle, número, ciudad..."
          className="mt-1 w-full h-8 px-2.5 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>
      <div>
        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Agente</label>
        <select
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          className="mt-1 w-full h-8 px-2.5 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-primary/30"
        >
          <option value="">Sin asignar</option>
          {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
        </select>
      </div>
      <div>
        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Notas</label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
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
  );
}

/* ── Main Modal ────────────────────────────────────────────────────────────── */
interface LeadEditModalProps {
  lead: Lead;
  profiles: { id: string; full_name: string }[];
  isAdmin: boolean;
  onClose: () => void;
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void;
}

export function LeadEditModal({
  lead,
  profiles,
  isAdmin,
  onClose,
  onStatusChange,
}: LeadEditModalProps) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(true);
  const messages = (lead.whatsapp_conversation ?? []) as WaMessage[];

  // Fetch visits client-side
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("visits")
      .select("*")
      .eq("lead_id", lead.id)
      .order("scheduled_at")
      .then(({ data }) => {
        setVisits((data ?? []) as Visit[]);
        setLoadingVisits(false);
      });
  }, [lead.id]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const statusCfg = LEAD_STATUS_CONFIG[lead.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">{lead.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">{lead.name}</h2>
              <p className="text-xs text-muted-foreground">{lead.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${statusCfg.color}18`, color: statusCfg.color }}
            >
              {statusCfg.label}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-border/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-0 divide-y md:divide-y-0 md:divide-x divide-border">

            {/* Left: conversation + notes */}
            <div className="p-5 space-y-5">

              {/* Lead info row */}
              <div className="grid grid-cols-2 gap-3">
                <InfoItem label="Ciudad" value={lead.property_city ?? "—"} />
                <InfoItem label="Tipo" value={lead.property_type?.replace("_", " ") ?? "—"} />
                <InfoItem label="Habitaciones" value={lead.rooms != null ? String(lead.rooms) : "—"} />
                <InfoItem label="Baños" value={lead.bathrooms != null ? String(lead.bathrooms) : "—"} />
                <InfoItem label="Valor est." value={lead.estimated_value ? `${lead.estimated_value.toLocaleString("es-ES")} €` : "—"} />
                <InfoItem label="Urgencia" value={lead.urgency?.replace("_", " ") ?? "—"} />
              </div>

              {/* Notes */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <StickyNote className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Notas</span>
                </div>
                <NotesEditor leadId={lead.id} initial={lead.notes ?? ""} />
              </div>

              {/* WhatsApp conversation */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                    Conversación WhatsApp
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">{messages.length} mensajes</span>
                </div>
                <div className="bg-[#ECE5DD] rounded-xl overflow-hidden min-h-[120px]">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center py-10 text-xs text-muted-foreground">
                      Sin conversación registrada
                    </div>
                  ) : (
                    <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                      {messages.map((msg) => (
                        <div key={msg.id} className={cn("flex", msg.role === "bot" ? "justify-start" : "justify-end")}>
                          <div className={cn(
                            "max-w-[80%] px-3 py-2 rounded-2xl text-sm",
                            msg.role === "bot"
                              ? "bg-white border border-border/30 text-foreground rounded-tl-sm"
                              : "bg-[#DCF8C6] text-foreground rounded-tr-sm"
                          )}>
                            <p className="leading-relaxed">{msg.content}</p>
                            <p className="text-[10px] text-muted-foreground mt-1 text-right">
                              {new Date(msg.timestamp).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right sidebar: status, agent, visits */}
            <div className="p-5 space-y-5">

              {/* Status */}
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Estado</p>
                <StatusSelector
                  leadId={lead.id}
                  current={lead.status}
                  onChange={(s) => onStatusChange(lead.id, s)}
                />
              </div>

              {/* Agent */}
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Agente asignado</p>
                <AgentSelector
                  leadId={lead.id}
                  currentAgentId={lead.assigned_agent ?? null}
                  profiles={profiles}
                  isAdmin={isAdmin}
                />
              </div>

              {/* Visits */}
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Visitas</p>
                <div className="space-y-2 mb-3">
                  {loadingVisits ? (
                    <p className="text-xs text-muted-foreground">Cargando...</p>
                  ) : visits.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sin visitas programadas</p>
                  ) : (
                    visits.map((v) => {
                      const st = VISIT_STATUS[v.status as keyof typeof VISIT_STATUS] ?? VISIT_STATUS.pending;
                      const agent = profiles.find((p) => p.id === v.agent_id);
                      return (
                        <div key={v.id} className="p-2.5 bg-border/20 rounded-lg text-xs space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground">
                              {new Date(v.scheduled_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}{" "}
                              {new Date(v.scheduled_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <span
                              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                              style={{ backgroundColor: `${st.color}18`, color: st.color }}
                            >
                              {st.label}
                            </span>
                          </div>
                          {v.address && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="w-3 h-3" />{v.address}
                            </div>
                          )}
                          {agent && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <User className="w-3 h-3" />{agent.full_name}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                <VisitForm
                  leadId={lead.id}
                  profiles={profiles}
                  currentAgentId={lead.assigned_agent ?? null}
                  onCreated={(v) => setVisits((prev) => [...prev, v])}
                />
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm text-foreground capitalize">{value}</p>
    </div>
  );
}
