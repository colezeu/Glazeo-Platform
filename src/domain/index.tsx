import { Card } from "../primitives";
import type { StatusKey } from "../foundation/tokens";

// ══════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════
export type ProjectSummary = {
  id: string; name: string; productType: string;
  status: StatusKey; nextStep: string; progress?: number;
};

export type QuoteSummary = {
  id: string; number: string; clientName: string;
  productName: string; total: number;
  currency: "EUR" | "RON"; status: "sent" | "accepted" | "rejected" | "expired";
  validUntil?: string;
};

export type OrderSummary = {
  id: string; number: string; productName: string;
  status: "pending" | "in_progress" | "shipped" | "delivered" | "completed";
  estimatedDelivery?: string;
};

export type ConfiguratorItem = { key: string; label: string; icon: string; group: "interior" | "exterior" };

// ══════════════════════════════════════════════
// Mini Order Timeline
// ══════════════════════════════════════════════
const ORDER_STEPS = [
  { key: "pending",    label: "Confirmed" },
  { key: "in_progress", label: "Production" },
  { key: "shipped",   label: "Shipping" },
  { key: "delivered", label: "Delivered" },
  { key: "completed", label: "Complete" },
] as const;

function OrderTimeline({ status }: { status: OrderSummary["status"] }) {
  const currentIdx = ORDER_STEPS.findIndex(s => s.key === status);
  return (
    <div className="flex items-center gap-1 mt-2">
      {ORDER_STEPS.map((step, i) => {
        const done = i <= currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={step.key} className="flex items-center gap-1 flex-1 last:flex-none">
            <div className={`h-1.5 rounded-full flex-1 ${done ? "bg-[#1A56DB]" : "bg-neutral-200"}`}
              style={isCurrent ? { background: "linear-gradient(90deg, #1A56DB 60%, #E5E7EB 100%)" } : undefined} />
            {i === ORDER_STEPS.length - 1 && (
              <div className={`w-1.5 h-1.5 rounded-full ${done ? "bg-[#059669]" : "bg-neutral-300"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════
// ProjectCard — cu next step
// ══════════════════════════════════════════════
export function ProjectCard({ project, onClick }: { project: ProjectSummary; onClick: () => void }) {
  return (
    <Card icon="📁" title={project.name} subtitle={project.productType} status={project.status} onClick={onClick}>
      <div className="mt-2 flex items-center gap-2 text-xs">
        <span className="text-neutral-400">Next:</span>
        <span className="font-medium text-[#1A56DB]">{project.nextStep}</span>
      </div>
      {project.progress != null && (
        <div className="mt-2">
          <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#1A56DB]/20 rounded-full" style={{ width: `${project.progress}%` }} />
          </div>
        </div>
      )}
    </Card>
  );
}

// ══════════════════════════════════════════════
// QuoteCard — cu Compare
// ══════════════════════════════════════════════
export function QuoteCard({ quote, onAccept, onReject, onCompare, onClick }: {
  quote: QuoteSummary; onAccept?: () => void; onReject?: () => void;
  onCompare?: () => void; onClick?: () => void;
}) {
  const isExpiring = quote.validUntil && new Date(quote.validUntil).getTime() - Date.now() < 2 * 24 * 60 * 60 * 1000;

  return (
    <Card icon="📄" title={quote.clientName || quote.productName}
      subtitle={`${quote.number} · ${quote.productName}`}
      status={quote.status} highlight={!!(isExpiring && quote.status === "sent")} onClick={onClick}
      footer={
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-neutral-900">
            {quote.total.toLocaleString("ro-RO")} {quote.currency === "EUR" ? "€" : "lei"}
          </span>
          {quote.status === "sent" && (
            <div className="flex gap-1.5">
              {onReject && (
                <button onClick={(e) => { e.stopPropagation(); onReject(); }}
                  className="px-2.5 py-1.5 text-xs font-medium text-[#991B1B] bg-[#FEF2F2] rounded-lg hover:bg-[#FEE2E2] transition-colors">
                  Refuză
                </button>
              )}
              {onCompare && (
                <button onClick={(e) => { e.stopPropagation(); onCompare(); }}
                  className="px-2.5 py-1.5 text-xs font-medium text-[#4B5563] bg-[#F3F4F6] rounded-lg hover:bg-[#E5E7EB] transition-colors">
                  Compară
                </button>
              )}
              {onAccept && (
                <button onClick={(e) => { e.stopPropagation(); onAccept(); }}
                  className="px-2.5 py-1.5 text-xs font-medium bg-[#1A56DB] text-white rounded-lg hover:bg-[#1E40AF] transition-colors">
                  Acceptă
                </button>
              )}
            </div>
          )}
        </div>
      }>
      {isExpiring && quote.status === "sent" && (
        <p className="text-xs text-[#B45309] mt-1">⚠️ Expiră în mai puțin de 2 zile</p>
      )}
    </Card>
  );
}

// ══════════════════════════════════════════════
// OrderCard — cu mini timeline
// ══════════════════════════════════════════════
export function OrderCard({ order, onClick }: { order: OrderSummary; onClick?: () => void }) {
  return (
    <Card icon="📦" title={order.productName} subtitle={order.number} status={order.status} onClick={onClick}>
      <OrderTimeline status={order.status} />
      {order.estimatedDelivery && (
        <p className="text-xs text-neutral-500 mt-2">
          Est. delivery: {new Date(order.estimatedDelivery).toLocaleDateString("ro-RO")}
        </p>
      )}
    </Card>
  );
}

// ══════════════════════════════════════════════
// ConfiguratorGrid — grupat pe Interior/Exterior
// ══════════════════════════════════════════════
export function ConfiguratorGrid({ items, onSelect }: { items: ConfiguratorItem[]; onSelect: (item: ConfiguratorItem) => void }) {
  const interior = items.filter(i => i.group === "interior");
  const exterior = items.filter(i => i.group === "exterior");

  const Group = ({ label, list }: { label: string; list: ConfiguratorItem[] }) => (
    <div className="mb-3">
      <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">{label}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {list.map((item) => (
          <button key={item.key} onClick={() => onSelect(item)}
            className="flex items-center gap-2 p-3 bg-white rounded-lg border border-[#E5E7EB]
              hover:border-[#1A56DB]/30 hover:bg-[#EFF6FF] transition-all duration-150 text-left
              focus-visible:outline-2 focus-visible:outline-[#1A56DB] focus-visible:outline-offset-2">
            <span className="text-lg">{item.icon}</span>
            <span className="text-sm font-medium text-neutral-700">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      {interior.length > 0 && <Group label="Interior" list={interior} />}
      {exterior.length > 0 && <Group label="Exterior" list={exterior} />}
    </div>
  );
}
