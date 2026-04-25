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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/shared/Logo";
import type { ResolvedPermissions } from "@/lib/permissions";

const allNavItems = [
  { href: "/crm",                label: "Dashboard",     icon: LayoutDashboard, exact: true,  permission: null },
  { href: "/crm/leads",          label: "Leads",         icon: Users,           exact: false, permission: null },
  { href: "/crm/pipeline",       label: "Pipeline",      icon: Kanban,          exact: false, permission: null },
  { href: "/crm/calendario",     label: "Calendario",    icon: Calendar,        exact: false, permission: null },
  { href: "/crm/conversaciones", label: "WhatsApp",      icon: MessageSquare,   exact: false, permission: null },
  { href: "/crm/estadisticas",   label: "Estadísticas",  icon: BarChart3,       exact: false, permission: "view_stats" as const },
  { href: "/crm/settings",       label: "Configuración", icon: Settings,        exact: false, permission: null },
];

interface CRMSidebarProps {
  userEmail?: string;
  userRole?: string;
  userName?: string;
  permissions?: ResolvedPermissions;
}

export function CRMSidebar({ userEmail, userRole, userName, permissions }: CRMSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = allNavItems.filter(({ permission }) => {
    if (!permission) return true;
    if (!permissions) return true; // show all if no permissions loaded yet
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

  return (
    <aside className="w-60 flex-shrink-0 bg-primary flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/10">
        <Logo variant="light" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
              isActive(href, exact)
                ? "bg-white/15 text-white"
                : "text-white/60 hover:bg-white/[0.08] hover:text-white/90"
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-accent/30 border border-accent/40 flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-bold text-accent">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/80 text-xs font-medium truncate">
              {userName ?? userEmail}
            </p>
            <p className="text-white/35 text-[10px] capitalize">{userRole ?? "agent"}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:bg-white/[0.08] hover:text-white/80 transition-colors duration-150"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
