"use client";

import { useState, useTransition } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { createTeamUser } from "@/app/(admin)/crm/(protected)/settings/actions";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateUserModal({ onClose, onCreated }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"agent" | "supervisor" | "admin">("agent");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createTeamUser({ full_name: fullName, email, password, role });
      if (result?.error) {
        setError(result.error);
      } else {
        onCreated();
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-2xl p-6 shadow-2xl w-full max-w-sm">

        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-foreground">Nuevo usuario</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-border/50 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
              Nombre completo
            </label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="María García"
              className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
              Email
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="maria@budas.com"
              className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full h-9 px-3 pr-9 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
              Rol
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["agent", "supervisor", "admin"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`h-9 rounded-lg text-sm font-medium border transition-colors ${
                    role === r
                      ? "bg-primary text-white border-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {r === "agent" ? "Agente" : r === "supervisor" ? "Supervisor" : "Admin"}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-border/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 h-10 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60"
            >
              {isPending ? "Creando..." : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
