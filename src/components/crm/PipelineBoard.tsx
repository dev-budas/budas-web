"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { LEAD_STATUS_CONFIG } from "@/types";
import type { Lead, LeadStatus } from "@/types";
import { updateLeadStatus } from "@/app/(admin)/crm/actions";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";
import { LeadEditModal } from "./LeadEditModal";

/* ── Lead Card ─────────────────────────────────────────────────────────── */
function LeadCard({
  lead,
  isDragging = false,
  onEdit,
}: {
  lead: Lead;
  isDragging?: boolean;
  onEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: lead.id });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        "bg-surface border border-border/60 rounded-2xl shadow-sm p-3.5 select-none transition-shadow",
        isDragging ? "opacity-0" : "hover:shadow-md hover:border-primary/20"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        {/* Drag handle */}
        <div
          {...listeners}
          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-grab active:cursor-grabbing"
        >
          <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-primary">{lead.name.charAt(0).toUpperCase()}</span>
          </div>
          <p className="text-sm font-semibold text-foreground truncate">{lead.name}</p>
        </div>
        {/* Edit button */}
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="flex-shrink-0 p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/8 transition-colors"
          title="Editar lead"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
      <div {...listeners} className="cursor-grab active:cursor-grabbing">
        <p className="text-xs text-muted-foreground truncate mb-1">
          {lead.property_city ?? "—"} · {lead.property_type?.replace("_", " ") ?? "—"}
        </p>
        <p className="text-xs text-muted-foreground">{lead.phone}</p>
        {lead.assigned_agent && (
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-[10px] text-muted-foreground">Asignado</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Dragging Ghost Card ────────────────────────────────────────────────── */
function GhostCard({ lead }: { lead: Lead }) {
  return (
    <div className="bg-surface border border-primary/30 rounded-xl p-3.5 shadow-2xl rotate-2 w-56 opacity-90">
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-primary">{lead.name.charAt(0).toUpperCase()}</span>
        </div>
        <p className="text-sm font-semibold text-foreground truncate">{lead.name}</p>
      </div>
      <p className="text-xs text-muted-foreground">{lead.property_city ?? "—"}</p>
    </div>
  );
}

/* ── Column ─────────────────────────────────────────────────────────────── */
function Column({
  status,
  leads,
  onEdit,
}: {
  status: LeadStatus;
  leads: Lead[];
  onEdit: (lead: Lead) => void;
}) {
  const config = LEAD_STATUS_CONFIG[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col min-w-[220px] w-[220px]">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
          <span className="text-xs font-semibold text-foreground">{config.label}</span>
        </div>
        <span className="text-[10px] font-medium text-muted-foreground bg-border rounded-full px-2 py-0.5">
          {leads.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 min-h-[400px] rounded-xl p-2 space-y-2 transition-colors",
          isOver ? "bg-accent/8 ring-1 ring-accent/30" : "bg-border/30"
        )}
      >
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onEdit={() => onEdit(lead)} />
        ))}
        {leads.length === 0 && (
          <div className="flex items-center justify-center h-20 text-[11px] text-muted-foreground">
            Sin leads
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Confirmation Modal ─────────────────────────────────────────────────── */
function ConfirmModal({
  lead, from, to, onConfirm, onCancel, loading,
}: {
  lead: Lead; from: LeadStatus; to: LeadStatus;
  onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  const fromCfg = LEAD_STATUS_CONFIG[from];
  const toCfg = LEAD_STATUS_CONFIG[to];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-surface border border-border rounded-2xl p-6 shadow-2xl w-full max-w-sm">
        <h3 className="font-semibold text-foreground mb-1">Mover lead</h3>
        <p className="text-sm text-muted-foreground mb-5">
          ¿Cambiar el estado de <strong className="text-foreground">{lead.name}</strong>?
        </p>
        <div className="flex items-center gap-3 bg-border/40 rounded-xl px-4 py-3 mb-6">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: `${fromCfg.color}18`, color: fromCfg.color }}>
            {fromCfg.label}
          </span>
          <span className="text-muted-foreground text-sm">→</span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: `${toCfg.color}18`, color: toCfg.color }}>
            {toCfg.label}
          </span>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-border/50 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 h-10 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60">
            {loading ? "Guardando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Board ──────────────────────────────────────────────────────────────── */
const STATUSES: LeadStatus[] = [
  "nuevo", "bot_enviado", "respondio", "calificado",
  "no_calificado", "en_seguimiento", "visita_agendada", "captado", "perdido",
];

export function PipelineBoard({
  leads: initialLeads,
  profiles,
  isAdmin,
  currentUserId,
}: {
  leads: Lead[];
  profiles: { id: string; full_name: string }[];
  isAdmin: boolean;
  currentUserId: string;
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, setPending] = useState<{ lead: Lead; from: LeadStatus; to: LeadStatus } | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  function onDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;
    const lead = leads.find((l) => l.id === active.id);
    const toStatus = over.id as LeadStatus;
    if (!lead || lead.status === toStatus) return;
    setPending({ lead, from: lead.status, to: toStatus });
  }

  async function confirmMove() {
    if (!pending) return;
    setSaving(true);
    try {
      await updateLeadStatus(pending.lead.id, pending.to);
      setLeads((prev) =>
        prev.map((l) => l.id === pending.lead.id ? { ...l, status: pending.to } : l)
      );
    } finally {
      setSaving(false);
      setPending(null);
    }
  }

  function handleStatusChangeFromModal(leadId: string, newStatus: LeadStatus) {
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: newStatus } : l));
    setEditingLead((prev) => prev ? { ...prev, status: newStatus } : prev);
  }

  const grouped = STATUSES.reduce<Record<LeadStatus, Lead[]>>((acc, s) => {
    acc[s] = leads.filter((l) => l.status === s);
    return acc;
  }, {} as Record<LeadStatus, Lead[]>);

  return (
    <>
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 min-h-[calc(100vh-140px)]">
          {STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              leads={grouped[status]}
              onEdit={setEditingLead}
            />
          ))}
        </div>
        <DragOverlay>
          {activeLead ? <GhostCard lead={activeLead} /> : null}
        </DragOverlay>
      </DndContext>

      {pending && (
        <ConfirmModal
          lead={pending.lead}
          from={pending.from}
          to={pending.to}
          onConfirm={confirmMove}
          onCancel={() => setPending(null)}
          loading={saving}
        />
      )}

      {editingLead && (
        <LeadEditModal
          lead={editingLead}
          profiles={profiles}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          onClose={() => setEditingLead(null)}
          onStatusChange={handleStatusChangeFromModal}
        />
      )}
    </>
  );
}
