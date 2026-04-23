import { AnimatedTitle } from "@/components/shared/AnimatedTitle";
import { FadeIn } from "@/components/shared/FadeIn";
import { ScrollTopLink } from "@/components/shared/ScrollTopLink";

const testimonials = [
  {
    quote:
      "En 26 días cerramos la venta al precio que pedíamos. Llevábamos 8 meses con otra agencia sin resultado. La diferencia fue brutal.",
    author: "Carlos M.",
    location: "Sitges, Barcelona",
    initial: "C",
  },
  {
    quote:
      "Me dijeron el precio real, no el que yo quería escuchar. Y tenían razón. El proceso fue impecable de principio a fin.",
    author: "Ana L.",
    location: "Tarragona",
    initial: "A",
  },
];

export function SocialProof() {
  return (
    <section className="py-20 lg:py-28 bg-section-dark grain">
      <div className="section-container">

        <div className="flex items-center gap-4 mb-12">
          <span className="line-accent" />
          <FadeIn direction="none">
            <span className="eyebrow text-accent">Lo que dicen nuestros clientes</span>
          </FadeIn>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {testimonials.map(({ quote, author, location, initial }, i) => (
            <FadeIn key={author} delay={i * 120} direction="up">
              <div className="bg-white/5 border border-white/8 rounded-2xl p-8 flex flex-col justify-between h-full">
                <p className="text-foreground-dark text-lg lg:text-xl leading-relaxed font-light mb-8">
                  &ldquo;{quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-6 border-t border-white/10">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-accent font-serif">{initial}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground-dark">{author}</p>
                    <p className="text-xs text-muted-dark">{location}</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Final inline CTA */}
        <FadeIn delay={300} direction="up">
          <div className="mt-12 pt-10 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <AnimatedTitle
              as="h2"
              className="heading-1 text-2xl lg:text-3xl text-foreground-dark"
              delay={0}
              wordDelay={60}
            >
              {"¿A cuánto puedes vender la tuya?"}
            </AnimatedTitle>
            <ScrollTopLink className="flex-shrink-0 inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-accent-foreground font-semibold px-6 py-3 rounded-full text-sm transition-all duration-200 hover:-translate-y-0.5 shadow-lg">
              Descubrirlo gratis
            </ScrollTopLink>
          </div>
        </FadeIn>

      </div>
    </section>
  );
}
