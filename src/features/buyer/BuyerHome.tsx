// ══════════════════════════════════════════════
// GLAZEO Buyer — Home Workspace v1.0
// Gate 1: Mock data only. No Supabase, no API.
// ══════════════════════════════════════════════
import { useState, useEffect } from "react";
import { Section, Skeleton, EmptyState, BuyerLevelBadge } from "../../primitives";
import { ProjectCard, QuoteCard, OrderCard, ConfiguratorGrid } from "../../domain";
import type { ProjectSummary, QuoteSummary, OrderSummary, ConfiguratorItem } from "../../domain";
import type { BuyerLevel } from "../../foundation/tokens";

// ── Mock Data ──────────────────────────────────────
const MOCK_PROJECTS: ProjectSummary[] = [
  { id: "p1", name: "Vila Popescu", productType: "Balustrade + Cabine Duș", status: "active", progress: 80 },
  { id: "p2", name: "Office Building Cluj", productType: "Partiționări sticlă", status: "active", progress: 45 },
  { id: "p3", name: "Hotel Budapest", productType: "Copertină + Balustrade", status: "draft", progress: 20 },
];

const MOCK_QUOTES: QuoteSummary[] = [
  { id: "q1", number: "OF-2026-0042", clientName: "Vila Popescu", productName: "Balustradă terasă 12.5m", total: 2847, currency: "EUR", status: "sent", validUntil: "2026-07-23" },
  { id: "q2", number: "OF-2026-0038", clientName: "Office Cluj", productName: "Partiționări 8mm", total: 5200, currency: "EUR", status: "sent", validUntil: "2026-07-25" },
];

const MOCK_ORDERS: OrderSummary[] = [
  { id: "o1", number: "CMD-2026-0035", productName: "Copertină Hotel Budapest", status: "in_progress", estimatedDelivery: "2026-08-05" },
];

const CONFIGURATORS: ConfiguratorItem[] = [
  { key: "balustrade", label: "Balustrade", icon: "🏗️" },
  { key: "swingdoor", label: "Uși Batante", icon: "🚪" },
  { key: "sliding", label: "Uși Culisante", icon: "🪟" },
  { key: "partition", label: "Partiționări", icon: "🧱" },
  { key: "pergola", label: "Pergole", icon: "🏡" },
  { key: "canopy", label: "Copertine", icon: "⛱️" },
  { key: "shower", label: "Cabine Duș", icon: "🚿" },
  { key: "mirror", label: "Oglinzi", icon: "🪞" },
];

// ── Buyer Home ─────────────────────────────────────
type BuyerHomeProps = {
  buyerLevel?: BuyerLevel;
  userName?: string;
};

export default function BuyerHome({ buyerLevel = "verified", userName = "Cornel" }: BuyerHomeProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      // Simulăm o eroare random (5%) pentru a testa error state
      if (Math.random() < 0.05) { setError(true); }
      setLoading(false);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  const greeting = new Date().getHours() < 12 ? "Bună dimineața" : new Date().getHours() < 18 ? "Bună ziua" : "Bună seara";

  // ── Error State ──
  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Nu am putut încărca datele</h2>
          <p className="text-neutral-500 mb-4">E posibil să fie o problemă temporară. Datele tale sunt în siguranță.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setError(false); setLoading(true); setTimeout(() => setLoading(false), 800); }}
              className="px-4 py-2 text-sm font-medium bg-[#1A56DB] text-white rounded-lg hover:bg-[#1E40AF] transition-colors">
              Încearcă din nou
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading State ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="h-4 w-32 bg-neutral-200 rounded animate-pulse mb-2" />
            <div className="h-8 w-72 bg-neutral-200 rounded animate-pulse mb-1" />
            <div className="h-5 w-48 bg-neutral-200 rounded animate-pulse" />
          </div>
          <Skeleton count={5} />
        </div>
      </div>
    );
  }

  const navigate = (path: string) => console.log(`[Mock] Navigate to: ${path}`);

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-3">
          <div>
            <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1">Home Workspace</h2>
            <h1 className="text-2xl font-semibold text-neutral-900">{greeting}, {userName}.</h1>
            <p className="text-neutral-500 mt-1">Ce dorești să faci?</p>
          </div>
          <BuyerLevelBadge level={buyerLevel} />
        </div>

        {/* ── Quick Actions (variantă per buyer level) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: buyerLevel === "contracted" ? "Comandă rapidă" : "Configurează", icon: "⚙️" },
            { label: "Ofertele mele", icon: "📋" },
            { label: "Comenzi", icon: "📦" },
            { label: "Proiect nou", icon: "➕" },
          ].map((a) => (
            <button key={a.label}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-[#E5E7EB]
                hover:border-[#1A56DB]/30 hover:bg-[#EFF6FF] transition-all duration-150
                focus-visible:outline-2 focus-visible:outline-[#1A56DB] focus-visible:outline-offset-2">
              <span className="text-2xl">{a.icon}</span>
              <span className="text-sm font-medium text-neutral-700 text-center">{a.label}</span>
            </button>
          ))}
        </div>

        {/* ── PROIECTE RECENTE ── */}
        <Section title="Proiecte recente" badge={MOCK_PROJECTS.length}>
          {MOCK_PROJECTS.length === 0 ? (
            <EmptyState icon="📁" message="Nu ai încă niciun proiect." actionLabel="Configurează primul produs" onAction={() => navigate("/configurator")} />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {MOCK_PROJECTS.map((p) => <ProjectCard key={p.id} project={p} onClick={() => navigate(`/project/${p.id}`)} />)}
            </div>
          )}
        </Section>

        {/* ── OFERTE CARE NECESITĂ ACȚIUNE ── */}
        {MOCK_QUOTES.length > 0 && (
          <Section title="Oferte care necesită acțiune" badge={MOCK_QUOTES.length}>
            <div className="grid sm:grid-cols-2 gap-3">
              {MOCK_QUOTES.map((q) => (
                <QuoteCard key={q.id} quote={q}
                  onAccept={buyerLevel !== "public" ? () => alert(`✅ Ofertă ${q.number} acceptată!`) : undefined}
                  onReject={() => alert(`❌ Ofertă ${q.number} respinsă.`)}
                  onClick={() => navigate(`/quote/${q.id}`)} />
              ))}
            </div>
          </Section>
        )}

        {/* ── COMENZI ACTIVE ── */}
        {MOCK_ORDERS.length > 0 && (
          <Section title="Comenzi active" badge={MOCK_ORDERS.length}>
            <div className="grid sm:grid-cols-2 gap-3">
              {MOCK_ORDERS.map((o) => <OrderCard key={o.id} order={o} onClick={() => navigate(`/order/${o.id}`)} />)}
            </div>
          </Section>
        )}

        {/* ── CONFIGURATOARE ── */}
        <Section id="configurators" title="Configurează un produs">
          <ConfiguratorGrid items={CONFIGURATORS} onSelect={(item) => navigate(`/configurator/${item.key}`)} />
        </Section>

        {/* ── CTA per buyer level (excepție: Public nu vede buton de comandă) ── */}
        {buyerLevel === "contracted" && (
          <div className="mt-6 p-4 bg-[#EFF6FF] rounded-xl border border-[#1A56DB]/20 flex items-center justify-between">
            <div>
              <p className="font-medium text-[#1D4ED8]">Acces complet</p>
              <p className="text-sm text-neutral-600">Poți comanda direct. Proformele se emit automat.</p>
            </div>
            <span className="text-2xl">🚀</span>
          </div>
        )}
      </div>
    </div>
  );
}
