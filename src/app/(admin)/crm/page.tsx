import { Users, TrendingUp, MessageSquare, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LEAD_STATUS_CONFIG } from "@/types";

const mockStats = [
  { label: "Leads totales", value: "47", change: "+12%", icon: Users, positive: true },
  { label: "Calificados", value: "18", change: "+8%", icon: TrendingUp, positive: true },
  { label: "Conversaciones activas", value: "9", change: "-2%", icon: MessageSquare, positive: false },
  { label: "Captados este mes", value: "4", change: "+100%", icon: Home, positive: true },
];

const recentLeads = [
  { id: "1", name: "Carlos Martínez", phone: "+34 612 345 678", city: "Barcelona", status: "calificado" as const, created_at: "2026-04-23T10:30:00Z" },
  { id: "2", name: "Ana López", phone: "+34 698 123 456", city: "Sitges", status: "bot_enviado" as const, created_at: "2026-04-23T09:15:00Z" },
  { id: "3", name: "Roberto Silva", phone: "+34 677 890 123", city: "Castelldefels", status: "respondio" as const, created_at: "2026-04-23T08:00:00Z" },
  { id: "4", name: "Marta Fernández", phone: "+34 654 321 987", city: "Tarragona", status: "en_seguimiento" as const, created_at: "2026-04-22T17:45:00Z" },
  { id: "5", name: "Javier Ruiz", phone: "+34 601 234 567", city: "Salou", status: "nuevo" as const, created_at: "2026-04-22T15:20:00Z" },
];

export default function CRMDashboard() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="heading-1 text-2xl text-foreground mb-1">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen de actividad · {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {mockStats.map(({ label, value, change, icon: Icon, positive }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className={`text-xs font-medium ${positive ? "text-success" : "text-destructive"}`}>
                  {change}
                </span>
              </div>
              <p className="heading-1 text-2xl text-foreground mb-0.5">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent leads */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Últimos leads</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {recentLeads.map((lead) => {
              const statusConfig = LEAD_STATUS_CONFIG[lead.status];
              return (
                <div key={lead.id} className="flex items-center justify-between px-6 py-4 hover:bg-background/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-primary/8 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-primary">
                        {lead.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.city} · {lead.phone}</p>
                    </div>
                  </div>
                  <Badge
                    style={{
                      backgroundColor: `${statusConfig.color}18`,
                      color: statusConfig.color,
                    }}
                  >
                    {statusConfig.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
