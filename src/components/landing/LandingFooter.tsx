import { Logo } from "@/components/shared/Logo";

export function LandingFooter() {
  return (
    <footer className="bg-hero-bg grain border-t border-white/8">
      <div className="section-container py-12 lg:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-[auto_1fr_auto] gap-10 items-start">

          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <a href="/" aria-label="Budas del Mediterráneo — inicio" className="inline-block mb-4">
              <Logo variant="light" />
            </a>
            <p className="text-muted-dark text-xs leading-relaxed max-w-xs">
              Especialistas en la compra y venta de propiedades en la costa mediterránea española.
            </p>
          </div>

          {/* Spacer on desktop */}
          <div className="hidden lg:block" />

          {/* Links */}
          <div className="flex flex-col gap-2">
            <p className="eyebrow text-white/30 mb-2">Legal</p>
            {[
              ["Política de privacidad", "/privacidad"],
              ["Aviso legal", "/aviso-legal"],
              ["Política de cookies", "/cookies"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="text-xs text-muted-dark hover:text-white/80 transition-colors duration-200"
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-white/25">
            © {new Date().getFullYear()} Budas del Mediterráneo S.L. · Todos los derechos reservados
          </p>
          <p className="text-xs text-white/20">
            Diseñado y desarrollado con precisión.
          </p>
        </div>
      </div>
    </footer>
  );
}
