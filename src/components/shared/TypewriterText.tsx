"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TypewriterTextProps {
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
}

export function TypewriterText({
  text,
  delay = 0,
  speed = 62,
  className,
}: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        // keep cursor for a beat, then hide it
        setTimeout(() => setDone(true), 900);
      }
    }, speed);
    return () => clearInterval(id);
  }, [started, text, speed]);

  return (
    <span className={cn("inline", className)}>
      {displayed}
      {!done && (
        <span className="cursor-blink" aria-hidden="true">
          |
        </span>
      )}
    </span>
  );
}
