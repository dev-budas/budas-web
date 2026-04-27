"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createManualLead } from "@/app/(admin)/crm/actions";
import type { LeadStatus, PropertyType } from "@/types";

const MANUAL_STATUSES: { value: LeadStatus; label: string }[] = [
  { value: "nuevo", label: "Nuevo" },
  { value: "calificado", label: "Calificado" },
  { value: "en_seguimiento", label: "En seguimiento" },
  { value: "visita_agendada", label: "Visita agendada" },
  { value: "cliente", label: "Cliente" },
  { value: "captado", label: "Captado" },
  { value: "perdido", label: "Perdido" },
];

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "piso", label: "Piso" },
  { value: "casa", label: "Casa" },
  { value: "chalet", label: "Chalet" },
  { value: "local_comercial", label: "Local comercial" },
  { value: "terreno", label: "Terreno" },
  { value: "otro", label: "Otro" },
];

interface Props {
  initialStatus?: LeadStatus;
  buttonLabel?: string;
}

export default function NewLeadModal({
  initialStatus = "nuevo",
  buttonLabel = "Nuevo lead",
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const data = {
      name: fd.get("name") as string,
      phone: fd.get("phone") as string,
      email: (fd.get("email") as string) || undefined,
      property_city: (fd.get("property_city") as string) || undefined,
      property_address: (fd.get("property_address") as string) || undefined,
      property_type: (fd.get("property_type") as PropertyType) || undefined,
      rooms: fd.get("rooms") ? Number(fd.get("rooms")) : undefined,
      bathrooms: fd.get("bathrooms") ? Number(fd.get("bathrooms")) : undefined,
      estimated_value: fd.get("estimated_value")
        ? Number(fd.get("estimated_value"))
        : undefined,
      status: (fd.get("status") as LeadStatus) || initialStatus,
      notes: (fd.get("notes") as string) || undefined,
    };

    setError(null);
    startTransition(async () => {
      try {
        const lead = await createManualLead(data);
        setOpen(false);
        router.push(`/crm/leads/${lead.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al crear el lead");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-4 h-4" />
        {buttonLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !pending && setOpen(false)}
          />
          <div className="relative bg-background rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-background z-10">
              <h2 className="text-base font-semibold text-foreground">
                {buttonLabel}
              </h2>
              <button
                onClick={() => !pending && setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Contact */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Contacto
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Nombre *
                    </label>
                    <input
                      name="name"
                      required
                      placeholder="Nombre completo"
                      className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Teléfono *
                    </label>
                    <input
                      name="phone"
                      required
                      placeholder="+34 600 000 000"
                      className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              {/* Property */}
              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Propiedad
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Ciudad
                    </label>
                    <input
                      name="property_city"
                      placeholder="Barcelona"
                      className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Tipo
                    </label>
                    <select
                      name="property_type"
                      className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="">Seleccionar</option>
                      {PROPERTY_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Dirección
                  </label>
                  <input
                    name="property_address"
                    placeholder="Calle, número, piso..."
                    className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Habitaciones
                    </label>
                    <input
                      name="rooms"
                      type="number"
                      min="0"
                      placeholder="3"
                      className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Baños
                    </label>
                    <input
                      name="bathrooms"
                      type="number"
                      min="0"
                      placeholder="2"
                      className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Valoración (€)
                    </label>
                    <input
                      name="estimated_value"
                      type="number"
                      min="0"
                      placeholder="250000"
                      className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                </div>
              </div>

              {/* Status + note */}
              <div className="space-y-3 border-t border-border pt-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Estado inicial
                  </label>
                  <select
                    name="status"
                    defaultValue={initialStatus}
                    className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    {MANUAL_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Nota inicial
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    placeholder="Contexto, origen del contacto..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => !pending && setOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="bg-primary text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {pending ? "Creando..." : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
