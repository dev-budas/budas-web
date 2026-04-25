"use client";

import { useState, useTransition } from "react";
import { Check, Minus } from "lucide-react";
import {
  PERMISSION_DEFS,
  type PermissionKey,
  type RolePermissions,
  type UserPermissionsOverride,
} from "@/lib/permissions";
import { updateUserPermissions } from "@/app/(admin)/crm/(protected)/settings/actions";

interface Props {
  userId: string;
  rolePermissions: RolePermissions;
  initialOverrides: UserPermissionsOverride | null;
}

type OverrideState = Record<PermissionKey, boolean | null>;

function buildState(overrides: UserPermissionsOverride | null): OverrideState {
  return PERMISSION_DEFS.reduce((acc, { key }) => {
    acc[key] = overrides?.[key] ?? null;
    return acc;
  }, {} as OverrideState);
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

export function UserPermissionsRow({ userId, rolePermissions, initialOverrides }: Props) {
  const [overrides, setOverrides] = useState<OverrideState>(buildState(initialOverrides));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleCustomize(key: PermissionKey) {
    setOverrides((prev) => ({
      ...prev,
      // null → inherit role, set override → start with role default
      [key]: prev[key] === null ? rolePermissions[key] : null,
    }));
    setSaved(false);
    setError(null);
  }

  function toggleValue(key: PermissionKey) {
    setOverrides((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
    setError(null);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateUserPermissions(userId, overrides);
      if (result?.error) {
        setError(result.error);
      } else {
        setSaved(true);
      }
    });
  }

  const hasAnyOverride = PERMISSION_DEFS.some(({ key }) => overrides[key] !== null);

  return (
    <div className="border-t border-border/60 bg-muted/20 px-4 py-3">
      <div className="space-y-2">
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_90px_90px_90px] text-[10px] font-semibold text-muted-foreground uppercase tracking-wide pb-1 border-b border-border/50">
          <span>Permiso</span>
          <span className="text-center">Rol base</span>
          <span className="text-center">Personalizar</span>
          <span className="text-center">Valor</span>
        </div>

        {PERMISSION_DEFS.map(({ key, label }) => {
          const roleDefault = rolePermissions[key];
          const override = overrides[key];
          const isCustomized = override !== null;
          const effectiveValue = isCustomized ? override : roleDefault;

          return (
            <div
              key={key}
              className="grid grid-cols-[1fr_90px_90px_90px] items-center py-1"
            >
              <span className="text-xs font-medium text-foreground">{label}</span>

              {/* Role default — informational */}
              <div className="flex justify-center">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    roleDefault
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {roleDefault ? <Check className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                  {roleDefault ? "Sí" : "No"}
                </span>
              </div>

              {/* Personalizar toggle */}
              <div className="flex justify-center">
                <Toggle on={isCustomized} onClick={() => toggleCustomize(key)} />
              </div>

              {/* Override value — only active when customized */}
              <div className="flex justify-center">
                {isCustomized ? (
                  <Toggle on={!!effectiveValue} onClick={() => toggleValue(key)} />
                ) : (
                  <span className="text-[10px] text-muted-foreground italic">Hereda</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
        <div>
          {hasAnyOverride && (
            <button
              type="button"
              onClick={() => {
                setOverrides(buildState(null));
                setSaved(false);
              }}
              className="text-[11px] text-muted-foreground hover:text-foreground underline transition-colors"
            >
              Restablecer todo al rol
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-500">{error}</span>}
          {saved && !error && (
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <Check className="w-3 h-3" /> Guardado
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isPending}
            className="h-7 px-3 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {isPending ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
