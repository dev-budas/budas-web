import { createServiceClient } from "@/lib/supabase/service";

export const PERMISSION_DEFS = [
  {
    key: "see_all_leads" as const,
    label: "Ver todos los leads",
    description: "Accede a leads asignados a otros agentes, no solo a los propios",
  },
  {
    key: "reassign_leads" as const,
    label: "Reasignar leads",
    description: "Puede asignar leads a cualquier agente del equipo",
  },
  {
    key: "delete_leads" as const,
    label: "Eliminar leads",
    description: "Puede eliminar leads permanentemente del sistema",
  },
  {
    key: "view_stats" as const,
    label: "Ver estadísticas",
    description: "Accede al panel de estadísticas y métricas",
  },
  {
    key: "manage_pipeline" as const,
    label: "Gestionar pipeline completo",
    description: "Puede mover cualquier lead en el kanban, no solo los propios",
  },
] as const;

export type PermissionKey = (typeof PERMISSION_DEFS)[number]["key"];

export interface RolePermissions {
  role: string;
  see_all_leads: boolean;
  reassign_leads: boolean;
  delete_leads: boolean;
  view_stats: boolean;
  manage_pipeline: boolean;
}

export interface UserPermissionsOverride {
  user_id: string;
  see_all_leads: boolean | null;
  reassign_leads: boolean | null;
  delete_leads: boolean | null;
  view_stats: boolean | null;
  manage_pipeline: boolean | null;
}

export type ResolvedPermissions = Record<PermissionKey, boolean>;

export function resolvePermissions(
  rolePerms: RolePermissions,
  userOverride: UserPermissionsOverride | null
): ResolvedPermissions {
  const result = {} as ResolvedPermissions;
  for (const { key } of PERMISSION_DEFS) {
    const ov = userOverride?.[key];
    result[key] = ov !== null && ov !== undefined ? ov : rolePerms[key];
  }
  return result;
}

export async function getEffectivePermissions(
  userId: string,
  userRole: string
): Promise<ResolvedPermissions> {
  // Admins always have full access regardless of stored permissions
  if (userRole === "admin") {
    return PERMISSION_DEFS.reduce(
      (acc, { key }) => ({ ...acc, [key]: true }),
      {} as ResolvedPermissions
    );
  }

  const supabase = createServiceClient();
  const [{ data: rolePerms }, { data: userPerms }] = await Promise.all([
    supabase.from("role_permissions").select("*").eq("role", userRole).single(),
    supabase.from("user_permissions").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  if (!rolePerms) {
    return PERMISSION_DEFS.reduce(
      (acc, { key }) => ({ ...acc, [key]: false }),
      {} as ResolvedPermissions
    );
  }

  return resolvePermissions(
    rolePerms as RolePermissions,
    userPerms as UserPermissionsOverride | null
  );
}
