"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Phone, User, MapPin, Mail, Home, BedDouble, Bath } from "lucide-react";
import { cn } from "@/lib/utils";

const PROPERTY_TYPES = [
  { value: "piso",            label: "Piso / Apartamento" },
  { value: "casa",            label: "Casa / Adosado" },
  { value: "chalet",          label: "Chalet / Villa" },
  { value: "local_comercial", label: "Local comercial" },
  { value: "terreno",         label: "Terreno / Solar" },
  { value: "otro",            label: "Otro" },
] as const;

const RESIDENTIAL_TYPES = ["piso", "casa", "chalet"];

const ROOM_OPTIONS   = ["1", "2", "3", "4", "5", "6+"];
const BATH_OPTIONS   = ["1", "2", "3", "4+"];

const schema = z.object({
  name:          z.string().min(2, "Introduce tu nombre"),
  phone:         z.string().min(9, "Teléfono inválido").regex(/^[+\d\s()-]{9,}$/, "Formato inválido"),
  email:         z.string().email("Email inválido").optional().or(z.literal("")),
  property_city: z.string().min(2, "Indica la ciudad o zona"),
  property_type: z.enum(["piso","casa","chalet","local_comercial","terreno","otro"], {
    error: "Selecciona el tipo",
  }),
  rooms:         z.string().optional(),
  bathrooms:     z.string().optional(),
  consent:       z.literal(true, { error: "Necesitamos tu aceptación" }),
});

type FormValues = z.infer<typeof schema>;

// Shared input class for this dark glass context
const inputCls = cn(
  "w-full h-9 px-3 rounded-lg bg-white/10 border border-white/15 text-white text-sm placeholder:text-white/30",
  "focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent/60",
  "transition-colors duration-200"
);

const selectCls = cn(inputCls, "cursor-pointer appearance-none");

function Field({
  label,
  icon: Icon,
  error,
  children,
}: {
  label: string;
  icon: React.ElementType;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1.5 text-[11px] font-medium text-white/55">
        <Icon className="w-3 h-3" />
        {label}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

export function HeroForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const selectedType = watch("property_type");
  const isResidential = RESIDENTIAL_TYPES.includes(selectedType);

  async function onSubmit(data: FormValues) {
    setServerError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:          data.name,
          phone:         data.phone,
          email:         data.email || undefined,
          property_city: data.property_city,
          property_type: data.property_type,
          notes: isResidential && (data.rooms || data.bathrooms)
            ? `Habitaciones: ${data.rooms ?? "-"} · Baños: ${data.bathrooms ?? "-"}`
            : undefined,
        }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      setServerError("Error al enviar. Inténtalo de nuevo.");
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center text-center py-8 gap-4">
        <div className="w-12 h-12 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-accent" />
        </div>
        <div>
          <p className="text-white font-semibold mb-1">¡Solicitud enviada!</p>
          <p className="text-white/50 text-xs leading-relaxed">
            En breves te contactamos por WhatsApp.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3.5">

      {/* Name */}
      <Field label="Tu nombre" icon={User} error={errors.name?.message}>
        <input className={inputCls} placeholder="María García" {...register("name")} />
      </Field>

      {/* Phone */}
      <Field label="WhatsApp" icon={Phone} error={errors.phone?.message}>
        <input className={inputCls} type="tel" placeholder="612 345 678" {...register("phone")} />
      </Field>

      {/* Email */}
      <Field label="Email (opcional)" icon={Mail} error={errors.email?.message}>
        <input className={inputCls} type="email" placeholder="maria@ejemplo.com" {...register("email")} />
      </Field>

      {/* City */}
      <Field label="Ciudad o zona" icon={MapPin} error={errors.property_city?.message}>
        <input className={inputCls} placeholder="Barcelona, Sitges, Tarragona..." {...register("property_city")} />
      </Field>

      {/* Property type */}
      <Field label="Tipo de propiedad" icon={Home} error={errors.property_type?.message}>
        <div className="relative">
          <select className={selectCls} {...register("property_type")}
            style={{ colorScheme: "dark" }}>
            <option value="" disabled selected className="bg-section-dark">
              Selecciona el tipo
            </option>
            {PROPERTY_TYPES.map(({ value, label }) => (
              <option key={value} value={value} className="bg-section-dark text-white">
                {label}
              </option>
            ))}
          </select>
          {/* Custom chevron */}
          <svg
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </Field>

      {/* Conditional: rooms + bathrooms */}
      {isResidential && (
        <div className="grid grid-cols-2 gap-3 animate-fade-in-up">

          {/* Rooms */}
          <Field label="Habitaciones" icon={BedDouble} error={errors.rooms?.message}>
            <div className="relative">
              <select className={selectCls} {...register("rooms")} style={{ colorScheme: "dark" }}>
                <option value="" className="bg-section-dark">—</option>
                {ROOM_OPTIONS.map((n) => (
                  <option key={n} value={n} className="bg-section-dark text-white">{n}</option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </Field>

          {/* Bathrooms */}
          <Field label="Baños" icon={Bath} error={errors.bathrooms?.message}>
            <div className="relative">
              <select className={selectCls} {...register("bathrooms")} style={{ colorScheme: "dark" }}>
                <option value="" className="bg-section-dark">—</option>
                {BATH_OPTIONS.map((n) => (
                  <option key={n} value={n} className="bg-section-dark text-white">{n}</option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </Field>
        </div>
      )}

      {/* Consent */}
      <div className="flex items-start gap-2.5 pt-0.5">
        <input
          id="hero-consent"
          type="checkbox"
          className="mt-0.5 w-3.5 h-3.5 rounded border-white/20 accent-accent flex-shrink-0 cursor-pointer"
          {...register("consent")}
        />
        <label htmlFor="hero-consent" className="text-[11px] text-white/40 leading-relaxed cursor-pointer">
          Acepto la{" "}
          <a href="/privacidad" className="text-white/70 underline hover:text-white transition-colors">
            política de privacidad
          </a>{" "}
          y el tratamiento de mis datos.
        </label>
      </div>
      {errors.consent && <p className="text-[11px] text-red-400">{errors.consent.message}</p>}

      {serverError && (
        <p className="text-[11px] text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-11 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-all duration-200 shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 mt-1"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Enviando...
          </>
        ) : (
          "Quiero conocer el valor"
        )}
      </button>

      <p className="text-center text-[10px] text-white/25 pt-0.5">
        Gratis · Sin compromiso · Respuesta en &lt;24 h
      </p>
    </form>
  );
}
