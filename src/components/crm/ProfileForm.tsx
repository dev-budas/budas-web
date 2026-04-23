"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/app/(admin)/crm/(protected)/settings/actions";

export function ProfileForm({ currentName }: { currentName: string }) {
  const [name, setName] = useState(currentName);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setMessage(null);
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result?.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Nombre actualizado correctamente" });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
          Nombre completo
        </label>
        <input
          name="full_name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-primary/30"
          placeholder="Tu nombre"
          required
        />
      </div>

      {message && (
        <p className={`text-xs px-3 py-2 rounded-lg ${
          message.type === "success"
            ? "bg-green-50 text-green-700"
            : "bg-red-50 text-red-600"
        }`}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="h-9 px-5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60"
      >
        {isPending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
