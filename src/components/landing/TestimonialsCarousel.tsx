"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
} from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const testimonials = [
  {
    quote:
      "En 24 días cerramos la venta al precio que pedíamos. Llevábamos casi un año con otra agencia sin resultado. La diferencia fue brutal desde el primer momento.",
    author: "Carlos M.",
    location: "Valencia ciudad",
    initial: "C",
    property: "Piso en el Eixample",
  },
  {
    quote:
      "Lo que más valoré fue la honestidad desde el primer día. Me dijeron el precio real, no el que quería escuchar. El proceso fue impecable y sin sorpresas de ningún tipo.",
    author: "Ana L.",
    location: "Alicante",
    initial: "A",
    property: "Apartamento playa",
  },
  {
    quote:
      "Vendí mi chalet en 19 días. El equipo conoce la zona a la perfección y eso se nota en los compradores que traen. Muy recomendables, sin ninguna duda.",
    author: "Roberto S.",
    location: "Jávea, Alicante",
    initial: "R",
    property: "Chalet con piscina",
  },
  {
    quote:
      "Hice la valoración sin ningún compromiso y me sorprendió lo detallada que fue. Finalmente decidí vender y en menos de un mes ya tenía las escrituras firmadas.",
    author: "Marta F.",
    location: "Gandia, Valencia",
    initial: "M",
    property: "Piso en primera línea",
  },
  {
    quote:
      "Tenía dudas sobre el precio real de mi local. La valoración me abrió los ojos: vendí por encima de lo que esperaba y en un plazo muy razonable.",
    author: "Javier R.",
    location: "Valencia ciudad",
    initial: "J",
    property: "Local comercial",
  },
  {
    quote:
      "Excelente servicio de principio a fin. Mi agente conocía el mercado de Castellón a fondo. Nada de estimaciones vagas — datos reales y resultados reales.",
    author: "Elena P.",
    location: "Castellón de la Plana",
    initial: "E",
    property: "Casa adosada",
  },
];

const GAP = 16;
const CLONE_COUNT = 2;

export function TestimonialsCarousel() {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  const [cardWidth, setCardWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const items = [...testimonials, ...testimonials.slice(0, CLONE_COUNT)];

  // Measure card width
  useLayoutEffect(() => {
    function measure() {
      if (!containerRef.current) return;
      const w = containerRef.current.offsetWidth;
      const cols = w >= 600 ? 2 : 1;
      setCardWidth((w - GAP * (cols - 1)) / cols);
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Parallax on scroll (works on all devices, unlike background-attachment: fixed)
  useEffect(() => {
    const section = sectionRef.current;
    const bg = bgRef.current;
    if (!section || !bg) return;

    function onScroll() {
      const rect = section!.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const progress = -rect.top / section!.offsetHeight;
      bg!.style.transform = `translateY(${progress * 60}px) scale(1.12)`;
    }

    // set initial scale so there's room to translate without gaps
    bg.style.transform = "translateY(0px) scale(1.12)";
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const advance = useCallback(() => {
    setTransitioning(true);
    setIndex((i) => i + 1);
  }, []);

  const retreat = () => {
    setTransitioning(true);
    setIndex((i) => Math.max(0, i - 1));
  };

  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(advance, 5000);
    return () => clearInterval(id);
  }, [isPaused, advance]);

  function onTransitionEnd() {
    if (index >= testimonials.length) {
      setTransitioning(false);
      setIndex(index - testimonials.length);
    }
  }

  // Swipe handlers
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  }
  function handleTouchEnd(e: React.TouchEvent) {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 45) diff > 0 ? advance() : retreat();
    setIsPaused(false);
  }

  const translateX = -(index * (cardWidth + GAP));
  const activeDot = index % testimonials.length;

  return (
    <section ref={sectionRef} className="relative py-20 lg:py-28 overflow-hidden">

      {/* Background image — absolutely positioned, JS parallax (iOS safe) */}
      <div className="absolute inset-0 overflow-hidden">
        <div ref={bgRef} className="absolute inset-[-12%] will-change-transform">
          <Image
            src="/images/hero-bg.jpg"
            alt=""
            fill
            quality={75}
            className="object-cover object-center"
            sizes="100vw"
          />
        </div>
        {/* Overlay — slightly different tint than hero for section distinction */}
        <div className="absolute inset-0 bg-hero-bg/90" />
        {/* Grain */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundSize: "200px 200px",
          }}
        />
      </div>

      <div className="relative z-10 section-container">

        {/* Header */}
        <div className="flex items-end justify-between mb-10 lg:mb-12">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <span className="line-accent" />
              <span className="eyebrow text-accent">Nuestros clientes</span>
            </div>
            <h2 className="heading-1 text-3xl sm:text-4xl lg:text-5xl text-foreground-dark leading-tight">
              Lo que dicen
              <br />
              <em className="text-italic-accent">quienes ya vendieron.</em>
            </h2>
          </div>

          {/* Arrows — desktop only */}
          <div className="hidden sm:flex items-center gap-2 mb-1 flex-shrink-0">
            <button
              onClick={retreat}
              disabled={index === 0}
              aria-label="Anterior"
              className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/50 active:scale-95 transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={advance}
              aria-label="Siguiente"
              className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/50 active:scale-95 transition-all duration-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Track */}
        <div
          ref={containerRef}
          className="overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex"
            style={{
              gap: `${GAP}px`,
              transform: `translateX(${translateX}px)`,
              transition: transitioning
                ? "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)"
                : "none",
              willChange: "transform",
            }}
            onTransitionEnd={onTransitionEnd}
          >
            {items.map((t, i) => (
              <div
                key={`${t.author}-${i}`}
                className="flex-shrink-0 bg-white/[0.07] border border-white/10 rounded-2xl p-6 lg:p-8 flex flex-col justify-between"
                style={{ width: cardWidth > 0 ? cardWidth : undefined, minWidth: cardWidth > 0 ? undefined : "min(calc(100% - 32px), 340px)" }}
              >
                {/* Stars */}
                <div>
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <svg key={s} className="w-3.5 h-3.5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-foreground-dark/90 text-sm lg:text-base leading-relaxed font-light">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>

                {/* Author */}
                <div className="flex items-center gap-3 mt-6 pt-5 border-t border-white/10">
                  <div className="w-9 h-9 rounded-full bg-primary border border-accent/35 flex items-center justify-center flex-shrink-0">
                    <span className="font-serif text-base font-semibold text-accent">{t.initial}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground-dark">{t.author}</p>
                    <p className="text-xs text-muted-dark mt-0.5">{t.location} · {t.property}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots + swipe hint on mobile */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => { setTransitioning(true); setIndex(i); }}
                aria-label={`Testimonio ${i + 1}`}
                className={cn(
                  "rounded-full transition-all duration-300",
                  activeDot === i
                    ? "w-5 h-1.5 bg-accent"
                    : "w-1.5 h-1.5 bg-white/25 hover:bg-white/50"
                )}
              />
            ))}
          </div>
          <span className="text-[11px] text-white/25 sm:hidden">Desliza para ver más</span>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <p className="heading-2 text-xl lg:text-2xl text-foreground-dark font-light">
            ¿A cuánto puedes vender la tuya?
          </p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold px-6 py-3.5 rounded-full text-sm transition-all duration-200 active:scale-95 shadow-lg flex-shrink-0 min-h-[48px]"
          >
            Descubrirlo gratis
          </button>
        </div>

      </div>
    </section>
  );
}
