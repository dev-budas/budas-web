"use client";

import { useState, useTransition } from "react";
import {
  ChevronRight,
  ChevronDown,
  Pause,
  Play,
  Pencil,
  Check,
  X,
  Loader2,
  Megaphone,
} from "lucide-react";
import type { Campaign, AdSet, CampaignStatus } from "@/lib/meta-ads";
import {
  updateCampaignStatus,
  updateCampaignBudget,
} from "@/app/(admin)/crm/meta-ads-actions";

const OBJECTIVE_LABELS: Record<string, string> = {
  LEAD_GENERATION: "Leads",
  OUTCOME_LEADS: "Leads",
  CONVERSIONS: "Conversiones",
  OUTCOME_TRAFFIC: "Tráfico",
  LINK_CLICKS: "Clics",
  REACH: "Alcance",
  BRAND_AWARENESS: "Reconocimiento",
  OUTCOME_AWARENESS: "Reconocimiento",
  VIDEO_VIEWS: "Vídeo",
  MESSAGES: "Mensajes",
  OUTCOME_SALES: "Ventas",
  OUTCOME_ENGAGEMENT: "Interacción",
  OUTCOME_APP_PROMOTION: "App",
};

const fmtEur = (n: number) =>
  n > 0
    ? new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 2,
      }).format(n)
    : "—";

const fmtN = (n: number) =>
  n > 0 ? new Intl.NumberFormat("es-ES").format(n) : "—";

function StatusDot({ status }: { status: string }) {
  if (status === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Activa
      </span>
    );
  }
  if (status === "IN_DRAFT" || status === "DRAFT") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-600">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        Borrador
      </span>
    );
  }
  if (status === "ARCHIVED") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/60">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        Archivada
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      Pausada
    </span>
  );
}

interface Props {
  campaigns: Campaign[];
  datePreset: string;
}

export default function CampaignsTable({ campaigns, datePreset }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [adSetsMap, setAdSetsMap] = useState<Record<string, AdSet[]>>({});
  const [loadingAdSets, setLoadingAdSets] = useState<Set<string>>(new Set());
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState("");
  const [pendingToggle, setPendingToggle] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  const [toastError, setToastError] = useState<string | null>(null);

  async function toggleExpand(campaignId: string) {
    const next = new Set(expanded);
    if (next.has(campaignId)) {
      next.delete(campaignId);
      setExpanded(next);
      return;
    }
    next.add(campaignId);
    setExpanded(next);

    if (!adSetsMap[campaignId]) {
      setLoadingAdSets((prev) => new Set([...prev, campaignId]));
      try {
        const res = await fetch(
          `/api/meta-ads/adsets?campaignId=${campaignId}&preset=${datePreset}`
        );
        const data = await res.json();
        setAdSetsMap((prev) => ({ ...prev, [campaignId]: Array.isArray(data) ? data : [] }));
      } catch {
        setAdSetsMap((prev) => ({ ...prev, [campaignId]: [] }));
      } finally {
        setLoadingAdSets((prev) => {
          const s = new Set(prev);
          s.delete(campaignId);
          return s;
        });
      }
    }
  }

  function toggleStatus(campaign: Campaign) {
    const newStatus = campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setPendingToggle((prev) => new Set([...prev, campaign.id]));
    startTransition(async () => {
      try {
        await updateCampaignStatus(campaign.id, newStatus);
      } catch (e) {
        setToastError(e instanceof Error ? e.message : "Error al actualizar");
        setTimeout(() => setToastError(null), 4000);
      } finally {
        setPendingToggle((prev) => {
          const s = new Set(prev);
          s.delete(campaign.id);
          return s;
        });
      }
    });
  }

  function startEditBudget(campaign: Campaign) {
    setEditingBudget(campaign.id);
    setBudgetInput(String(campaign.daily_budget ?? ""));
  }

  function saveBudget(campaignId: string) {
    const val = parseFloat(budgetInput);
    if (!val || val <= 0) return;
    startTransition(async () => {
      try {
        await updateCampaignBudget(campaignId, val);
        setEditingBudget(null);
      } catch (e) {
        setToastError(e instanceof Error ? e.message : "Error al actualizar presupuesto");
        setTimeout(() => setToastError(null), 4000);
      }
    });
  }

  if (campaigns.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl px-6 py-16 text-center">
        <Megaphone className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          No hay campañas activas o pausadas en este período.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Toast error */}
      {toastError && (
        <div className="fixed bottom-6 right-6 z-50 bg-red-600 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg max-w-sm">
          {toastError}
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-border/20">
                <th className="w-10 px-3 py-3" />
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Campaña
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                  Objetivo
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Gasto
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                  Impresiones
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                  Clics
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Leads
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                  CPL
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">
                  CTR
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                  Presup./día
                </th>
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {campaigns.map((campaign) => (
                <>
                  <tr
                    key={campaign.id}
                    className={`transition-colors ${
                      expanded.has(campaign.id)
                        ? "bg-primary/[0.03]"
                        : "hover:bg-border/10"
                    }`}
                  >
                    {/* Expand toggle */}
                    <td className="px-3 py-4 text-center">
                      <button
                        onClick={() => toggleExpand(campaign.id)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {loadingAdSets.has(campaign.id) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : expanded.has(campaign.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Name + status */}
                    <td className="px-4 py-4 max-w-[200px]">
                      <p className="font-medium text-foreground leading-tight truncate">
                        {campaign.name}
                      </p>
                      <StatusDot status={campaign.status} />
                    </td>

                    {/* Objective */}
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {OBJECTIVE_LABELS[campaign.objective] ?? campaign.objective}
                      </span>
                    </td>

                    {/* Spend */}
                    <td className="px-4 py-4 text-right font-medium text-foreground">
                      {fmtEur(campaign.insights.spend)}
                    </td>

                    {/* Impressions */}
                    <td className="px-4 py-4 text-right text-muted-foreground hidden lg:table-cell">
                      {fmtN(campaign.insights.impressions)}
                    </td>

                    {/* Clicks */}
                    <td className="px-4 py-4 text-right text-muted-foreground hidden lg:table-cell">
                      {fmtN(campaign.insights.clicks)}
                    </td>

                    {/* Leads */}
                    <td className="px-4 py-4 text-right">
                      <span
                        className={`font-semibold ${
                          campaign.insights.leads > 0
                            ? "text-emerald-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        {campaign.insights.leads > 0 ? campaign.insights.leads : "—"}
                      </span>
                    </td>

                    {/* CPL */}
                    <td className="px-4 py-4 text-right text-muted-foreground hidden md:table-cell">
                      {fmtEur(campaign.insights.cpl)}
                    </td>

                    {/* CTR */}
                    <td className="px-4 py-4 text-right text-muted-foreground hidden xl:table-cell">
                      {campaign.insights.ctr > 0
                        ? `${campaign.insights.ctr.toFixed(2)}%`
                        : "—"}
                    </td>

                    {/* Budget (editable) */}
                    <td className="px-4 py-4 text-right hidden sm:table-cell">
                      {editingBudget === campaign.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xs text-muted-foreground">€</span>
                          <input
                            type="number"
                            value={budgetInput}
                            onChange={(e) => setBudgetInput(e.target.value)}
                            className="w-20 h-7 px-2 text-sm text-right rounded border border-accent focus:outline-none focus:ring-1 focus:ring-accent bg-background"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveBudget(campaign.id);
                              if (e.key === "Escape") setEditingBudget(null);
                            }}
                          />
                          <button
                            onClick={() => saveBudget(campaign.id)}
                            className="text-emerald-600 hover:text-emerald-700 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingBudget(null)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5 group">
                          <span className="text-muted-foreground text-xs">
                            {campaign.daily_budget
                              ? fmtEur(campaign.daily_budget)
                              : campaign.lifetime_budget
                              ? `${fmtEur(campaign.lifetime_budget)} total`
                              : "—"}
                          </span>
                          {campaign.daily_budget && (
                            <button
                              onClick={() => startEditBudget(campaign)}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all"
                              title="Editar presupuesto"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Pause / play toggle */}
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => toggleStatus(campaign)}
                        disabled={pendingToggle.has(campaign.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          pendingToggle.has(campaign.id)
                            ? "opacity-40 cursor-not-allowed"
                            : campaign.status === "ACTIVE"
                            ? "text-amber-500 hover:bg-amber-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                        title={
                          campaign.status === "ACTIVE"
                            ? "Pausar campaña"
                            : "Activar campaña"
                        }
                      >
                        {pendingToggle.has(campaign.id) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : campaign.status === "ACTIVE" ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* Ad sets expanded rows */}
                  {expanded.has(campaign.id) && (
                    <tr key={`${campaign.id}-adsets`} className="bg-primary/[0.02]">
                      <td colSpan={11} className="p-0">
                        {loadingAdSets.has(campaign.id) ? (
                          <div className="flex items-center gap-2 px-12 py-3 text-xs text-muted-foreground">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Cargando conjuntos...
                          </div>
                        ) : !adSetsMap[campaign.id]?.length ? (
                          <p className="px-12 py-3 text-xs text-muted-foreground">
                            Sin conjuntos de anuncios.
                          </p>
                        ) : (
                          <table className="w-full text-xs border-t border-border/50">
                            <tbody className="divide-y divide-border/30">
                              {adSetsMap[campaign.id].map((adSet) => (
                                <tr
                                  key={adSet.id}
                                  className="hover:bg-primary/[0.04] transition-colors"
                                >
                                  <td className="w-10 px-3 py-2.5" />
                                  <td className="px-4 py-2.5 pl-10 max-w-[200px]">
                                    <p className="font-medium text-foreground/80 truncate">
                                      {adSet.name}
                                    </p>
                                    <StatusDot status={adSet.status} />
                                  </td>
                                  <td className="px-4 py-2.5 hidden md:table-cell text-muted-foreground/60">
                                    Conjunto
                                  </td>
                                  <td className="px-4 py-2.5 text-right text-muted-foreground">
                                    {fmtEur(adSet.insights.spend)}
                                  </td>
                                  <td className="px-4 py-2.5 text-right text-muted-foreground hidden lg:table-cell">
                                    {fmtN(adSet.insights.impressions)}
                                  </td>
                                  <td className="px-4 py-2.5 text-right text-muted-foreground hidden lg:table-cell">
                                    {fmtN(adSet.insights.clicks)}
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    <span
                                      className={`font-medium ${
                                        adSet.insights.leads > 0
                                          ? "text-emerald-600"
                                          : "text-muted-foreground"
                                      }`}
                                    >
                                      {adSet.insights.leads > 0
                                        ? adSet.insights.leads
                                        : "—"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-right text-muted-foreground hidden md:table-cell">
                                    {fmtEur(adSet.insights.cpl)}
                                  </td>
                                  <td className="px-4 py-2.5 text-right text-muted-foreground hidden xl:table-cell">
                                    {adSet.insights.ctr > 0
                                      ? `${adSet.insights.ctr.toFixed(2)}%`
                                      : "—"}
                                  </td>
                                  <td className="px-4 py-2.5 text-right text-muted-foreground hidden sm:table-cell">
                                    {adSet.daily_budget
                                      ? fmtEur(adSet.daily_budget)
                                      : adSet.lifetime_budget
                                      ? fmtEur(adSet.lifetime_budget)
                                      : "—"}
                                  </td>
                                  <td className="w-12 px-4 py-2.5" />
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
