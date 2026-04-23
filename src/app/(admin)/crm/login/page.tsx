"use client";

import { useState, useTransition } from "react";
import { login } from "./actions";
import { Logo } from "@/components/shared/Logo";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await login(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4">

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="/images/hero-bg.jpg"
          alt=""
          className="w-full h-full object-cover object-center scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1929]/95 via-[#0B1929]/85 to-[#1B3A5C]/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm">

        {/* Logo */}
        <div className="flex justify-center mb-12">
          <Logo variant="light" size="lg" />
        </div>

        {/* Card */}
        <div className="bg-white/[0.07] backdrop-blur-xl border border-white/12 rounded-2xl p-8 shadow-2xl">
          <div className="mb-7">
            <h1 className="text-white font-semibold text-xl mb-1">Acceso al CRM</h1>
            <p className="text-white/40 text-sm">Introduce tus credenciales para continuar.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="tu@email.com"
                className="w-full h-10 px-3.5 rounded-lg bg-white/10 border border-white/15 text-white text-sm placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent/60 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full h-10 px-3.5 pr-10 rounded-lg bg-white/10 border border-white/15 text-white text-sm placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-11 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none mt-1"
            >
              {isPending ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          Budas del Mediterráneo · CRM interno
        </p>
      </div>
    </div>
  );
}
