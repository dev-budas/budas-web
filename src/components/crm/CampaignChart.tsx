"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { DailyInsight } from "@/lib/meta-ads";

const fmtDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });

const fmtEur = (n: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

interface Props {
  data: DailyInsight[];
}

export default function CampaignChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-52 text-sm text-muted-foreground">
        Sin datos para el período seleccionado.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1B3A5C" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#1B3A5C" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E3DE" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={fmtDate}
          tick={{ fontSize: 11, fill: "#9CA3AF" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          yAxisId="spend"
          orientation="left"
          tickFormatter={(v) => `${v}€`}
          tick={{ fontSize: 11, fill: "#9CA3AF" }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <YAxis
          yAxisId="leads"
          orientation="right"
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#9CA3AF" }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "10px",
            border: "1px solid #E5E3DE",
            fontSize: "12px",
            backgroundColor: "#FFFFFF",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
          formatter={(value, name) => [
            name === "spend" ? fmtEur(Number(value)) : value,
            name === "spend" ? "Gasto" : "Leads",
          ]}
          labelFormatter={(label) => fmtDate(String(label))}
        />
        <Legend
          formatter={(value) => (value === "spend" ? "Gasto" : "Leads")}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
        />
        <Area
          yAxisId="spend"
          type="monotone"
          dataKey="spend"
          stroke="#1B3A5C"
          strokeWidth={2}
          fill="url(#spendGrad)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
        <Area
          yAxisId="leads"
          type="monotone"
          dataKey="leads"
          stroke="#10B981"
          strokeWidth={2}
          fill="url(#leadsGrad)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
