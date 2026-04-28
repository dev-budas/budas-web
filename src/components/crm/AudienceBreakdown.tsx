"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Loader2 } from "lucide-react";
import type { AudienceRow } from "@/lib/meta-ads";

const TABS = [
  { key: "age", label: "Edad" },
  { key: "gender", label: "Género" },
  { key: "region", label: "Región" },
  { key: "device_platform", label: "Dispositivo" },
] as const;

type BreakdownKey = (typeof TABS)[number]["key"];

const fmtEur = (n: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

interface Props {
  datePreset: string;
}

export default function AudienceBreakdown({ datePreset }: Props) {
  const [activeTab, setActiveTab] = useState<BreakdownKey>("age");
  const [cache, setCache] = useState<Partial<Record<BreakdownKey, AudienceRow[]>>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cache[activeTab]) return;
    setLoading(true);
    fetch(`/api/meta-ads/audience?breakdown=${activeTab}&preset=${datePreset}`)
      .then((r) => r.json())
      .then((data) => {
        setCache((prev) => ({ ...prev, [activeTab]: Array.isArray(data) ? data : [] }));
      })
      .catch(() => {
        setCache((prev) => ({ ...prev, [activeTab]: [] }));
      })
      .finally(() => setLoading(false));
  }, [activeTab, datePreset]);

  const rows = cache[activeTab] ?? [];

  return (
    <div className="bg-surface border border-border/60 rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="text-sm font-semibold text-foreground">Audiencia</h2>
        <div className="flex gap-1.5">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                activeTab === key
                  ? "bg-primary text-white border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando...
        </div>
      ) : rows.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
          Sin datos para este desglose.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar chart: Gasto */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Gasto
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={rows}
                layout="vertical"
                margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E3DE" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `${v}€`}
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  formatter={(v) => [typeof v === "number" ? fmtEur(v) : String(v), "Gasto"]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #E5E3DE",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="spend" fill="#1B3A5C" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bar chart: Leads */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Leads
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={rows}
                layout="vertical"
                margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E3DE" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  formatter={(v) => [String(v), "Leads"]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #E5E3DE",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="leads" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
