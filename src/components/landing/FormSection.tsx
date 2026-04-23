import { LeadForm } from "./LeadForm";

const steps = [
  {
    num: "01",
    title: "Rellena el formulario",
    desc: "Solo necesitamos tus datos básicos y el tipo de propiedad. 2 minutos.",
  },
  {
    num: "02",
    title: "Mediterra te escribe",
    desc: "Nuestro asistente inteligente te contacta por WhatsApp para afinar los detalles.",
  },
  {
    num: "03",
    title: "Recibes tu valoración",
    desc: "Un agente especializado te presenta el precio real de mercado. Sin compromiso.",
  },
];

export function FormSection() {
  return (
    <section id="valoracion" className="relative bg-background">

      {/* Top dark band that bleeds from hero */}
      <div className="h-16 bg-gradient-to-b from-section-dark/60 to-transparent" />

      <div id="como-funciona" className="section-container pb-24 lg:pb-32">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-0 rounded-3xl overflow-hidden shadow-2xl">

          {/* ── Left dark column ── */}
          <div className="bg-section-dark grain px-8 py-12 lg:px-12 lg:py-16 flex flex-col justify-between">

            <div>
              <span className="eyebrow text-accent mb-4 block">Cómo funciona</span>
              <h2 className="heading-1 text-3xl lg:text-4xl text-foreground-dark mb-6">
                Del formulario
                <br />
                al precio real
                <br />
                <em className="text-italic-accent">en 24 horas.</em>
              </h2>
              <p className="text-muted-dark text-sm leading-relaxed max-w-sm">
                Nada de esperas. Nada de agentes que no conocen la zona.
                Tenemos datos reales del mercado y los usamos para ti.
              </p>
            </div>

            {/* Steps */}
            <ol className="mt-10 space-y-8">
              {steps.map((step) => (
                <li key={step.num} className="flex gap-5">
                  <span className="flex-shrink-0 w-10 h-10 rounded-full border border-accent/30 flex items-center justify-center">
                    <span className="font-mono text-xs font-bold text-accent">{step.num}</span>
                  </span>
                  <div className="pt-1">
                    <p className="font-semibold text-foreground-dark text-sm mb-1">{step.title}</p>
                    <p className="text-xs text-muted-dark leading-relaxed">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>

            {/* Trust badge */}
            <div className="mt-10 pt-8 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {["C", "M", "R", "J"].map((initial) => (
                    <div
                      key={initial}
                      className="w-7 h-7 rounded-full bg-primary-hover border-2 border-section-dark flex items-center justify-center"
                    >
                      <span className="text-[10px] font-semibold text-accent">{initial}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-dark">
                  <span className="text-foreground-dark font-medium">+200 propietarios</span>{" "}
                  ya confiaron en nosotros
                </p>
              </div>
            </div>
          </div>

          {/* ── Right white column: form ── */}
          <div className="bg-surface px-8 py-12 lg:px-12 lg:py-16">
            <div className="max-w-sm mx-auto lg:mx-0">
              <span className="eyebrow text-muted-foreground mb-3 block">Paso 1 de 3</span>
              <h3 className="heading-2 text-2xl text-foreground mb-2">
                Solicita tu valoración
              </h3>
              <p className="text-sm text-muted-foreground mb-8">
                Gratuita, sin compromiso y sin que te llamemos 30 veces.
              </p>
              <LeadForm />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
