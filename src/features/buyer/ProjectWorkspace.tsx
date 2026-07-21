// ══════════════════════════════════════════════
// GLAZEO — Project Workspace v2.0 (Gate 2)
// Interactive mock state: Configuration → Quote → Accept → Order
// ══════════════════════════════════════════════
import { useState, useReducer } from "react";
import { Section, Button, StatusBadge, EmptyState } from "../../primitives";
import { Card } from "../../primitives";
import type { StatusKey } from "../../foundation/tokens";

// ── Types ───────────────────────────────────────────
type ConfigItem = {
  id: string; name: string; version: number;
  status: "draft" | "quoted" | "ordered" | "archived";
  lastEdited: string; productType: string;
};

type QuoteItem = {
  id: string; number: string; configId: string; configVersion: number;
  total: number; currency: "EUR" | "RON";
  status: "draft" | "sent" | "accepted" | "rejected" | "expired";
  validUntil: string; createdAt: string;
};

type OrderItem = {
  id: string; number: string; quoteId: string;
  productName: string; status: StatusKey;
  estimatedDelivery: string; createdAt: string;
};

type ActivityEvent = {
  id: string; date: string; text: string; type: "config" | "quote" | "order" | "project";
};

type ProjectState = {
  id: string; name: string; productType: string;
  status: StatusKey; progress: number;
  address: string; participants: string[];
  configurations: ConfigItem[];
  quotes: QuoteItem[];
  orders: OrderItem[];
  activity: ActivityEvent[];
};

// ── Actions ─────────────────────────────────────────
type Action =
  | { type: "REQUEST_QUOTE"; configId: string }
  | { type: "ACCEPT_QUOTE"; quoteId: string }
  | { type: "REJECT_QUOTE"; quoteId: string }
  | { type: "DUPLICATE_CONFIG"; configId: string };

let eventId = 10;
function event(type: ActivityEvent["type"], text: string): ActivityEvent {
  return { id: `e${eventId++}`, date: new Date().toLocaleDateString("ro-RO", { day: "numeric", month: "short" }), text, type };
}

function reducer(state: ProjectState, action: Action): ProjectState {
  switch (action.type) {
    case "REQUEST_QUOTE": {
      const cfg = state.configurations.find(c => c.id === action.configId);
      if (!cfg || cfg.status !== "draft") return state;
      const quoteNum = `OF-2026-${String(40 + state.quotes.length + 1).padStart(4, "0")}`;
      const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const newQuote: QuoteItem = {
        id: `q${state.quotes.length + 1}`, number: quoteNum,
        configId: cfg.id, configVersion: cfg.version,
        total: cfg.productType.includes("Balustrad") ? 2847 : 5200,
        currency: "EUR", status: "sent", validUntil,
        createdAt: new Date().toISOString().split("T")[0],
      };
      return {
        ...state,
        configurations: state.configurations.map(c =>
          c.id === action.configId ? { ...c, status: "quoted" as const } : c
        ),
        quotes: [...state.quotes, newQuote],
        activity: [event("quote", `Ofertă ${newQuote.number} generată din ${cfg.name} v${cfg.version}`), ...state.activity],
        progress: Math.min(100, state.progress + 15),
      };
    }
    case "ACCEPT_QUOTE": {
      const q = state.quotes.find(q => q.id === action.quoteId);
      if (!q || q.status !== "sent") return state;
      const orderNum = `CMD-2026-${String(30 + state.orders.length + 1).padStart(4, "0")}`;
      const cfg = state.configurations.find(c => c.id === q.configId);
      const newOrder: OrderItem = {
        id: `o${state.orders.length + 1}`, number: orderNum, quoteId: q.id,
        productName: cfg?.name ?? "Comandă nouă",
        status: "pending", estimatedDelivery: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        createdAt: new Date().toISOString().split("T")[0],
      };
      return {
        ...state,
        quotes: state.quotes.map(qq => qq.id === action.quoteId ? { ...qq, status: "accepted" as const } : qq),
        configurations: state.configurations.map(c =>
          c.id === q.configId ? { ...c, status: "ordered" as const } : c
        ),
        orders: [...state.orders, newOrder],
        activity: [
          event("order", `Comandă ${newOrder.number} creată din oferta ${q.number}`),
          event("quote", `Ofertă ${q.number} acceptată`),
          ...state.activity,
        ],
        progress: Math.min(100, state.progress + 20),
        status: state.progress + 20 >= 100 ? "in_progress" : state.status,
      };
    }
    case "REJECT_QUOTE": {
      return {
        ...state,
        quotes: state.quotes.map(q => q.id === action.quoteId ? { ...q, status: "rejected" as const } : q),
        activity: [event("quote", `Ofertă ${state.quotes.find(q => q.id === action.quoteId)?.number} respinsă`), ...state.activity],
      };
    }
    case "DUPLICATE_CONFIG": {
      const cfg = state.configurations.find(c => c.id === action.configId);
      if (!cfg) return state;
      const newCfg: ConfigItem = {
        ...cfg, id: `c${state.configurations.length + 1}`,
        version: cfg.version + 1, status: "draft",
        lastEdited: "chiar acum",
        name: cfg.name.replace(/ v\d+$/, "") + ` v${cfg.version + 1}`,
      };
      return {
        ...state,
        configurations: [...state.configurations, newCfg],
        activity: [event("config", `Configurație nouă ${newCfg.name} creată (v${newCfg.version})`), ...state.activity],
      };
    }
    default:
      return state;
  }
}

// ── Initial State ───────────────────────────────────
function initialState(): ProjectState {
  return {
    id: "p1", name: "Vila Popescu", productType: "Balustrade + Cabine Duș",
    status: "active", progress: 65,
    address: "Str. Plopilor 42, Timișoara",
    participants: ["Cornel Lezeu (Buyer)", "Andreea Popescu (Arhitect)", "Ion Munteanu (Montor)"],
    configurations: [
      { id: "c1", name: "Balustradă terasă — 12.5m, inox lucios", version: 3, status: "draft", lastEdited: "acum 2 ore", productType: "Balustradă" },
      { id: "c2", name: "Cabină duș walk-in — 10mm clar", version: 1, status: "draft", lastEdited: "acum 1 zi", productType: "Cabină Duș" },
    ],
    quotes: [
      { id: "q1", number: "OF-2026-0042", configId: "c1", configVersion: 2, total: 2847, currency: "EUR", status: "sent", validUntil: "2026-07-23", createdAt: "2026-07-20" },
    ],
    orders: [],
    activity: [
      { id: "e1", date: "21 Iul", text: "Ofertă OF-2026-0042 trimisă", type: "quote" },
      { id: "e2", date: "20 Iul", text: "Configurație Balustradă terasă v2 salvată", type: "config" },
      { id: "e3", date: "18 Iul", text: "Configurație Cabină duș creată", type: "config" },
      { id: "e4", date: "15 Iul", text: "Proiect creat", type: "project" },
    ],
  };
}

// ── Component ───────────────────────────────────────
export default function ProjectWorkspace({ projectId, onBack }: { projectId: string; onBack: () => void }) {
  const [state, dispatch] = useReducer(reducer, null, initialState);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false); // simulat pentru acțiuni

  const tabs = ["Overview", "Configurări", "Oferte", "Comenzi"];

  const recommendedAction = (() => {
    const sentQuote = state.quotes.find(q => q.status === "sent");
    if (sentQuote) return { type: "quote" as const, text: `Revizuiește oferta ${sentQuote.number}`, action: () => setActiveTab(2) };
    const draftConfig = state.configurations.find(c => c.status === "draft");
    if (draftConfig) return { type: "config" as const, text: `Finalizează ${draftConfig.name}`, action: () => setActiveTab(1) };
    if (state.orders.length > 0 && state.orders.some(o => o.status === "pending")) return { type: "order" as const, text: "Urmărește comanda activă", action: () => setActiveTab(3) };
    return null;
  })();

  // ── Loading State ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="h-5 w-24 bg-neutral-200 rounded animate-pulse mb-4" />
          <div className="h-8 w-64 bg-neutral-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-48 bg-neutral-200 rounded animate-pulse mb-8" />
          <div className="h-10 w-full bg-neutral-200 rounded animate-pulse mb-6" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-xl border animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* ── Header ── */}
        <button onClick={onBack} className="text-sm text-neutral-500 hover:text-neutral-700 mb-4 transition-colors">← Workspace</button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">{state.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm text-neutral-500">{state.productType}</span>
              <StatusBadge status={state.status} />
              <span className="text-sm text-neutral-400">· {state.address}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xs text-neutral-400 mb-1">Progress</div>
            <div className="text-2xl font-bold text-[#1A56DB]">{state.progress}%</div>
          </div>
        </div>

        {/* ── Recommended Action ── */}
        {recommendedAction && (
          <div className="bg-[#FFF8E1] rounded-xl border-2 border-[#F59E0B]/40 p-4 mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-lg">⚡</span>
              <div>
                <p className="text-xs font-semibold text-[#B45309] uppercase tracking-wider">Recommended Action</p>
                <p className="text-sm font-medium text-[#92400E]">{recommendedAction.text}</p>
              </div>
            </div>
            <button onClick={recommendedAction.action}
              className="px-4 py-2 text-sm font-medium bg-[#F59E0B] text-[#7C2D12] rounded-lg hover:bg-[#D97706] hover:text-white transition-colors flex-shrink-0">
              Acționează →
            </button>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-6 border-b border-neutral-200">
          {tabs.map((tab, i) => (
            <button key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px
                ${i === activeTab ? "text-[#1A56DB] border-[#1A56DB]" : "text-neutral-500 border-transparent hover:text-neutral-700"}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* ── Tab: Overview ── */}
        {activeTab === 0 && (
          <div className="space-y-6">
            <Section title="Project Details">
              <Card icon="📋" title={state.name} subtitle={state.productType}>
                <div className="mt-2 space-y-1 text-sm text-neutral-600">
                  <p>📍 {state.address}</p>
                  <p>📅 Creat: 15 Iul 2026</p>
                </div>
              </Card>
            </Section>
            <Section title="Participants" badge={state.participants.length}>
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
                {state.participants.map((p, i) => (
                  <div key={i} className={`flex items-center gap-2 text-sm ${i > 0 ? "mt-2 pt-2 border-t border-neutral-100" : ""}`}>
                    <span className="w-7 h-7 rounded-full bg-[#EFF6FF] flex items-center justify-center text-xs font-medium text-[#1A56DB]">
                      {p[0]}
                    </span>
                    <span className="text-neutral-700">{p}</span>
                  </div>
                ))}
              </div>
            </Section>
            <Section title="Activity">
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
                {state.activity.slice(0, 10).map((a, i) => (
                  <div key={a.id} className={`flex gap-3 ${i > 0 ? "mt-2 pt-2 border-t border-neutral-100" : ""}`}>
                    <span className="text-xs text-neutral-400 w-12 flex-shrink-0">{a.date}</span>
                    <span className="text-sm text-neutral-700">{a.text}</span>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* ── Tab: Configurări ── */}
        {activeTab === 1 && (
          <Section title="Configurări" badge={state.configurations.length}>
            {state.configurations.length === 0 ? (
              <EmptyState icon="⚙️" message="Nicio configurație încă." actionLabel="Configurează un produs" onAction={() => {}} />
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {state.configurations.map(c => (
                  <Card key={c.id} icon="⚙️" title={c.name}
                    subtitle={`v${c.version} · Editat ${c.lastEdited}`}
                    status={c.status === "quoted" ? "sent" : c.status === "ordered" ? "accepted" : "draft"}
                    footer={
                      <div className="flex gap-1.5 flex-wrap">
                        {c.status === "draft" && (
                          <>
                            <button onClick={() => dispatch({ type: "REQUEST_QUOTE", configId: c.id })}
                              className="px-2.5 py-1.5 text-xs font-medium bg-[#1A56DB] text-white rounded-lg hover:bg-[#1E40AF] transition-colors">
                              Solicită ofertă
                            </button>
                            <button onClick={() => dispatch({ type: "DUPLICATE_CONFIG", configId: c.id })}
                              className="px-2.5 py-1.5 text-xs font-medium text-[#4B5563] bg-[#F3F4F6] rounded-lg hover:bg-[#E5E7EB] transition-colors">
                              Duplică
                            </button>
                          </>
                        )}
                        {(c.status === "quoted" || c.status === "ordered") && (
                          <span className="text-xs text-neutral-500 italic">Read-only — versiune ofertată</span>
                        )}
                      </div>
                    } />
                ))}
              </div>
            )}
          </Section>
        )}

        {/* ── Tab: Oferte ── */}
        {activeTab === 2 && (
          <Section title="Oferte" badge={state.quotes.length}>
            {state.quotes.length === 0 ? (
              <EmptyState icon="📄" message="Nicio ofertă încă." />
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {state.quotes.map(q => {
                  const cfg = state.configurations.find(c => c.id === q.configId);
                  const isExpiring = new Date(q.validUntil).getTime() - Date.now() < 2 * 24 * 60 * 60 * 1000;
                  return (
                    <Card key={q.id} icon="📄" title={q.number}
                      subtitle={`${q.total.toLocaleString("ro-RO")} ${q.currency === "EUR" ? "€" : "lei"} · din ${cfg?.name ?? "—"} v${q.configVersion}`}
                      status={q.status}
                      highlight={!!(isExpiring && q.status === "sent")}
                      footer={
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-500">
                            {q.status === "sent" ? `Expiră: ${new Date(q.validUntil).toLocaleDateString("ro-RO")}` :
                             q.status === "accepted" ? `Acceptată: ${new Date(q.createdAt).toLocaleDateString("ro-RO")}` :
                             q.status === "rejected" ? "Respinsă" : ""}
                          </span>
                          {q.status === "sent" && (
                            <div className="flex gap-1.5">
                              <button onClick={() => dispatch({ type: "REJECT_QUOTE", quoteId: q.id })}
                                className="px-2.5 py-1.5 text-xs font-medium text-[#991B1B] bg-[#FEF2F2] rounded-lg hover:bg-[#FEE2E2] transition-colors">
                                Refuză
                              </button>
                              <button onClick={() => dispatch({ type: "ACCEPT_QUOTE", quoteId: q.id })}
                                className="px-2.5 py-1.5 text-xs font-medium bg-[#1A56DB] text-white rounded-lg hover:bg-[#1E40AF] transition-colors">
                                Acceptă
                              </button>
                            </div>
                          )}
                        </div>
                      }>
                      {isExpiring && q.status === "sent" && (
                        <p className="text-xs text-[#B45309] mt-1">⚠️ Expiră în mai puțin de 2 zile</p>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </Section>
        )}

        {/* ── Tab: Comenzi ── */}
        {activeTab === 3 && (
          <Section title="Comenzi" badge={state.orders.length}>
            {state.orders.length === 0 ? (
              <EmptyState icon="📦" message="Nicio comandă încă. Acceptă o ofertă pentru a crea o comandă." />
            ) : (
              <div className="space-y-3">
                {state.orders.map(o => {
                  const steps = [
                    { key: "pending", label: "Confirmed" },
                    { key: "in_progress", label: "Production" },
                    { key: "shipped", label: "Shipping" },
                    { key: "delivered", label: "Delivered" },
                  ];
                  const idx = steps.findIndex(s => s.key === o.status);
                  return (
                    <Card key={o.id} icon="📦" title={o.productName}
                      subtitle={`${o.number} · Creată: ${new Date(o.createdAt).toLocaleDateString("ro-RO")}`}
                      status={o.status}>
                      <div className="mt-3">
                        <div className="flex gap-1 mb-2">
                          {steps.map((s, i) => (
                            <div key={s.key} className={`flex-1 h-2 rounded-full ${i <= idx ? "bg-[#1A56DB]" : "bg-neutral-200"}`} />
                          ))}
                        </div>
                        <div className="flex justify-between text-[10px]">
                          {steps.map((s, i) => (
                            <span key={s.key} className={i <= idx ? "text-[#1A56DB] font-medium" : "text-neutral-400"}>
                              {s.label}
                            </span>
                          ))}
                        </div>
                      </div>
                      {o.estimatedDelivery && (
                        <p className="text-xs text-neutral-500 mt-2">
                          🚚 Estimare livrare: {new Date(o.estimatedDelivery).toLocaleDateString("ro-RO")}
                        </p>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </Section>
        )}

        {/* ── Activity Timeline (visible on all tabs as sidebar/bottom) ── */}
        <div className="mt-8">
          <Section title="Activitate recentă">
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 max-h-64 overflow-y-auto">
              {state.activity.slice(0, 8).map((a, i) => (
                <div key={a.id} className={`flex gap-3 ${i > 0 ? "mt-2 pt-2 border-t border-neutral-100" : ""}`}>
                  <span className={`text-xs w-12 flex-shrink-0 ${
                    a.type === "quote" ? "text-[#B45309]" : a.type === "order" ? "text-[#1D4ED8]" : a.type === "config" ? "text-[#059669]" : "text-neutral-400"
                  }`}>{a.date}</span>
                  <span className="text-sm text-neutral-700">{a.text}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
