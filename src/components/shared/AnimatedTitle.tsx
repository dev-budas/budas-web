"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedTitleProps {
  children: string;
  className?: string;
  delay?: number; // base delay in ms
  wordDelay?: number; // extra ms per word
  as?: "h1" | "h2" | "h3" | "span";
}

export function AnimatedTitle({
  children,
  className,
  delay = 0,
  wordDelay = 80,
  as: Tag = "h1",
}: AnimatedTitleProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Split preserving line breaks marked with \n
  const lines = children.split("\n");

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as React.RefObject<any>} className={className} aria-label={children}>
      {lines.map((line, lineIdx) => {
        const words = line.split(" ");
        // Count total words before this line for stagger offset
        const wordsBeforeLine = lines
          .slice(0, lineIdx)
          .reduce((acc, l) => acc + l.split(" ").length, 0);

        return (
          <span key={lineIdx} className="block">
            {words.map((word, wordIdx) => {
              const totalIdx = wordsBeforeLine + wordIdx;
              return (
                <span key={wordIdx} className="word-reveal-word mr-[0.25em] last:mr-0">
                  <span
                    className={cn("word-reveal-inner")}
                    style={
                      visible
                        ? {
                            animationDelay: `${delay + totalIdx * wordDelay}ms`,
                            animationFillMode: "forwards",
                          }
                        : { opacity: 0 }
                    }
                  >
                    {word}
                  </span>
                </span>
              );
            })}
          </span>
        );
      })}
    </Tag>
  );
}
