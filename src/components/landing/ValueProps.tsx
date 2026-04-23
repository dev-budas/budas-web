import { MapPin, BarChart3, MessageSquare } from "lucide-react";

const props = [
  {
    icon: MapPin,
    title: "Especialistas en la costa",
    body: "Conocemos cada barrio, cada calle, cada tendencia de precio en el Mediterráneo español. No somos una franquicia nacional que trabaja tu zona de lejos.",
    stat: "15+ años",
    statLabel: "en el territorio",
  },
  {
    icon: BarChart3,
    title: "Precio real, no inflado",
    body: "Muchas inmobiliarias inflan el precio para captarte y luego bajan. Nosotros te decimos desde el primer día lo que el mercado pagará, y lo ejecutamos.",
    stat: "98%",
    statLabel: "ventas al precio acordado",
  },
  {
    icon: MessageSquare,
    title: "Comunicación radical",
    body: "Recibirás actualizaciones constantes, sin tener que perseguirnos. Tu agente asignado es responsable de mantenerte informado en todo momento.",
    stat: "24h",
    statLabel: "tiempo máximo de respuesta",
  },
];

export function ValueProps() {
  return (
    <section className="py-24 lg:py-32 bg-background">
      <div className="section-container">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16">
          <div className="max-w-xl">
            <span className="eyebrow text-accent mb-4 block">Por qué elegirnos</span>
            <h2 className="heading-1 text-3xl lg:text-4xl text-foreground">
              No somos la inmobiliaria
              <br />
              de siempre.
            </h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed lg:text-right">
            Fundada con la convicción de que vender una propiedad debería ser
            una experiencia clara, honesta y sin sorpresas.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid md:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden shadow-sm">
          {props.map(({ icon: Icon, title, body, stat, statLabel }) => (
            <div
              key={title}
              className="bg-surface p-8 lg:p-10 group hover:bg-section-dark transition-colors duration-300"
            >
              {/* Icon */}
              <div className="w-11 h-11 rounded-xl bg-primary/6 group-hover:bg-accent/15 flex items-center justify-center mb-8 transition-colors duration-300">
                <Icon className="w-5 h-5 text-primary group-hover:text-accent transition-colors duration-300" />
              </div>

              {/* Title */}
              <h3 className="heading-2 text-lg text-foreground group-hover:text-foreground-dark mb-3 transition-colors duration-300">
                {title}
              </h3>

              {/* Body */}
              <p className="text-sm text-muted-foreground group-hover:text-muted-dark leading-relaxed mb-8 transition-colors duration-300">
                {body}
              </p>

              {/* Stat */}
              <div className="border-t border-border group-hover:border-white/10 pt-6 transition-colors duration-300">
                <div className="heading-display text-3xl text-gradient-gold mb-0.5">{stat}</div>
                <div className="text-xs text-muted-foreground group-hover:text-muted-dark transition-colors duration-300">
                  {statLabel}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
