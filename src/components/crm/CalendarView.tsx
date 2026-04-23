"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Visit } from "@/types";

const VISIT_STATUS = {
  pending:   { label: "Pendiente", color: "#F59E0B" },
  confirmed: { label: "Confirmada", color: "#3B82F6" },
  completed: { label: "Completada", color: "#10B981" },
  cancelled: { label: "Cancelada", color: "#9CA3AF" },
};

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

interface EnrichedVisit extends Visit {
  leadName: string;
  agentName?: string;
}

export function CalendarView({
  visits,
}: {
  visits: EnrichedVisit[];
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  function prev() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
    setSelectedDay(null);
  }

  function next() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
    setSelectedDay(null);
  }

  const firstDay = new Date(year, month, 1).getDay();
  // Convert Sunday=0 to Monday=0
  const startOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Group visits by day
  const visitsByDay: Record<number, EnrichedVisit[]> = {};
  visits.forEach((v) => {
    const d = new Date(v.scheduled_at);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!visitsByDay[day]) visitsByDay[day] = [];
      visitsByDay[day].push(v);
    }
  });

  const selectedVisits = selectedDay ? (visitsByDay[selectedDay] ?? []) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

      {/* Calendar grid */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">

        {/* Month nav */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <button onClick={prev} className="p-1.5 rounded-lg hover:bg-border/50 transition-colors">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <h2 className="text-sm font-semibold text-foreground">
            {MONTHS[month]} {year}
          </h2>
          <button onClick={next} className="p-1.5 rounded-lg hover:bg-border/50 transition-colors">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              {w}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {/* Empty cells before first day */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="h-20 border-b border-r border-border/40" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayVisits = visitsByDay[day] ?? [];
            const isToday =
              day === today.getDate() &&
              month === today.getMonth() &&
              year === today.getFullYear();
            const isSelected = day === selectedDay;
            const col = (startOffset + i) % 7;
            const isLastCol = col === 6;

            return (
              <div
                key={day}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "h-20 p-1.5 border-b border-border/40 cursor-pointer transition-colors",
                  !isLastCol && "border-r",
                  isSelected ? "bg-primary/5" : "hover:bg-border/20"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mb-1 ml-auto",
                  isToday ? "bg-primary text-white" : isSelected ? "bg-primary/10 text-primary" : "text-foreground"
                )}>
                  {day}
                </div>

                <div className="space-y-0.5 overflow-hidden">
                  {dayVisits.slice(0, 2).map((v) => {
                    const st = VISIT_STATUS[v.status as keyof typeof VISIT_STATUS] ?? VISIT_STATUS.pending;
                    return (
                      <div
                        key={v.id}
                        className="text-[10px] px-1.5 py-0.5 rounded font-medium truncate"
                        style={{ backgroundColor: `${st.color}20`, color: st.color }}
                      >
                        {new Date(v.scheduled_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} {v.leadName}
                      </div>
                    );
                  })}
                  {dayVisits.length > 2 && (
                    <div className="text-[10px] text-muted-foreground px-1.5">
                      +{dayVisits.length - 2} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day detail panel */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden h-fit sticky top-6">
        <div className="px-4 py-3.5 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">
            {selectedDay
              ? `${selectedDay} de ${MONTHS[month]}`
              : "Selecciona un día"}
          </h3>
          {selectedVisits.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectedVisits.length} visita{selectedVisits.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <div className="p-4">
          {selectedVisits.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {selectedDay ? "Sin visitas este día" : "Selecciona un día para ver las visitas"}
            </p>
          ) : (
            <div className="space-y-3">
              {selectedVisits.map((v) => {
                const st = VISIT_STATUS[v.status as keyof typeof VISIT_STATUS] ?? VISIT_STATUS.pending;
                return (
                  <a
                    key={v.id}
                    href={`/crm/leads/${v.lead_id}`}
                    className="block p-3.5 rounded-xl border border-border hover:border-primary/30 hover:bg-border/10 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-foreground">
                        {new Date(v.scheduled_at).toLocaleTimeString("es-ES", {
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${st.color}18`, color: st.color }}
                      >
                        {st.label}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-foreground mb-1">{v.leadName}</p>

                    {v.address && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{v.address}</span>
                      </div>
                    )}

                    {v.agentName && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="w-3 h-3 flex-shrink-0" />
                        {v.agentName}
                      </div>
                    )}

                    {v.notes && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">{v.notes}</p>
                    )}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
