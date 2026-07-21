// ══════════════════════════════════════════════
// GLAZEO — Project Workspace v1.0 (Gate 1)
// ══════════════════════════════════════════════
import { Section, Button, StatusBadge } from "../../primitives";
import { Card } from "../../primitives";
import type { StatusKey } from "../../foundation/tokens";

type ProjectWorkspaceProps = {
  projectId: string;
  onBack: () => void;
};

// ── Mock data per project ───────────────────────────
const MOCK_DATA: Record<string, {
  name: string; productType: string; status: StatusKey; progress: number;
  configurations: { id: string; name: string; status: StatusKey; lastEdited: string }[];
  quotes: { id: string; number: string; total: number; currency: string; status: "sent" | "accepted" | "rejected"; validUntil: string }[];
  orders: { id: string; number: string; status: StatusKey; product: string }[];
  activity: { date: string; text: string }[];
}> = {
  p1: {
    name: "Vila Popescu", productType: "Balustrade + Cabine Duș", status: "active", progress: 80,
    configurations: [
      { id: "c1", name: "Balustradă terasă — 12.5m, inox lucios", status: "active", lastEdited: "acum 2 ore" },
      { id: "c2", name: "Cabină duș walk-in — 10mm clar", status: "draft", lastEdited: "acum 1 zi" },
    ],
    quotes: [
      { id: "q1", number: "OF-2026-0042", total: 2847, currency: "EUR", status: "sent", validUntil: "2026-07-23" },
    ],
    orders: [],
    activity: [
      { date: "21 Iul", text: "Ofertă OF-2026-0042 trimisă" },
      { date: "20 Iul", text: "Configurație salvată" },
      { date: "15 Iul", text: "Proiect creat" },
    ],
  },
  p2: {
    name: "Office Building Cluj", productType: "Partiționări sticlă", status: "active", progress: 45,
    configurations: [
      { id: "c3", name: "Partiționări etaj 3 — 8mm clar", status: "active", lastEdited: "ieri" },
    ],
    quotes: [
      { id: "q2", number: "OF-2026-0038", total: 5200, currency: "EUR", status: "sent", validUntil: "2026-07-25" },
    ],
    orders: [],
    activity: [
      { date: "20 Iul", text: "Ofertă OF-2026-0038 trimisă" },
      { date: "18 Iul", text: "Proiect creat" },
    ],
  },
  p3: {
    name: "Hotel Budapest", productType: "Copertină + Balustrade", status: "draft", progress: 20,
    configurations: [
      { id: "c4", name: "Copertină intrare — low-iron 10mm", status: "draft", lastEdited: "acum 3 zile" },
    ],
    quotes: [],
    orders: [
      { id: "o1", number: "CMD-2026-0035", status: "in_progress", product: "Copertină Hotel Budapest" },
    ],
    activity: [
      { date: "19 Iul", text: "Comandă CMD-2026-0035 confirmată" },
      { date: "10 Iul", text: "Proiect creat" },
    ],
  },
};

// ── Quick Order Status Timeline ────────────────────
function OrderProgress({ status }: { status: StatusKey }) {
  const steps = [
    { key: "pending",    label: "Confirmed" },
    { key: "in_progress", label: "Production" },
    { key: "shipped",   label: "Shipping" },
    { key: "delivered", label: "Delivered" },
  ];
  const idx = steps.findIndex(s => s.key === status);

  return (
    <div className="mt-3">
      <div className="flex gap-1 mb-2">
        {steps.map((s, i) => (
          <div key={s.key} className="flex-1">
            <div className={`h-1.5 rounded-full ${i <= idx ? "bg-[#1A56DB]" : "bg-neutral-200"}`} />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-neutral-500">
        {steps.map((s, i) => (
          <span key={s.key} className={i <= idx ? "text-[#1A56DB] font-medium" : ""}>{s.label}</span>
        ))}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────
export default function ProjectWorkspace({ projectId, onBack }: ProjectWorkspaceProps) {
  const project = MOCK_DATA[projectId];
  if (!project) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl mb-4 block">🔍</span>
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Proiect negăsit</h2>
          <Button label="← Înapoi la Workspace" variant="primary" onClick={onBack} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <button onClick={onBack} className="text-sm text-neutral-500 hover:text-neutral-700 mb-4 transition-colors">
          ← Workspace
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">{project.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-neutral-500">{project.productType}</span>
              <StatusBadge status={project.status} />
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-neutral-400 mb-1">Progress</div>
            <div className="text-2xl font-bold text-[#1A56DB]">{project.progress}%</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-neutral-200">
          {["Overview", "Configurări", "Oferte", "Comenzi"].map((tab, i) => (
            <button key={tab}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px
                ${i === 0 ? "text-[#1A56DB] border-[#1A56DB]" : "text-neutral-500 border-transparent hover:text-neutral-700"}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Configurations */}
        <Section title="Configurări" badge={project.configurations.length}>
          {project.configurations.length === 0 ? (
            <p className="text-sm text-neutral-500">Nicio configurație încă.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {project.configurations.map(c => (
                <Card key={c.id} icon="⚙️" title={c.name} subtitle={`Editat ${c.lastEdited}`} status={c.status} />
              ))}
            </div>
          )}
        </Section>

        {/* Quotes */}
        {project.quotes.length > 0 && (
          <Section title="Oferte" badge={project.quotes.length}>
            <div className="grid sm:grid-cols-2 gap-3">
              {project.quotes.map(q => (
                <Card key={q.id} icon="📄" title={q.number}
                  subtitle={q.total.toLocaleString("ro-RO") + " " + (q.currency === "EUR" ? "€" : "lei")}
                  status={q.status}
                  footer={
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-500">Expiră: {new Date(q.validUntil).toLocaleDateString("ro-RO")}</span>
                      {q.status === "sent" && (
                        <button className="px-3 py-1.5 text-xs font-medium bg-[#1A56DB] text-white rounded-lg hover:bg-[#1E40AF]">
                          Acceptă oferta
                        </button>
                      )}
                    </div>
                  } />
              ))}
            </div>
          </Section>
        )}

        {/* Orders */}
        {project.orders.length > 0 && (
          <Section title="Comenzi" badge={project.orders.length}>
            {project.orders.map(o => (
              <Card key={o.id} icon="📦" title={o.product} subtitle={o.number} status={o.status}>
                <OrderProgress status={o.status} />
              </Card>
            ))}
          </Section>
        )}

        {/* Activity Timeline */}
        <Section title="Activitate">
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
            {project.activity.map((a, i) => (
              <div key={i} className={`flex gap-3 ${i > 0 ? "mt-3 pt-3 border-t border-neutral-100" : ""}`}>
                <span className="text-xs text-neutral-400 w-12 flex-shrink-0">{a.date}</span>
                <span className="text-sm text-neutral-700">{a.text}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
