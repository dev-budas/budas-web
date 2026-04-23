import { Navbar } from "@/components/landing/Navbar";
import { LandingFooter } from "@/components/landing/LandingFooter";

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
  return (
    <>
      <Navbar />
      <main className="bg-background min-h-screen">
        <div className="section-container pt-32 pb-20 max-w-3xl">
          <div className="mb-10">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 mb-8 group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Volver al inicio
            </a>
            <h1 className="heading-1 text-3xl sm:text-4xl text-foreground mb-3">{title}</h1>
            <p className="text-sm text-muted-foreground">Última actualización: {lastUpdated}</p>
          </div>

          <div className="prose-legal">
            {children}
          </div>
        </div>
      </main>
      <LandingFooter />
    </>
  );
}
