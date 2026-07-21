import { Card } from "../primitives";
import type { StatusKey } from "../foundation/tokens";

// ══════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════
export type ProjectSummary = {
  id: string; name: string; productType: string;
  status: StatusKey; progress?: number;
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

export type ConfiguratorItem = {
  key: string; label: string; icon: string;
};

// ══════════════════════════════════════════════
// ProjectCard
// ══════════════════════════════════════════════
export function ProjectCard({ project, onClick }: { project: ProjectSummary; onClick: () => void }) {
  return (
    <Card icon="📁" title={project.name} subtitle={project.productType} status={project.status} onClick={onClick}>
      {project.progress != null && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-neutral-500 mb-1">
            <span>Progress</span><span>{project.progress}%</span>
          </div>
          <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#1A56DB] rounded-full transition-all" style={{ width: `${project.progress}%` }} />
          </div>
        </div>
      )}
    </Card>
  );
}

// ══════════════════════════════════════════════
// QuoteCard
// ══════════════════════════════════════════════
export function QuoteCard({ quote, onAccept, onReject, onClick }: {
  quote: QuoteSummary; onAccept?: () => void; onReject?: () => void; onClick?: () => void;
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
            <div className="flex gap-2">
              {onReject && (
                <button onClick={(e) => { e.stopPropagation(); onReject(); }}
                  className="px-3 py-1.5 text-xs font-medium text-[#991B1B] bg-[#FEF2F2] rounded-lg hover:bg-[#FEE2E2] transition-colors">
                  Refuză
                </button>
              )}
              {onAccept && (
                <button onClick={(e) => { e.stopPropagation(); onAccept(); }}
                  className="px-3 py-1.5 text-xs font-medium bg-[#1A56DB] text-white rounded-lg hover:bg-[#1E40AF] transition-colors">
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
// OrderCard
// ══════════════════════════════════════════════
export function OrderCard({ order, onClick }: { order: OrderSummary; onClick?: () => void }) {
  return (
    <Card icon="📦" title={order.productName} subtitle={order.number} status={order.status} onClick={onClick}>
      {order.estimatedDelivery && (
        <p className="text-xs text-neutral-500 mt-1">Estimare livrare: {new Date(order.estimatedDelivery).toLocaleDateString("ro-RO")}</p>
      )}
    </Card>
  );
}

// ══════════════════════════════════════════════
// ConfiguratorGrid
// ══════════════════════════════════════════════
export function ConfiguratorGrid({ items, onSelect }: { items: ConfiguratorItem[]; onSelect: (item: ConfiguratorItem) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {items.map((item) => (
        <button key={item.key} onClick={() => onSelect(item)}
          className="flex items-center gap-2 p-3 bg-white rounded-lg border border-[#E5E7EB]
            hover:border-[#1A56DB]/30 hover:bg-[#EFF6FF] transition-all duration-150 text-left
            focus-visible:outline-2 focus-visible:outline-[#1A56DB] focus-visible:outline-offset-2">
          <span className="text-lg">{item.icon}</span>
          <span className="text-sm font-medium text-neutral-700">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
