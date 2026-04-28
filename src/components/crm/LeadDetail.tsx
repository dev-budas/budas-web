"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LEAD_STATUS_CONFIG } from "@/types";
import type { Lead, LeadFile, LeadNote, LeadStatus, PropertyType, SellUrgency, Visit } from "@/types";
import { updateLeadStatus, addLeadNote, assignAgent, createVisit, updateLeadInfo } from "@/app/(admin)/crm/actions";
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
  Paperclip,
  Pencil,
} from "lucide-react";
import { FilesSection } from "@/components/crm/FilesSection";

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

  // Sync when the server updates the status externally (e.g. createVisit → cliente)
  useEffect(() => {
    setValue(current);
    setDirty(false);
  }, [current]);

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

/* ── Notes Section ─────────────────────────────────────────────────────────── */
function NotesSection({
  leadId,
  initialNotes,
  disabled,
}: {
  leadId: string;
  initialNotes: LeadNote[];
  disabled?: boolean;
}) {
  const [notes, setNotes] = useState<LeadNote[]>(initialNotes);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

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
    <div className="space-y-4">
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

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin notas</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="border-l-2 border-border pl-3 py-0.5">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{note.content}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
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
function VisitForm({
  leadId,
  profiles,
  currentAgentId,
  propertyAddress,
  disabled,
}: {
  leadId: string;
  profiles: { id: string; full_name: string }[];
  currentAgentId: string | null;
  propertyAddress?: string;
  disabled?: boolean;
}) {
  if (disabled) return null;
  const [open, setOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [address, setAddress] = useState(propertyAddress ?? "");
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

/* ── Lead Info Editor ──────────────────────────────────────────────────────── */
function LeadInfoEditor({ lead, canEdit }: { lead: Lead; canEdit: boolean }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const [form, setForm] = useState({
    email: lead.email ?? "",
    property_city: lead.property_city ?? "",
    property_address: lead.property_address ?? "",
    property_type: lead.property_type ?? "",
    rooms: lead.rooms != null ? String(lead.rooms) : "",
    bathrooms: lead.bathrooms != null ? String(lead.bathrooms) : "",
    estimated_value: lead.estimated_value != null ? String(lead.estimated_value) : "",
    is_owner: lead.is_owner != null ? String(lead.is_owner) : "",
    urgency: lead.urgency ?? "",
    has_mortgage: lead.has_mortgage != null ? String(lead.has_mortgage) : "",
  });

  useEffect(() => {
    setForm({
      email: lead.email ?? "",
      property_city: lead.property_city ?? "",
      property_address: lead.property_address ?? "",
      property_type: lead.property_type ?? "",
      rooms: lead.rooms != null ? String(lead.rooms) : "",
      bathrooms: lead.bathrooms != null ? String(lead.bathrooms) : "",
      estimated_value: lead.estimated_value != null ? String(lead.estimated_value) : "",
      is_owner: lead.is_owner != null ? String(lead.is_owner) : "",
      urgency: lead.urgency ?? "",
      has_mortgage: lead.has_mortgage != null ? String(lead.has_mortgage) : "",
    });
  }, [lead]);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateLeadInfo(lead.id, {
        email: form.email || undefined,
        property_city: form.property_city || undefined,
        property_address: form.property_address || undefined,
        property_type: (form.property_type as PropertyType) || undefined,
        rooms: form.rooms ? parseInt(form.rooms) : undefined,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : undefined,
        estimated_value: form.estimated_value ? parseFloat(form.estimated_value) : undefined,
        is_owner: form.is_owner !== "" ? form.is_owner === "true" : undefined,
        urgency: (form.urgency as SellUrgency) || undefined,
        has_mortgage: form.has_mortgage !== "" ? form.has_mortgage === "true" : undefined,
      });
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full h-8 px-2.5 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-primary/30";
  const selectCls = inputCls;

  const mapAddress = form.property_address || lead.property_address;

  return (
    <div className="bg-surface border border-border/60 rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">Información del lead</h2>
        {canEdit && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </button>
        )}
        {editing && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              <Check className="w-3.5 h-3.5" />
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Email</p>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} placeholder="email@ejemplo.com" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Ciudad</p>
            <input type="text" value={form.property_city} onChange={(e) => set("property_city", e.target.value)} className={inputCls} placeholder="Ej: Valencia" />
          </div>
          <div className="col-span-2">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Dirección</p>
            <input type="text" value={form.property_address} onChange={(e) => set("property_address", e.target.value)} className={inputCls} placeholder="Calle, número, ciudad..." />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Tipo de propiedad</p>
            <select value={form.property_type} onChange={(e) => set("property_type", e.target.value)} className={selectCls}>
              <option value="">—</option>
              <option value="piso">Piso</option>
              <option value="casa">Casa</option>
              <option value="chalet">Chalet</option>
              <option value="local_comercial">Local comercial</option>
              <option value="terreno">Terreno</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Valor estimado (€)</p>
            <input type="number" value={form.estimated_value} onChange={(e) => set("estimated_value", e.target.value)} className={inputCls} placeholder="0" min="0" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Habitaciones</p>
            <input type="number" value={form.rooms} onChange={(e) => set("rooms", e.target.value)} className={inputCls} placeholder="—" min="0" max="20" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Baños</p>
            <input type="number" value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} className={inputCls} placeholder="—" min="0" max="10" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">¿Es propietario?</p>
            <select value={form.is_owner} onChange={(e) => set("is_owner", e.target.value)} className={selectCls}>
              <option value="">—</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Urgencia de venta</p>
            <select value={form.urgency} onChange={(e) => set("urgency", e.target.value)} className={selectCls}>
              <option value="">—</option>
              <option value="inmediato">Inmediato</option>
              <option value="3_meses">3 meses</option>
              <option value="6_meses">6 meses</option>
              <option value="sin_prisa">Sin prisa</option>
            </select>
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">¿Tiene hipoteca?</p>
            <select value={form.has_mortgage} onChange={(e) => set("has_mortgage", e.target.value)} className={selectCls}>
              <option value="">—</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <InfoRow label="Email" value={lead.email ?? "—"} />
          <InfoRow label="Ciudad" value={lead.property_city ?? "—"} />
          <InfoRow
            label="Dirección"
            value={lead.property_address ?? "—"}
            href={lead.property_address
              ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.property_address)}`
              : undefined}
          />
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
      )}

      {mapAddress && (
        <div className="mt-5">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Mapa</p>
          <div className="rounded-xl overflow-hidden border border-border">
            <iframe
              src={`https://maps.google.com/maps?q=${encodeURIComponent(mapAddress)}&output=embed&z=16`}
              width="100%"
              height="220"
              style={{ border: 0, display: "block" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicación de la propiedad"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────────────────── */
interface LeadDetailProps {
  lead: Lead;
  visits: Visit[];
  notes: LeadNote[];
  files: LeadFile[];
  profiles: { id: string; full_name: string }[];
  isAdmin: boolean;
  currentUserId: string;
}

export function LeadDetail({ lead, visits, notes, files, profiles, isAdmin, currentUserId }: LeadDetailProps) {
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
          <LeadInfoEditor lead={lead} canEdit={canEdit} />

          {/* Notes */}
          <div className="bg-surface border border-border/60 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <StickyNote className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Notas</h2>
              {!canEdit && <Lock className="w-3 h-3 text-muted-foreground ml-auto" />}
            </div>
            <NotesSection leadId={lead.id} initialNotes={notes} disabled={!canEdit} />
          </div>

          {/* Files */}
          <div className="bg-surface border border-border/60 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Paperclip className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Archivos y fotos</h2>
            </div>
            <FilesSection leadId={lead.id} initialFiles={files} />
          </div>

          {/* WhatsApp conversation */}
          <div className="bg-surface border border-border/60 rounded-2xl shadow-sm overflow-hidden">
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
          <div className="bg-surface border border-border/60 rounded-2xl shadow-sm p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Estado</p>
            <StatusSelector leadId={lead.id} current={lead.status} disabled={!canEdit} />
          </div>

          {/* Agent */}
          <div className="bg-surface border border-border/60 rounded-2xl shadow-sm p-4">
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
          <div className="bg-surface border border-border/60 rounded-2xl shadow-sm p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Visitas
            </p>
            <div className="space-y-3">
              <VisitsList visits={visits} profiles={profiles} />
              <VisitForm
                leadId={lead.id}
                profiles={profiles}
                currentAgentId={lead.assigned_agent ?? null}
                propertyAddress={lead.property_address}
                disabled={!canEdit}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer"
          className="text-sm text-accent hover:underline underline-offset-2 break-words">
          {value}
        </a>
      ) : (
        <p className="text-sm text-foreground capitalize">{value}</p>
      )}
    </div>
  );
}
