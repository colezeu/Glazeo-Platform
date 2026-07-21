// ══════════════════════════════════════════════
// GLAZEO — Project Workspace v2.1 (Gate 2)
// Extracted state machine + financial confirm dialog
// ══════════════════════════════════════════════
import { useState, useReducer, useCallback } from "react";
import { Section, StatusBadge, EmptyState, ConfirmDialog } from "../../primitives";
import { Card } from "../../primitives";
import {
  reducer, createInitialState,
  type QuoteItem,
} from "./projectState";

// ── Component ───────────────────────────────────────
export default function ProjectWorkspace({ onBack }: { projectId: string; onBack: () => void }) {
  const [state, dispatch] = useReducer(reducer, null, createInitialState);
  const [activeTab, setActiveTab] = useState(0);
  const [confirmQuote, setConfirmQuote] = useState<QuoteItem | null>(null);

  const handleAcceptQuote = useCallback((quote: QuoteItem) => {
    setConfirmQuote(quote);
  }, []);

  const handleConfirmAccept = useCallback(() => {
    if (confirmQuote) {
      dispatch({ type: "ACCEPT_QUOTE", quoteId: confirmQuote.id });
      setConfirmQuote(null);
      setActiveTab(3); // switch to Orders tab
    }
  }, [confirmQuote]);

  const tabs = ["Overview", "Configurări", "Oferte", "Comenzi"];

  const recommendedAction = (() => {
    const sentQuote = state.quotes.find(q => q.status === "sent");
    if (sentQuote) return { type: "quote" as const, text: `Revizuiește oferta ${sentQuote.number}`, action: () => setActiveTab(2) };
    const draftConfig = state.configurations.find(c => c.status === "draft");
    if (draftConfig) return { type: "config" as const, text: `Finalizează ${draftConfig.name}`, action: () => setActiveTab(1) };
    if (state.orders.some(o => o.status === "pending")) return { type: "order" as const, text: "Urmărește comanda activă", action: () => setActiveTab(3) };
    return null;
  })();

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
                    <span className="w-7 h-7 rounded-full bg-[#EFF6FF] flex items-center justify-center text-xs font-medium text-[#1A56DB]">{p[0]}</span>
                    <span className="text-neutral-700">{p}</span>
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
              <EmptyState icon="⚙️" message="Nicio configurație încă." />
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
                  const isExpiring = q.status === "sent" && new Date(q.validUntil).getTime() - Date.now() < 2 * 24 * 60 * 60 * 1000;
                  const statusDisplay = q.status === "superseded" ? "archived" as const : q.status;
                  return (
                    <Card key={q.id} icon="📄" title={q.number}
                      subtitle={`${q.total.toLocaleString("ro-RO")} ${q.currency === "EUR" ? "€" : "lei"} · din ${cfg?.name ?? "—"} v${q.configVersion}`}
                      status={statusDisplay}
                      highlight={!!(isExpiring && q.status === "sent")}
                      footer={
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-500">
                            {q.status === "sent" ? `Expiră: ${new Date(q.validUntil).toLocaleDateString("ro-RO")}` :
                             q.status === "accepted" ? `Acceptată: ${new Date(q.createdAt).toLocaleDateString("ro-RO")}` :
                             q.status === "superseded" ? "Înlocuită de o ofertă acceptată" :
                             q.status === "rejected" ? "Respinsă" : ""}
                          </span>
                          {q.status === "sent" && (
                            <div className="flex gap-1.5">
                              <button onClick={() => dispatch({ type: "REJECT_QUOTE", quoteId: q.id })}
                                className="px-2.5 py-1.5 text-xs font-medium text-[#991B1B] bg-[#FEF2F2] rounded-lg hover:bg-[#FEE2E2] transition-colors">
                                Refuză
                              </button>
                              <button onClick={() => handleAcceptQuote(q)}
                                className="px-2.5 py-1.5 text-xs font-medium bg-[#1A56DB] text-white rounded-lg hover:bg-[#1E40AF] transition-colors">
                                Acceptă
                              </button>
                            </div>
                          )}
                        </div>
                      }>
                      {isExpiring && (
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
                      subtitle={`${o.number} · Ofertă: ${o.quoteNumber} · Config: ${o.configName} v${o.configVersion}`}
                      status={o.status}>
                      <div className="mt-2 text-sm text-neutral-600">
                        <p>{o.total.toLocaleString("ro-RO")} {o.currency === "EUR" ? "€" : "lei"}</p>
                      </div>
                      <div className="mt-3">
                        <div className="flex gap-1 mb-2">
                          {steps.map((s, i) => (
                            <div key={s.key} className={`flex-1 h-2 rounded-full ${i <= idx ? "bg-[#1A56DB]" : "bg-neutral-200"}`} />
                          ))}
                        </div>
                        <div className="flex justify-between text-[10px]">
                          {steps.map((s, i) => (
                            <span key={s.key} className={i <= idx ? "text-[#1A56DB] font-medium" : "text-neutral-400"}>{s.label}</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-neutral-500 mt-2">
                        🚚 Estimare livrare: {new Date(o.estimatedDelivery).toLocaleDateString("ro-RO")}
                      </p>
                    </Card>
                  );
                })}
              </div>
            )}
          </Section>
        )}

        {/* ── Activity Timeline ── */}
        <div className="mt-8">
          <Section title="Activitate recentă">
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 max-h-64 overflow-y-auto">
              {state.activity.slice(0, 10).map((a, i) => (
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

      {/* ── Financial Confirm Dialog ── */}
      <ConfirmDialog
        open={confirmQuote !== null}
        title="Confirmă acceptarea ofertei"
        message={`Ești sigur că vrei să accepți oferta ${confirmQuote?.number}?`}
        consequence={`Se va crea o comandă în valoare de ${confirmQuote?.total.toLocaleString("ro-RO")} ${confirmQuote?.currency === "EUR" ? "EUR" : "RON"}. Configurația va deveni read-only.`}
        confirmLabel="Acceptă oferta"
        variant="primary"
        onConfirm={handleConfirmAccept}
        onCancel={() => setConfirmQuote(null)}
      />
    </div>
  );
}
