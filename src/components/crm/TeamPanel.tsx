"use client";

import { useState, useTransition } from "react";
import { Shield, UserPlus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { deleteTeamUser } from "@/app/(admin)/crm/(protected)/settings/actions";
import { CreateUserModal } from "./CreateUserModal";
import { UserPermissionsRow } from "./UserPermissionsRow";
import type { RolePermissions, UserPermissionsOverride } from "@/lib/permissions";

interface Member {
  id: string;
  full_name: string;
  role: string;
}

interface Props {
  currentUserId: string;
  team: Member[];
  agentRolePermissions: RolePermissions | null;
  userPermissionsMap: Record<string, UserPermissionsOverride>;
}

export function TeamPanel({
  currentUserId,
  team: initialTeam,
  agentRolePermissions,
  userPermissionsMap,
}: Props) {
  const [team, setTeam] = useState(initialTeam);
  const [showCreate, setShowCreate] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreated() {
    window.location.reload();
  }

  function handleDelete(memberId: string) {
    if (!confirm("¿Eliminar este usuario? Esta acción no se puede deshacer.")) return;
    setDeletingId(memberId);
    startTransition(async () => {
      const result = await deleteTeamUser(memberId);
      if (result?.error) {
        alert(result.error);
      } else {
        setTeam((prev) => prev.filter((m) => m.id !== memberId));
        if (expandedId === memberId) setExpandedId(null);
      }
      setDeletingId(null);
    });
  }

  function toggleExpand(memberId: string) {
    setExpandedId((prev) => (prev === memberId ? null : memberId));
  }

  // Default role permissions fallback for display purposes
  const defaultRolePerms: RolePermissions = agentRolePermissions ?? {
    role: "agent",
    see_all_leads: true,
    reassign_leads: false,
    delete_leads: false,
    view_stats: true,
    manage_pipeline: false,
  };

  return (
    <>
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Equipo</h2>
            <p className="text-xs text-muted-foreground">
              {team.length} miembro{team.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="ml-auto flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Nuevo usuario
          </button>
        </div>

        <div className="divide-y divide-border">
          {team.map((member) => {
            const isExpanded = expandedId === member.id;
            const isAgent = member.role === "agent";
            const hasOverride = !!userPermissionsMap[member.id];

            return (
              <div key={member.id}>
                {/* Member row */}
                <div className="flex items-center gap-3 py-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {member.full_name?.charAt(0).toUpperCase() ?? "?"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{member.full_name ?? "—"}</p>
                    {hasOverride && (
                      <p className="text-[10px] text-accent font-medium">Permisos personalizados</p>
                    )}
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-border/60 text-muted-foreground capitalize">
                    {member.role}
                  </span>

                  {/* Expand permissions — only for agents */}
                  {isAgent && (
                    <button
                      onClick={() => toggleExpand(member.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                      title="Editar permisos individuales"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}

                  {member.id !== currentUserId && (
                    <button
                      onClick={() => handleDelete(member.id)}
                      disabled={isPending && deletingId === member.id}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                      title="Eliminar usuario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Permissions expand panel */}
                {isExpanded && isAgent && (
                  <UserPermissionsRow
                    userId={member.id}
                    rolePermissions={defaultRolePerms}
                    initialOverrides={userPermissionsMap[member.id] ?? null}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
