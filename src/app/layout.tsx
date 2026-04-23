import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://budasdelmediterraneo.com"
  ),
  title: "Budas del Mediterráneo | Valora tu propiedad gratis",
  description:
    "Descubre el valor real de tu propiedad con Budas del Mediterráneo. Valoración gratuita, sin compromiso, respuesta en menos de 24h.",
  openGraph: {
    title: "Budas del Mediterráneo — Valora tu propiedad",
    description: "Valoración gratuita. Respuesta en 24h. Sin letra pequeña.",
    locale: "es_ES",
    type: "website",
    url: "https://budasdelmediterraneo.com",
    siteName: "Budas del Mediterráneo",
  },
  twitter: {
    card: "summary_large_image",
    title: "Budas del Mediterráneo — Valora tu propiedad",
    description: "Valoración gratuita. Respuesta en 24h. Sin letra pequeña.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
