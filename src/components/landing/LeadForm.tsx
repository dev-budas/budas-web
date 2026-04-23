"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Home, MapPin, Phone, User, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LeadFormData } from "@/types";

const formSchema = z.object({
  name: z.string().min(2, "Introduce tu nombre completo"),
  phone: z
    .string()
    .min(9, "Teléfono inválido")
    .regex(/^[+\d\s()-]{9,}$/, "Formato de teléfono inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  property_type: z.enum(["piso", "casa", "chalet", "local_comercial", "terreno", "otro"]),
  property_city: z.string().min(2, "Indica la ciudad o zona"),
  consent: z.literal(true, {
    error: "Debes aceptar la política de privacidad",
  }),
});

type FormValues = z.infer<typeof formSchema>;

const propertyTypes = [
  { value: "piso", label: "Piso / Apartamento" },
  { value: "casa", label: "Casa / Adosado" },
  { value: "chalet", label: "Chalet / Villa" },
  { value: "local_comercial", label: "Local comercial" },
  { value: "terreno", label: "Terreno / Solar" },
  { value: "otro", label: "Otro" },
];

export function LeadForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const selectedPropertyType = watch("property_type");
  const consentChecked = watch("consent");

  async function onSubmit(data: FormValues) {
    setServerError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data as LeadFormData),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Error al enviar el formulario");
      }

      setSubmitted(true);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Error inesperado. Inténtalo de nuevo."
      );
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center text-center py-12 px-6">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <h3 className="heading-2 text-2xl text-foreground mb-3">
          ¡Solicitud recibida!
        </h3>
        <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
          En breves recibirás un mensaje de WhatsApp de nuestro equipo para
          concretar tu valoración gratuita.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            Nombre completo
          </span>
        </Label>
        <Input
          id="name"
          placeholder="María García López"
          error={!!errors.name}
          {...register("name")}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        <Label htmlFor="phone">
          <span className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
            Teléfono (WhatsApp)
          </span>
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="612 345 678"
          error={!!errors.phone}
          {...register("phone")}
        />
        {errors.phone && (
          <p className="text-xs text-destructive">{errors.phone.message}</p>
        )}
      </div>

      {/* Email (optional) */}
      <div className="space-y-1.5">
        <Label htmlFor="email">
          <span className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
            Email{" "}
            <span className="text-muted-foreground font-normal">(opcional)</span>
          </span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="maria@ejemplo.com"
          error={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* Property type */}
      <div className="space-y-1.5">
        <Label>
          <span className="flex items-center gap-1.5">
            <Home className="w-3.5 h-3.5 text-muted-foreground" />
            Tipo de propiedad
          </span>
        </Label>
        <Select
          onValueChange={(val) =>
            setValue("property_type", val as FormValues["property_type"], {
              shouldValidate: true,
            })
          }
          value={selectedPropertyType}
        >
          <SelectTrigger error={!!errors.property_type}>
            <SelectValue placeholder="Selecciona el tipo" />
          </SelectTrigger>
          <SelectContent>
            {propertyTypes.map((pt) => (
              <SelectItem key={pt.value} value={pt.value}>
                {pt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.property_type && (
          <p className="text-xs text-destructive">{errors.property_type.message}</p>
        )}
      </div>

      {/* City */}
      <div className="space-y-1.5">
        <Label htmlFor="property_city">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
            Ciudad o zona
          </span>
        </Label>
        <Input
          id="property_city"
          placeholder="Barcelona, Costa Brava, Sitges..."
          error={!!errors.property_city}
          {...register("property_city")}
        />
        {errors.property_city && (
          <p className="text-xs text-destructive">{errors.property_city.message}</p>
        )}
      </div>

      {/* Consent */}
      <div className="flex items-start gap-3 pt-1">
        <input
          id="consent"
          type="checkbox"
          className="mt-0.5 w-4 h-4 rounded border-border accent-accent cursor-pointer"
          {...register("consent")}
        />
        <label htmlFor="consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
          He leído y acepto la{" "}
          <a href="/privacidad" className="text-primary underline hover:text-primary-hover">
            política de privacidad
          </a>{" "}
          y el tratamiento de mis datos para recibir información sobre la valoración de mi propiedad.
        </label>
      </div>
      {errors.consent && (
        <p className="text-xs text-destructive -mt-2">{errors.consent.message}</p>
      )}

      {serverError && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-xs text-destructive">{serverError}</p>
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        loading={isSubmitting}
        disabled={!consentChecked}
      >
        {isSubmitting ? "Enviando..." : "Solicitar valoración gratuita"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Sin compromiso · Respuesta en menos de 24h
      </p>
    </form>
  );
}
