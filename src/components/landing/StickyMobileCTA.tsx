"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 sm:hidden transition-transform duration-300 ease-out",
        visible ? "translate-y-0" : "translate-y-full"
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-hidden={!visible}
    >
      <div className="bg-[#0f1e2e]/95 backdrop-blur-md border-t border-white/10 px-4 pt-3 pb-4">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="w-full h-12 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-all duration-200 active:scale-[0.98] shadow-lg"
        >
          Solicitar valoración gratuita
        </button>
        <p className="text-center text-[10px] text-white/30 mt-1.5">
          Sin coste · Sin compromiso
        </p>
      </div>
    </div>
  );
}
