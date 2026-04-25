"use client";

import { useState, useTransition } from "react";
import { Lock, ShieldCheck, Check } from "lucide-react";
import { PERMISSION_DEFS, type RolePermissions, type PermissionKey } from "@/lib/permissions";
import { updateRolePermissions } from "@/app/(admin)/crm/(protected)/settings/actions";

interface Props {
  agentPermissions: RolePermissions;
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
        on ? "bg-primary" : "bg-border"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export function PermissionsMatrix({ agentPermissions }: Props) {
  const [perms, setPerms] = useState<RolePermissions>(agentPermissions);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle(key: PermissionKey) {
    setPerms((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
    setError(null);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateRolePermissions("agent", perms);
      if (result?.error) {
        setError(result.error);
      } else {
        setSaved(true);
      }
    });
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Permisos por rol</h2>
          <p className="text-xs text-muted-foreground">
            Define qué puede hacer cada rol. Los permisos de Admin no se pueden modificar.
          </p>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_100px_100px] bg-muted/40 px-4 py-2.5 border-b border-border">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Permiso
          </span>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide text-center">
            Admin
          </span>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide text-center">
            Agente
          </span>
        </div>

        {/* Rows */}
        {PERMISSION_DEFS.map(({ key, label, description }, i) => (
          <div
            key={key}
            className={`grid grid-cols-[1fr_100px_100px] px-4 py-3.5 items-center ${
              i < PERMISSION_DEFS.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <div>
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>

            {/* Admin — always on, locked */}
            <div className="flex justify-center">
              <div className="flex items-center gap-1.5 text-emerald-600">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </div>
                <Lock className="w-3 h-3 opacity-50" />
              </div>
            </div>

            {/* Agent — toggleable */}
            <div className="flex justify-center">
              <Toggle on={perms[key]} onClick={() => toggle(key)} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-3 mt-4">
        {error && <span className="text-xs text-red-500">{error}</span>}
        {saved && !error && (
          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <Check className="w-3 h-3" /> Guardado
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={isPending}
          className="h-8 px-4 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {isPending ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
