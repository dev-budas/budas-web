import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "light" | "dark";
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { main: "text-[22px]", sub: "text-[7px]", mt: "mt-[1px]" },
  md: { main: "text-[30px]", sub: "text-[9px]",  mt: "mt-[2px]" },
  lg: { main: "text-[52px]", sub: "text-[12px]", mt: "mt-[3px]" },
};

export function Logo({ variant = "light", className, size = "md" }: LogoProps) {
  const isLight = variant === "light";
  const s = sizes[size];

  return (
    <div className={cn("flex flex-col leading-none select-none", className)}>
      <div className="flex items-baseline gap-[1px]">
        <span
          className={cn(s.main, "font-black tracking-[-0.03em] lowercase")}
          style={{ color: isLight ? "#ffffff" : "#1B3A5C" }}
        >
          budas
        </span>
        <span
          className={cn(s.main, "font-black")}
          style={{ color: "#C9A96E" }}
        >
          .
        </span>
      </div>
      <span
        className={cn(s.sub, s.mt, "font-medium tracking-[0.2em] uppercase")}
        style={{ color: isLight ? "rgba(255,255,255,0.55)" : "rgba(27,58,92,0.5)" }}
      >
        del Mediterráneo
      </span>
    </div>
  );
}
