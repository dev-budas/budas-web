import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "light" | "dark";
  className?: string;
}

export function Logo({ variant = "light", className }: LogoProps) {
  const isLight = variant === "light";

  return (
    <div className={cn("flex flex-col leading-none select-none", className)}>
      <div className="flex items-baseline gap-[1px]">
        <span
          className="text-[30px] font-black tracking-[-0.03em] lowercase"
          style={{ color: isLight ? "#ffffff" : "#1B3A5C" }}
        >
          budas
        </span>
        <span
          className="text-[30px] font-black"
          style={{ color: "#C9A96E" }}
        >
          .
        </span>
      </div>
      <span
        className="text-[9px] font-medium tracking-[0.2em] uppercase mt-[2px]"
        style={{ color: isLight ? "rgba(255,255,255,0.55)" : "rgba(27,58,92,0.5)" }}
      >
        del Mediterráneo
      </span>
    </div>
  );
}
