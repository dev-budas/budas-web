import Image from "next/image";
import { Home, BadgeCheck, Clock } from "lucide-react";
import { AnimatedTitle } from "@/components/shared/AnimatedTitle";
import { TypewriterText } from "@/components/shared/TypewriterText";
import { FadeIn } from "@/components/shared/FadeIn";
import { HeroForm } from "./HeroForm";

const stats = [
  { icon: Home,        value: "+60",     label: "propiedades vendidas" },
  { icon: Clock,       value: "<28 días", label: "tiempo medio de venta" },
  { icon: BadgeCheck,  value: "100%",    label: "valoración gratuita" },
];

// "Tu propiedad\nvale más de" = 5 words
// delay=100, wordDelay=75 → last word starts at 100 + 4*75 = 400ms
// animation duration ≈ 750ms → typewriter can start at ~1200ms
const TYPEWRITER_DELAY = 1200;

export function Hero() {
  return (
    <section id="hero" className="relative min-h-[100svh] flex flex-col overflow-hidden bg-hero-bg">

      {/* ── Background image with Ken Burns ── */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 animate-ken-burns will-change-transform">
          <Image
            src="/images/hero-bg.jpg"
            alt=""
            fill
            priority
            quality={85}
            className="object-cover object-center"
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-hero-bg/93 via-hero-bg/72 to-hero-bg/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-hero-bg/85 via-transparent to-hero-bg/25" />
      </div>

      {/* ── Grain ── */}
      <div
        className="absolute inset-0 z-[1] opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 flex-1 flex items-start lg:items-center section-container w-full pt-20 pb-16 lg:pt-32 lg:pb-20">
        <div className="w-full grid lg:grid-cols-[1fr_420px] gap-12 lg:gap-16 items-start">

          {/* Left: Headline */}
          <div>
            <FadeIn delay={0} direction="none">
              <div className="flex items-center gap-3 mb-8">
                <span className="line-accent" />
                <span className="eyebrow text-accent tracking-[0.15em]">
                  Expertos en inversión inmobiliaria · Costa mediterránea
                </span>
              </div>
            </FadeIn>

            {/* Headline — word reveal for first lines, typewriter for last */}
            <h1
              className="heading-display text-[clamp(3rem,5.5vw,5.5rem)] text-white mb-8 leading-[1.05]"
              aria-label="Tu propiedad vale más de lo que imaginas."
            >
              {/* Lines 1-2: word reveal */}
              <AnimatedTitle
                as="span"
                delay={100}
                wordDelay={75}
                className="block"
              >
                {"Tu propiedad\nvale más de"}
              </AnimatedTitle>

              {/* Line 3: typewriter, bold */}
              <span className="block font-bold italic">
                <TypewriterText
                  text="lo que imaginas."
                  delay={TYPEWRITER_DELAY}
                  speed={60}
                />
              </span>
            </h1>

            <FadeIn delay={650} direction="up">
              <p className="text-base lg:text-lg text-white/65 leading-relaxed max-w-md mb-10 font-light">
                Valoramos con datos reales: escrituras del registro de la propiedad,
                precios de cierre en tu zona y operaciones recientes. Sin estimaciones.
                Sin compromisos.
              </p>
            </FadeIn>

            {/* Stats with icons — improved legibility */}
            <FadeIn delay={800} direction="up">
              <div className="flex flex-wrap gap-3">
                {stats.map(({ icon: Icon, value, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 bg-black/40 border border-white/20 rounded-xl px-4 py-3 backdrop-blur-md"
                  >
                    <div className="w-8 h-8 rounded-lg bg-accent/25 border border-accent/35 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-white leading-none mb-0.5 tracking-tight">
                        {value}
                      </div>
                      <div className="text-[11px] text-white/75 leading-tight font-medium">{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>

          {/* Right: Form card */}
          <FadeIn delay={400} direction="right">
            <div className="bg-white/[0.06] backdrop-blur-xl border border-white/15 rounded-2xl p-7 shadow-2xl">
              <div className="mb-6 pb-5 border-b border-white/10">
                <p className="eyebrow text-accent tracking-[0.12em] text-[10px] mb-2">
                  Valoración gratuita
                </p>
                <p className="text-white font-bold uppercase tracking-widest text-xs leading-relaxed">
                  Solicita tu valoración
                </p>
                <p className="text-white/45 text-[11px] leading-relaxed mt-1.5">
                  Un agente especializado te responde de forma rápida y personalizada.
                </p>
              </div>
              <HeroForm />
            </div>
          </FadeIn>

        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
    </section>
  );
}
