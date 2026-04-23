import { ShieldCheck, TrendingUp, FileSearch, Clock } from "lucide-react";

const items = [
  {
    icon: ShieldCheck,
    label: "Valoración 100% gratuita",
    sub: "Sin coste ni compromiso",
  },
  {
    icon: FileSearch,
    label: "Datos del Registro de la Propiedad",
    sub: "Precios reales de cierre",
  },
  {
    icon: TrendingUp,
    label: "Operaciones recientes en tu zona",
    sub: "Mercado siempre actualizado",
  },
  {
    icon: Clock,
    label: "Menos de 28 días de media",
    sub: "Hasta cerrar la venta",
  },
];

export function TrustBar() {
  return (
    <div className="bg-surface border-b border-border shadow-sm">
      <div className="section-container">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border">
          {items.map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="flex items-start gap-3.5 py-6 px-5 lg:px-7 group"
            >
              <div className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center group-hover:bg-accent/15 transition-colors duration-200">
                <Icon className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-snug">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
