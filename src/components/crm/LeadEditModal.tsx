"use client";

import { useState, useEffect } from "react";
import { X, MessageSquare, StickyNote, CalendarPlus, User, MapPin, Lock } from "lucide-react";
import { LEAD_STATUS_CONFIG } from "@/types";
import type { Lead, LeadNote, LeadStatus, Visit } from "@/types";
import { updateLeadStatus, addLeadNote, assignAgent, createVisit } from "@/app/(admin)/crm/actions";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const VISIT_STATUS = {
  pending:   { label: "Pendiente", color: "#F59E0B" },
  confirmed: { label: "Confirmada", color: "#3B82F6" },
  completed: { label: "Completada", color: "#10B981" },
  cancelled: { label: "Cancelada", color: "#9CA3AF" },
};

interface WaMessage { id: string; role: "bot" | "lead"; content: string; timestamp: string }

/* ── Status Selector ───────────────────────────────────────────────────────── */
function StatusSelector({ leadId, current, onChange, disabled }: {
  leadId: string; current: LeadStatus; onChange: (s: LeadStatus) => void; disabled: boolean;
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
    } finally { setSaving(false); }
  }

  if (disabled) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="w-3.5 h-3.5 flex-shrink-0" />
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ backgroundColor: `${LEAD_STATUS_CONFIG[current].color}18`, color: LEAD_STATUS_CONFIG[current].color }}
        >
          {LEAD_STATUS_CONFIG[current].label}
        </span>
      </div>
    );
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
        <button onClick={handleSave} disabled={saving}
          className="w-full h-8 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60">
          {saving ? "Guardando..." : "Guardar estado"}
        </button>
      )}
    </div>
  );
}

/* ── Agent Selector ────────────────────────────────────────────────────────── */
function AgentSelector({ leadId, currentAgentId, profiles, isAdmin, currentUserId, onClaimed }: {
  leadId: string; currentAgentId: string | null;
  profiles: { id: string; full_name: string }[]; isAdmin: boolean;
  currentUserId: string; onClaimed: () => void;
}) {
  const [value, setValue] = useState(currentAgentId ?? "");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const canClaim = !isAdmin && currentAgentId === null;

  async function handleSave() {
    setSaving(true);
    try { await assignAgent(leadId, value || null); setDirty(false); }
    finally { setSaving(false); }
  }

  async function handleClaim() {
    setSaving(true);
    try { await assignAgent(leadId, currentUserId); onClaimed(); }
    finally { setSaving(false); }
  }

  // Agent viewing a lead assigned to someone else — read-only
  if (!isAdmin && currentAgentId !== null && currentAgentId !== currentUserId) {
    const agent = profiles.find((p) => p.id === currentAgentId);
    return <p className="text-sm text-foreground">{agent?.full_name ?? "Otro agente"}</p>;
  }

  // Agent can claim an unassigned lead
  if (canClaim) {
    return (
      <button onClick={handleClaim} disabled={saving}
        className="w-full h-8 rounded-lg border border-dashed border-primary/40 text-xs font-medium text-primary hover:bg-primary/5 transition-colors disabled:opacity-60">
        {saving ? "Asignando..." : "Asignarme este lead"}
      </button>
    );
  }

  // Admin: full dropdown
  return (
    <div className="space-y-2">
      <select value={value}
        onChange={(e) => { setValue(e.target.value); setDirty(e.target.value !== (currentAgentId ?? "")); }}
        className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-primary/30">
        <option value="">Sin asignar</option>
        {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
      </select>
      {dirty && (
        <button onClick={handleSave} disabled={saving}
          className="w-full h-8 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60">
          {saving ? "Guardando..." : "Asignar agente"}
        </button>
      )}
    </div>
  );
}

/* ── Notes Section ─────────────────────────────────────────────────────────── */
function NotesSection({ leadId, disabled }: { leadId: string; disabled: boolean }) {
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("lead_notes")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setNotes((data ?? []) as LeadNote[]); setLoading(false); });
  }, [leadId]);

  async function handleAdd() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const newNote = await addLeadNote(leadId, text.trim()) as LeadNote;
      setNotes((prev) => [newNote, ...prev]);
      setText("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {!disabled && (
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Escribe una nota..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface resize-none focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          <button
            onClick={handleAdd}
            disabled={saving || !text.trim()}
            className="w-full h-8 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Añadir nota"}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-xs text-muted-foreground">Cargando...</p>
      ) : notes.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sin notas</p>
      ) : (
        <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
          {notes.map((note) => (
            <div key={note.id} className="border-l-2 border-border pl-3 py-0.5">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{note.content}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {note.author_name} · {new Date(note.created_at).toLocaleDateString("es-ES", {
                  day: "numeric", month: "short", year: "numeric",
                })}{" "}
                {new Date(note.created_at).toLocaleTimeString("es-ES", {
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Visit Form ────────────────────────────────────────────────────────────── */
function VisitForm({ leadId, profiles, currentAgentId, disabled, onCreated }: {
  leadId: string; profiles: { id: string; full_name: string }[];
  currentAgentId: string | null; disabled: boolean;
  onCreated: (v: Visit) => void;
}) {
  const [open, setOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [agentId, setAgentId] = useState(currentAgentId ?? "");
  const [saving, setSaving] = useState(false);

  if (disabled) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createVisit({ lead_id: leadId, agent_id: agentId || undefined, scheduled_at: scheduledAt, address: address || undefined, notes: notes || undefined });
      onCreated({ id: crypto.randomUUID(), lead_id: leadId, agent_id: agentId || undefined, scheduled_at: scheduledAt, address: address || undefined, notes: notes || undefined, status: "pending", created_at: new Date().toISOString() });
      setOpen(false); setScheduledAt(""); setAddress(""); setNotes("");
    } finally { setSaving(false); }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
        <CalendarPlus className="w-4 h-4" /> Agendar visita
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5 bg-border/20 rounded-xl p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">Nueva visita</span>
        <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
      </div>
      <div>
        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Fecha y hora *</label>
        <input type="datetime-local" required value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
          className="mt-1 w-full h-8 px-2.5 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-primary/30" />
      </div>
      <div>
        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Dirección</label>
        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Calle, número..."
          className="mt-1 w-full h-8 px-2.5 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-primary/30" />
      </div>
      <div>
        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Agente</label>
        <select value={agentId} onChange={(e) => setAgentId(e.target.value)}
          className="mt-1 w-full h-8 px-2.5 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-primary/30">
          <option value="">Sin asignar</option>
          {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
        </select>
      </div>
      <div>
        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Notas</label>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
          className="mt-1 w-full px-2.5 py-1.5 text-sm rounded-lg border border-border bg-surface resize-none focus:outline-none focus:ring-1 focus:ring-primary/30" />
      </div>
      <button type="submit" disabled={saving || !scheduledAt}
        className="w-full h-9 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60">
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
  currentUserId: string;
  onClose: () => void;
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void;
}

export function LeadEditModal({ lead, profiles, isAdmin, currentUserId, onClose, onStatusChange }: LeadEditModalProps) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(true);
  const [currentLead, setCurrentLead] = useState(lead);
  const messages = (currentLead.whatsapp_conversation ?? []) as WaMessage[];

  // canEdit: admin always; agent only if lead is assigned to them
  const canEdit = isAdmin || currentLead.assigned_agent === currentUserId;

  useEffect(() => {
    const supabase = createClient();
    supabase.from("visits").select("*").eq("lead_id", lead.id).order("scheduled_at")
      .then(({ data }) => { setVisits((data ?? []) as Visit[]); setLoadingVisits(false); });
  }, [lead.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const statusCfg = LEAD_STATUS_CONFIG[currentLead.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">{currentLead.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">{currentLead.name}</h2>
              <p className="text-xs text-muted-foreground">{currentLead.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!canEdit && !isAdmin && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground bg-border/50 rounded-full px-2.5 py-1">
                <Lock className="w-3 h-3" /> Solo lectura
              </span>
            )}
            <span className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${statusCfg.color}18`, color: statusCfg.color }}>
              {statusCfg.label}
            </span>
            <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-border/50 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-0 divide-y md:divide-y-0 md:divide-x divide-border">

            {/* Left */}
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <InfoItem label="Ciudad" value={currentLead.property_city ?? "—"} />
                <InfoItem label="Tipo" value={currentLead.property_type?.replace("_", " ") ?? "—"} />
                <InfoItem label="Habitaciones" value={currentLead.rooms != null ? String(currentLead.rooms) : "—"} />
                <InfoItem label="Baños" value={currentLead.bathrooms != null ? String(currentLead.bathrooms) : "—"} />
                <InfoItem label="Valor est." value={currentLead.estimated_value ? `${currentLead.estimated_value.toLocaleString("es-ES")} €` : "—"} />
                <InfoItem label="Urgencia" value={currentLead.urgency?.replace("_", " ") ?? "—"} />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <StickyNote className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Notas</span>
                </div>
                <NotesSection leadId={currentLead.id} disabled={!canEdit} />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Conversación WhatsApp</span>
                  <span className="text-xs text-muted-foreground ml-auto">{messages.length} mensajes</span>
                </div>
                <div className="bg-[#ECE5DD] rounded-xl overflow-hidden min-h-[120px]">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center py-10 text-xs text-muted-foreground">Sin conversación registrada</div>
                  ) : (
                    <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                      {messages.map((msg) => (
                        <div key={msg.id} className={cn("flex", msg.role === "bot" ? "justify-start" : "justify-end")}>
                          <div className={cn("max-w-[80%] px-3 py-2 rounded-2xl text-sm",
                            msg.role === "bot" ? "bg-white border border-border/30 text-foreground rounded-tl-sm" : "bg-[#DCF8C6] text-foreground rounded-tr-sm")}>
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

            {/* Right sidebar */}
            <div className="p-5 space-y-5">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Estado</p>
                <StatusSelector leadId={currentLead.id} current={currentLead.status} disabled={!canEdit}
                  onChange={(s) => { setCurrentLead((l) => ({ ...l, status: s })); onStatusChange(currentLead.id, s); }} />
              </div>

              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Agente asignado</p>
                <AgentSelector
                  leadId={currentLead.id}
                  currentAgentId={currentLead.assigned_agent ?? null}
                  profiles={profiles}
                  isAdmin={isAdmin}
                  currentUserId={currentUserId}
                  onClaimed={() => setCurrentLead((l) => ({ ...l, assigned_agent: currentUserId }))}
                />
              </div>

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
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                              style={{ backgroundColor: `${st.color}18`, color: st.color }}>{st.label}</span>
                          </div>
                          {v.address && <div className="flex items-center gap-1 text-muted-foreground"><MapPin className="w-3 h-3" />{v.address}</div>}
                          {agent && <div className="flex items-center gap-1 text-muted-foreground"><User className="w-3 h-3" />{agent.full_name}</div>}
                        </div>
                      );
                    })
                  )}
                </div>
                <VisitForm leadId={currentLead.id} profiles={profiles} currentAgentId={currentLead.assigned_agent ?? null}
                  disabled={!canEdit} onCreated={(v) => setVisits((prev) => [...prev, v])} />
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
