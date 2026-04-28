"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Kanban,
  Settings,
  MessageSquare,
  BarChart3,
  LogOut,
  Calendar,
  UserCheck,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/shared/Logo";
import type { ResolvedPermissions } from "@/lib/permissions";

const allNavItems = [
  { href: "/crm",                label: "Dashboard",     icon: LayoutDashboard, exact: true,  permission: null,                 adminOnly: false },
  { href: "/crm/clientes",       label: "Clientes",      icon: UserCheck,       exact: false, permission: null,                 adminOnly: false },
  { href: "/crm/leads",          label: "Leads",         icon: Users,           exact: false, permission: null,                 adminOnly: false },
  { href: "/crm/pipeline",       label: "Pipeline",      icon: Kanban,          exact: false, permission: null,                 adminOnly: false },
  { href: "/crm/conversaciones", label: "WhatsApp",      icon: MessageSquare,   exact: false, permission: null,                 adminOnly: false },
  { href: "/crm/campanas",       label: "Campañas",      icon: Megaphone,       exact: false, permission: null,                 adminOnly: true  },
  { href: "/crm/calendario",     label: "Calendario",    icon: Calendar,        exact: false, permission: null,                 adminOnly: false },
  { href: "/crm/estadisticas",   label: "Estadísticas",  icon: BarChart3,       exact: false, permission: "view_stats" as const, adminOnly: false },
  { href: "/crm/settings",       label: "Configuración", icon: Settings,        exact: false, permission: null,                 adminOnly: false },
];

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  supervisor: "Supervisor",
  agent: "Agente",
};

interface CRMSidebarProps {
  userEmail?: string;
  userRole?: string;
  userName?: string;
  permissions?: ResolvedPermissions;
}

export function CRMSidebar({ userEmail, userRole, userName, permissions }: CRMSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = allNavItems.filter(({ permission, adminOnly }) => {
    if (adminOnly && userRole !== "admin") return false;
    if (!permission) return true;
    if (!permissions) return true;
    return permissions[permission];
  });

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/crm/login");
  }

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : userEmail?.[0]?.toUpperCase() ?? "U";

  const roleLabel = ROLE_LABELS[userRole ?? ""] ?? (userRole ?? "");

  return (
    <aside
      className="w-[230px] flex-shrink-0 flex flex-col h-full"
      style={{
        background: "linear-gradient(180deg, #1d3f63 0%, #0f2538 100%)",
      }}
    >
      {/* Brand */}
      <div className="px-5 pt-7 pb-5">
        <Logo variant="light" size="xl" />
      </div>

      {/* Subtle divider */}
      <div className="mx-4 h-px bg-white/[0.08]" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-[9px] rounded-[10px] text-[13px] font-medium transition-all duration-150",
                active
                  ? "bg-white/[0.13] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : "text-white/55 hover:bg-white/[0.07] hover:text-white/85"
              )}
            >
              <Icon
                className={cn(
                  "flex-shrink-0 transition-colors",
                  active ? "w-[17px] h-[17px] text-white" : "w-[17px] h-[17px] text-white/50"
                )}
              />
              {label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent/80 flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User card */}
      <div className="px-3 pb-4">
        <div
          className="rounded-[12px] overflow-hidden"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}
        >
          <div className="flex items-center gap-3 px-3.5 py-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[12px]"
              style={{
                background: "linear-gradient(135deg, #C9A96E40, #C9A96E20)",
                border: "1px solid rgba(201,169,110,0.35)",
                color: "#C9A96E",
              }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/85 text-[12px] font-medium truncate leading-tight">
                {userName ?? userEmail}
              </p>
              <p className="text-white/35 text-[10px] leading-tight mt-0.5">{roleLabel}</p>
            </div>
          </div>
          <div className="h-px bg-white/[0.07]" />
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] font-medium text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-colors duration-150"
          >
            <LogOut className="w-[14px] h-[14px] flex-shrink-0" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  );
}
