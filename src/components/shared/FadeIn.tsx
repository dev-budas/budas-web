"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
}

export function FadeIn({ children, className, delay = 0, direction = "up" }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const dirClass = {
    up: "animate-fade-in-up",
    left: "animate-slide-in-left",
    right: "animate-slide-in-right",
    none: "animate-fade-in",
  }[direction];

  return (
    <div
      ref={ref}
      className={cn(visible ? dirClass : "opacity-0", className)}
      style={visible ? { animationDelay: `${delay}ms`, animationFillMode: "forwards" } : undefined}
    >
      {children}
    </div>
  );
}
