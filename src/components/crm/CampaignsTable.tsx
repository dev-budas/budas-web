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
  Image as ImageIcon,
  Calendar,
} from "lucide-react";
import type { Campaign, AdSet, Ad, CampaignStatus } from "@/lib/meta-ads";
import {
  updateCampaignStatus,
  updateCampaignBudget,
  updateCampaignName,
  updateCampaignDates,
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

const fmtN = (n: number) => (n > 0 ? new Intl.NumberFormat("es-ES").format(n) : "—");

function StatusDot({ status }: { status: string }) {
  if (status === "ACTIVE")
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Activa
      </span>
    );
  if (status === "IN_DRAFT" || status === "DRAFT")
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-600">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        Borrador
      </span>
    );
  if (status === "ARCHIVED")
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/60">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        Archivada
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      Pausada
    </span>
  );
}

/* ─── Edit modal ─────────────────────────────────────────────────────────── */

interface EditModalProps {
  campaign: Campaign;
  onClose: () => void;
}

function CampaignEditModal({ campaign, onClose }: EditModalProps) {
  const [name, setName] = useState(campaign.name);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        const promises: Promise<void>[] = [];
        if (name.trim() && name !== campaign.name) {
          promises.push(updateCampaignName(campaign.id, name.trim()));
        }
        if (startDate || endDate) {
          promises.push(
            updateCampaignDates(
              campaign.id,
              startDate ? new Date(startDate).toISOString() : undefined,
              endDate ? new Date(endDate).toISOString() : undefined
            )
          );
        }
        await Promise.all(promises);
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al guardar");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => !pending && onClose()} />
      <div className="relative bg-background rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Editar campaña</h2>
          <button
            onClick={() => !pending && onClose()}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Nombre
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Fecha inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Fecha fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              onClick={() => !pending && onClose()}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={pending}
              className="bg-primary text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {pending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main table ─────────────────────────────────────────────────────────── */

interface Props {
  campaigns: Campaign[];
  datePreset: string;
}

export default function CampaignsTable({ campaigns, datePreset }: Props) {
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [expandedAdSets, setExpandedAdSets] = useState<Set<string>>(new Set());
  const [adSetsMap, setAdSetsMap] = useState<Record<string, AdSet[]>>({});
  const [adsMap, setAdsMap] = useState<Record<string, Ad[]>>({});
  const [loadingAdSets, setLoadingAdSets] = useState<Set<string>>(new Set());
  const [loadingAds, setLoadingAds] = useState<Set<string>>(new Set());
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState("");
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [pendingToggle, setPendingToggle] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  const [toastError, setToastError] = useState<string | null>(null);

  async function toggleCampaign(campaignId: string) {
    const next = new Set(expandedCampaigns);
    if (next.has(campaignId)) { next.delete(campaignId); setExpandedCampaigns(next); return; }
    next.add(campaignId);
    setExpandedCampaigns(next);
    if (!adSetsMap[campaignId]) {
      setLoadingAdSets((p) => new Set([...p, campaignId]));
      try {
        const res = await fetch(`/api/meta-ads/adsets?campaignId=${campaignId}&preset=${datePreset}`);
        const data = await res.json();
        setAdSetsMap((p) => ({ ...p, [campaignId]: Array.isArray(data) ? data : [] }));
      } catch { setAdSetsMap((p) => ({ ...p, [campaignId]: [] })); }
      finally { setLoadingAdSets((p) => { const s = new Set(p); s.delete(campaignId); return s; }); }
    }
  }

  async function toggleAdSet(adsetId: string) {
    const next = new Set(expandedAdSets);
    if (next.has(adsetId)) { next.delete(adsetId); setExpandedAdSets(next); return; }
    next.add(adsetId);
    setExpandedAdSets(next);
    if (!adsMap[adsetId]) {
      setLoadingAds((p) => new Set([...p, adsetId]));
      try {
        const res = await fetch(`/api/meta-ads/ads?adsetId=${adsetId}&preset=${datePreset}`);
        const data = await res.json();
        setAdsMap((p) => ({ ...p, [adsetId]: Array.isArray(data) ? data : [] }));
      } catch { setAdsMap((p) => ({ ...p, [adsetId]: [] })); }
      finally { setLoadingAds((p) => { const s = new Set(p); s.delete(adsetId); return s; }); }
    }
  }

  function toggleStatus(campaign: Campaign) {
    const newStatus = campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setPendingToggle((p) => new Set([...p, campaign.id]));
    startTransition(async () => {
      try { await updateCampaignStatus(campaign.id, newStatus); }
      catch (e) { showError(e); }
      finally { setPendingToggle((p) => { const s = new Set(p); s.delete(campaign.id); return s; }); }
    });
  }

  function saveBudget(campaignId: string) {
    const val = parseFloat(budgetInput);
    if (!val || val <= 0) return;
    startTransition(async () => {
      try { await updateCampaignBudget(campaignId, val); setEditingBudget(null); }
      catch (e) { showError(e); }
    });
  }

  function showError(e: unknown) {
    setToastError(e instanceof Error ? e.message : "Error");
    setTimeout(() => setToastError(null), 4000);
  }

  const COLS = 12;

  if (campaigns.length === 0) {
    return (
      <div className="bg-surface border border-border/60 rounded-2xl shadow-sm px-6 py-16 text-center">
        <Megaphone className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No hay campañas activas o pausadas en este período.</p>
      </div>
    );
  }

  return (
    <>
      {toastError && (
        <div className="fixed bottom-6 right-6 z-50 bg-red-600 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg max-w-sm">
          {toastError}
        </div>
      )}

      {editingCampaign && (
        <CampaignEditModal campaign={editingCampaign} onClose={() => setEditingCampaign(null)} />
      )}

      <div className="bg-surface border border-border/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-border/20">
                <th className="w-10 px-3 py-3" />
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Campaña</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Objetivo</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gasto</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Impresiones</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Clics</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leads</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">CPL</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">CTR</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Presup./día</th>
                <th className="w-20 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {campaigns.map((campaign) => (
                <>
                  {/* ── Campaign row ── */}
                  <tr
                    key={campaign.id}
                    className={`transition-colors ${expandedCampaigns.has(campaign.id) ? "bg-primary/[0.03]" : "hover:bg-border/10"}`}
                  >
                    <td className="px-3 py-4 text-center">
                      <button onClick={() => toggleCampaign(campaign.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                        {loadingAdSets.has(campaign.id) ? <Loader2 className="w-4 h-4 animate-spin" /> :
                          expandedCampaigns.has(campaign.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-4 max-w-[200px]">
                      <p className="font-medium text-foreground leading-tight truncate">{campaign.name}</p>
                      <StatusDot status={campaign.status} />
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">{OBJECTIVE_LABELS[campaign.objective] ?? campaign.objective}</span>
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-foreground">{fmtEur(campaign.insights.spend)}</td>
                    <td className="px-4 py-4 text-right text-muted-foreground hidden lg:table-cell">{fmtN(campaign.insights.impressions)}</td>
                    <td className="px-4 py-4 text-right text-muted-foreground hidden lg:table-cell">{fmtN(campaign.insights.clicks)}</td>
                    <td className="px-4 py-4 text-right">
                      <span className={`font-semibold ${campaign.insights.leads > 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
                        {campaign.insights.leads > 0 ? campaign.insights.leads : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-muted-foreground hidden md:table-cell">{fmtEur(campaign.insights.cpl)}</td>
                    <td className="px-4 py-4 text-right text-muted-foreground hidden xl:table-cell">
                      {campaign.insights.ctr > 0 ? `${campaign.insights.ctr.toFixed(2)}%` : "—"}
                    </td>
                    {/* Budget */}
                    <td className="px-4 py-4 text-right hidden sm:table-cell">
                      {editingBudget === campaign.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xs text-muted-foreground">€</span>
                          <input type="number" value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)}
                            className="w-20 h-7 px-2 text-sm text-right rounded border border-accent focus:outline-none focus:ring-1 focus:ring-accent bg-background"
                            autoFocus
                            onKeyDown={(e) => { if (e.key === "Enter") saveBudget(campaign.id); if (e.key === "Escape") setEditingBudget(null); }} />
                          <button onClick={() => saveBudget(campaign.id)} className="text-emerald-600 hover:text-emerald-700"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingBudget(null)} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5 group">
                          <span className="text-muted-foreground text-xs">
                            {campaign.daily_budget ? fmtEur(campaign.daily_budget) : campaign.lifetime_budget ? `${fmtEur(campaign.lifetime_budget)} total` : "—"}
                          </span>
                          {campaign.daily_budget && (
                            <button onClick={() => { setEditingBudget(campaign.id); setBudgetInput(String(campaign.daily_budget)); }}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all" title="Editar presupuesto">
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    {/* Actions: edit + pause/play */}
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEditingCampaign(campaign)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-border/50 transition-colors" title="Editar campaña">
                          <Calendar className="w-4 h-4" />
                        </button>
                        <button onClick={() => toggleStatus(campaign)} disabled={pendingToggle.has(campaign.id)}
                          className={`p-1.5 rounded-lg transition-colors ${pendingToggle.has(campaign.id) ? "opacity-40 cursor-not-allowed" :
                            campaign.status === "ACTIVE" ? "text-amber-500 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"}`}
                          title={campaign.status === "ACTIVE" ? "Pausar campaña" : "Activar campaña"}>
                          {pendingToggle.has(campaign.id) ? <Loader2 className="w-4 h-4 animate-spin" /> :
                            campaign.status === "ACTIVE" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* ── Ad set rows ── */}
                  {expandedCampaigns.has(campaign.id) && (
                    <tr key={`${campaign.id}-adsets`} className="bg-primary/[0.02]">
                      <td colSpan={COLS} className="p-0">
                        {loadingAdSets.has(campaign.id) ? (
                          <div className="flex items-center gap-2 px-12 py-3 text-xs text-muted-foreground">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />Cargando conjuntos...
                          </div>
                        ) : !adSetsMap[campaign.id]?.length ? (
                          <p className="px-12 py-3 text-xs text-muted-foreground">Sin conjuntos de anuncios.</p>
                        ) : (
                          <table className="w-full text-xs border-t border-border/50">
                            <tbody className="divide-y divide-border/30">
                              {adSetsMap[campaign.id].map((adSet) => (
                                <>
                                  <tr key={adSet.id} className="hover:bg-primary/[0.04] transition-colors">
                                    <td className="w-10 px-3 py-2.5 text-center">
                                      <button onClick={() => toggleAdSet(adSet.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                                        {loadingAds.has(adSet.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                                          expandedAdSets.has(adSet.id) ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                      </button>
                                    </td>
                                    <td className="px-4 py-2.5 pl-10 max-w-[200px]">
                                      <p className="font-medium text-foreground/80 truncate">{adSet.name}</p>
                                      <StatusDot status={adSet.status} />
                                    </td>
                                    <td className="px-4 py-2.5 hidden md:table-cell text-muted-foreground/60">Conjunto</td>
                                    <td className="px-4 py-2.5 text-right text-muted-foreground">{fmtEur(adSet.insights.spend)}</td>
                                    <td className="px-4 py-2.5 text-right text-muted-foreground hidden lg:table-cell">{fmtN(adSet.insights.impressions)}</td>
                                    <td className="px-4 py-2.5 text-right text-muted-foreground hidden lg:table-cell">{fmtN(adSet.insights.clicks)}</td>
                                    <td className="px-4 py-2.5 text-right">
                                      <span className={`font-medium ${adSet.insights.leads > 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
                                        {adSet.insights.leads > 0 ? adSet.insights.leads : "—"}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right text-muted-foreground hidden md:table-cell">{fmtEur(adSet.insights.cpl)}</td>
                                    <td className="px-4 py-2.5 text-right text-muted-foreground hidden xl:table-cell">
                                      {adSet.insights.ctr > 0 ? `${adSet.insights.ctr.toFixed(2)}%` : "—"}
                                    </td>
                                    <td className="px-4 py-2.5 text-right text-muted-foreground hidden sm:table-cell">
                                      {adSet.daily_budget ? fmtEur(adSet.daily_budget) : adSet.lifetime_budget ? fmtEur(adSet.lifetime_budget) : "—"}
                                    </td>
                                    <td className="w-20 px-4 py-2.5" />
                                  </tr>

                                  {/* ── Ad rows ── */}
                                  {expandedAdSets.has(adSet.id) && (
                                    <tr key={`${adSet.id}-ads`} className="bg-primary/[0.04]">
                                      <td colSpan={COLS} className="p-0 border-t border-border/30">
                                        {loadingAds.has(adSet.id) ? (
                                          <div className="flex items-center gap-2 px-16 py-3 text-xs text-muted-foreground">
                                            <Loader2 className="w-3 h-3 animate-spin" />Cargando anuncios...
                                          </div>
                                        ) : !adsMap[adSet.id]?.length ? (
                                          <p className="px-16 py-3 text-xs text-muted-foreground">Sin anuncios.</p>
                                        ) : (
                                          <div className="divide-y divide-border/20">
                                            {adsMap[adSet.id].map((ad) => (
                                              <div key={ad.id} className="flex items-center gap-4 px-16 py-3 hover:bg-primary/[0.03] transition-colors">
                                                {/* Thumbnail */}
                                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-border/30 flex-shrink-0 flex items-center justify-center">
                                                  {ad.thumbnail_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={ad.thumbnail_url} alt={ad.name} className="w-full h-full object-cover" />
                                                  ) : (
                                                    <ImageIcon className="w-5 h-5 text-muted-foreground/40" />
                                                  )}
                                                </div>
                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-xs font-medium text-foreground/80 truncate">{ad.name}</p>
                                                  {ad.headline && (
                                                    <p className="text-[11px] text-muted-foreground truncate">{ad.headline}</p>
                                                  )}
                                                  {ad.body && (
                                                    <p className="text-[11px] text-muted-foreground/70 truncate">{ad.body}</p>
                                                  )}
                                                  <StatusDot status={ad.status} />
                                                </div>
                                                {/* Mini metrics */}
                                                <div className="hidden sm:flex items-center gap-4 text-[11px] text-muted-foreground flex-shrink-0">
                                                  <span><span className="font-medium text-foreground">{fmtEur(ad.insights.spend)}</span><br />gasto</span>
                                                  <span><span className={`font-medium ${ad.insights.leads > 0 ? "text-emerald-600" : "text-foreground"}`}>
                                                    {ad.insights.leads > 0 ? ad.insights.leads : "—"}</span><br />leads</span>
                                                  <span><span className="font-medium text-foreground">{fmtN(ad.insights.clicks)}</span><br />clics</span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  )}
                                </>
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
