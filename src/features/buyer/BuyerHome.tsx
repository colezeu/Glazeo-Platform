// ══════════════════════════════════════════════
// GLAZEO Buyer — Home Workspace v1.1
// Gate 1: Mock data. Focus: "next decision", not "what exists"
// ══════════════════════════════════════════════
import { useState, useEffect } from "react";
import { Section, Skeleton, EmptyState, BuyerLevelBadge } from "../../primitives";
import { ProjectCard, QuoteCard, OrderCard, ConfiguratorGrid } from "../../domain";
import type { ProjectSummary, QuoteSummary, OrderSummary, ConfiguratorItem } from "../../domain";
import type { BuyerLevel } from "../../foundation/tokens";

// ── Mock Data ──────────────────────────────────────
const MOCK_PROJECTS: ProjectSummary[] = [
  { id: "p1", name: "Vila Popescu", productType: "Balustrade + Cabine Duș", status: "active", nextStep: "Generate Quote", progress: 80 },
  { id: "p2", name: "Office Building Cluj", productType: "Partiționări sticlă", status: "active", nextStep: "Waiting for Approval", progress: 45 },
  { id: "p3", name: "Hotel Budapest", productType: "Copertină + Balustrade", status: "draft", nextStep: "Select Hardware", progress: 20 },
];

const MOCK_QUOTES: QuoteSummary[] = [
  { id: "q1", number: "OF-2026-0042", clientName: "Vila Popescu", productName: "Balustradă terasă 12.5m", total: 2847, currency: "EUR", status: "sent", validUntil: "2026-07-23" },
  { id: "q2", number: "OF-2026-0038", clientName: "Office Cluj", productName: "Partiționări 8mm", total: 5200, currency: "EUR", status: "sent", validUntil: "2026-07-25" },
];

const MOCK_ORDERS: OrderSummary[] = [
  { id: "o1", number: "CMD-2026-0035", productName: "Copertină Hotel Budapest", status: "in_progress", estimatedDelivery: "2026-08-05" },
];

const CONFIGURATORS: ConfiguratorItem[] = [
  { key: "shower",    label: "Cabine Duș",    icon: "🚿", group: "interior" },
  { key: "partition", label: "Partiționări",   icon: "🧱", group: "interior" },
  { key: "swingdoor", label: "Uși Batante",    icon: "🚪", group: "interior" },
  { key: "sliding",   label: "Uși Culisante", icon: "🪟", group: "interior" },
  { key: "mirror",    label: "Oglinzi",        icon: "🪞", group: "interior" },
  { key: "balustrade",label: "Balustrade",     icon: "🏗️", group: "exterior" },
  { key: "canopy",    label: "Copertine",      icon: "⛱️", group: "exterior" },
  { key: "pergola",   label: "Pergole",        icon: "🏡", group: "exterior" },
];

// ── Buyer level context ────────────────────────────
const buyerContext: Record<BuyerLevel, { tier: string; subtitle: string; color: string }> = {
  public:     { tier: "Public",   subtitle: "Prețuri de listă",       color: "#6B7280" },
  verified:   { tier: "Verified", subtitle: "Prețuri personalizate active", color: "#1D4ED8" },
  contracted: { tier: "Contracted", subtitle: "Comenzi automate · Proforme instant", color: "#065F46" },
};

// ── Top Nav (simplificat) ──────────────────────────
function TopNav({ userName, onProjectsClick }: { userName: string; onProjectsClick?: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-200">
      <div className="flex items-center gap-6">
        <span className="font-semibold text-neutral-900 text-sm">GLAZEO</span>
        <nav className="hidden sm:flex items-center gap-4">
          <span className="text-sm font-medium text-[#1A56DB]">Workspace</span>
          <button onClick={onProjectsClick} className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors cursor-pointer">Projects</button>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-neutral-400 hidden sm:inline">🔍</span>
        <span className="text-sm text-neutral-400 cursor-pointer">🔔</span>
        <span className="w-7 h-7 rounded-full bg-[#EFF6FF] flex items-center justify-center text-xs font-medium text-[#1A56DB]">
          {userName[0]}
        </span>
      </div>
    </div>
  );
}

// ── Today Summary ──────────────────────────────────
function TodaySummary({ expiringQuotes, activeOrders, activeProjects }: {
  expiringQuotes: number; activeOrders: number; activeProjects: number;
}) {
  const items = [];
  if (expiringQuotes > 0) items.push(`${expiringQuotes} ${expiringQuotes === 1 ? "ofertă expiră" : "oferte expiră"}`);
  if (activeOrders > 0) items.push(`${activeOrders} ${activeOrders === 1 ? "comandă" : "comenzi"} în producție`);
  if (activeProjects > 0) items.push(`${activeProjects} ${activeProjects === 1 ? "proiect activ" : "proiecte active"}`);

  if (items.length === 0) return null;

  return (
    <div className="text-sm text-neutral-500 mb-6">
      Today · {items.join(" · ")}
    </div>
  );
}

// ── Recommended Action Card ────────────────────────
function RecommendedAction({ quote, onAction }: { quote: QuoteSummary; onAction: () => void }) {
  const daysLeft = quote.validUntil
    ? Math.ceil((new Date(quote.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="bg-[#FFF8E1] rounded-xl border-2 border-[#F59E0B]/40 p-6 mb-8 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs font-semibold text-[#B45309] uppercase tracking-wider mb-2">⚡ Recommended Action</p>
          <p className="text-neutral-900 font-semibold text-lg leading-snug mb-1">
            {quote.number} — {quote.clientName}
          </p>
          <p className="text-neutral-600 text-sm">
            {quote.productName} · {quote.total.toLocaleString("ro-RO")} {quote.currency === "EUR" ? "€" : "lei"}
          </p>
          <div className="mt-3 pt-3 border-t border-[#F59E0B]/20">
            <p className="text-sm text-[#92400E] font-medium">
              💡 {daysLeft <= 1
                ? "Expiră azi. După expirare, prețurile vor necesita recalculare."
                : `Expiră în ${daysLeft} zile. După expirare, oferta va necesita recalcularea prețului.`}
            </p>
          </div>
        </div>
        <button onClick={onAction}
          className="px-6 py-3 text-sm font-semibold bg-[#F59E0B] text-[#7C2D12] rounded-xl
            hover:bg-[#D97706] hover:text-white transition-all duration-200 flex-shrink-0 shadow-sm
            focus-visible:outline-2 focus-visible:outline-[#F59E0B] focus-visible:outline-offset-2">
          Revizuiește oferta →
        </button>
      </div>
    </div>
  );
}

// ── Knowledge Card ─────────────────────────────────
function KnowledgeCard() {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 flex items-center justify-between hover:border-[#1A56DB]/30 transition-colors cursor-pointer">
      <div className="flex items-center gap-3">
        <span className="text-lg">📚</span>
        <div>
          <p className="text-xs font-medium text-neutral-400 uppercase">Knowledge</p>
          <p className="text-sm font-medium text-neutral-800">Cum alegi sticla laminată potrivită?</p>
        </div>
      </div>
      <span className="text-neutral-400">→</span>
    </div>
  );
}

// ── Main ───────────────────────────────────────────
export default function BuyerHome({ buyerLevel = "verified", userName = "Cornel", onNavigateProject }: {
  buyerLevel?: BuyerLevel; userName?: string; onNavigateProject?: (projectId: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (Math.random() < 0.05) { setError(true); }
      setLoading(false);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  const greeting = new Date().getHours() < 12 ? "Bună dimineața" : new Date().getHours() < 18 ? "Bună ziua" : "Bună seara";
  const ctx = buyerContext[buyerLevel];
  const navigate = (path: string) => console.log(`[Mock] Navigate to: ${path}`);

  // ── Error ──
  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F9FB]">
        <TopNav userName={userName} onProjectsClick={() => onNavigateProject?.("p1")} />
        <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 52px)" }}>
          <div className="text-center max-w-md px-4">
            <span className="text-4xl mb-4 block">⚠️</span>
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Nu am putut încărca datele</h2>
            <p className="text-neutral-500 mb-4">E posibil să fie o problemă temporară. Datele tale sunt în siguranță.</p>
            <button onClick={() => { setError(false); setLoading(true); setTimeout(() => setLoading(false), 800); }}
              className="px-4 py-2 text-sm font-medium bg-[#1A56DB] text-white rounded-lg hover:bg-[#1E40AF] transition-colors">
              Încearcă din nou
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB]">
        <TopNav userName={userName} onProjectsClick={() => onNavigateProject?.("p1")} />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse mb-2" />
            <div className="h-8 w-72 bg-neutral-200 rounded animate-pulse mb-1" />
            <div className="h-5 w-64 bg-neutral-200 rounded animate-pulse" />
          </div>
          <Skeleton count={5} />
        </div>
      </div>
    );
  }

  const expiringQuotes = MOCK_QUOTES.filter(q => q.status === "sent" && q.validUntil && new Date(q.validUntil).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000);

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <TopNav userName={userName} onProjectsClick={() => onNavigateProject?.("p1")} />

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">{greeting}, {userName}.</h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <BuyerLevelBadge level={buyerLevel} />
            <span className="text-xs text-neutral-500 hidden sm:inline">{ctx.subtitle}</span>
          </div>
        </div>

        {/* ── Today Summary ── */}
        <TodaySummary
          expiringQuotes={expiringQuotes.length}
          activeOrders={MOCK_ORDERS.length}
          activeProjects={MOCK_PROJECTS.filter(p => p.status === "active").length}
        />

        {/* ── Recommended Action ── */}
        {expiringQuotes.length > 0 && buyerLevel !== "public" && (
          <RecommendedAction quote={expiringQuotes[0]} onAction={() => navigate(`/quote/${expiringQuotes[0].id}`)} />
        )}

        {/* ── Quick Actions ── */}
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
              {MOCK_PROJECTS.map((p) => <ProjectCard key={p.id} project={p} onClick={() => onNavigateProject?.(p.id)} />)}
            </div>
          )}
        </Section>

        {/* ── OFERTE ── */}
        {MOCK_QUOTES.length > 0 && (
          <Section title="Oferte care necesită acțiune" badge={MOCK_QUOTES.length}>
            <div className="grid sm:grid-cols-2 gap-3">
              {MOCK_QUOTES.map((q) => (
                <QuoteCard key={q.id} quote={q}
                  onAccept={buyerLevel !== "public" ? () => alert(`✅ Ofertă ${q.number} acceptată!`) : undefined}
                  onReject={() => alert(`❌ Ofertă ${q.number} respinsă.`)}
                  onCompare={() => alert(`📊 Compară oferta ${q.number} cu alte opțiuni.`)}
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

        {/* ── Knowledge ── */}
        <div className="mt-8">
          <KnowledgeCard />
        </div>

        {/* ── Contracted banner ── */}
        {buyerLevel === "contracted" && (
          <div className="mt-6 p-4 bg-[#ECFDF5] rounded-xl border border-[#059669]/20 flex items-center justify-between">
            <div>
              <p className="font-medium text-[#065F46]">Contracted Buyer</p>
              <p className="text-sm text-neutral-600">Comenzi automate · Proforme instant · Discount activ</p>
            </div>
            <span className="text-2xl">🚀</span>
          </div>
        )}
      </div>
    </div>
  );
}
