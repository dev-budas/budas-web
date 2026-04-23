"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/90 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="section-container flex items-center justify-between h-16 lg:h-20">
        {/* Logo */}
        <a href="/" className="flex items-center" aria-label="Budas del Mediterráneo — inicio">
          <Logo variant={scrolled ? "dark" : "light"} />
        </a>

        {/* CTA */}
        <a
          href="#valoracion"
          className={cn(
            "hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
            scrolled
              ? "bg-primary text-white hover:bg-primary-hover shadow-sm"
              : "bg-white/15 text-white border border-white/25 hover:bg-white/25 backdrop-blur-sm"
          )}
        >
          Valorar mi propiedad
        </a>
      </div>
    </header>
  );
}
