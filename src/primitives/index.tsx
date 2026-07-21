import type { StatusKey, BuyerLevel } from "../foundation/tokens";
import { status as statusTokens } from "../foundation/tokens";

// ══════════════════════════════════════════════
// Status Badge
// ══════════════════════════════════════════════
export function StatusBadge({ status: s }: { status: StatusKey }) {
  const t = statusTokens[s] ?? statusTokens.draft;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full flex-shrink-0" style={{ background: t.bg, color: t.text }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.dot }} />
      {t.label}
    </span>
  );
}

// ══════════════════════════════════════════════
// Buyer Level Badge
// ══════════════════════════════════════════════
const buyerLevelConfig: Record<BuyerLevel, { label: string; bg: string; text: string }> = {
  public:      { label: "Public",      bg: "#F1F3F5", text: "#6B7280" },
  verified:    { label: "Verified",    bg: "#EFF6FF", text: "#1D4ED8" },
  contracted:  { label: "Contracted",  bg: "#ECFDF5", text: "#065F46" },
};

export function BuyerLevelBadge({ level }: { level: BuyerLevel }) {
  const t = buyerLevelConfig[level];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0" style={{ background: t.bg, color: t.text }}>
      {t.label}
    </span>
  );
}

// ══════════════════════════════════════════════
// Card — primitiva fundamentală
// ══════════════════════════════════════════════
type CardProps = {
  icon?: string; title: string; subtitle?: string;
  status?: StatusKey; children?: React.ReactNode;
  footer?: React.ReactNode; onClick?: () => void;
  highlight?: boolean; className?: string;
  "data-testid"?: string;
};

export function Card({ icon, title, subtitle, status: s, children, footer, onClick, highlight, className = "", ...rest }: CardProps) {
  return (
    <div
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : undefined}
      className={`bg-white rounded-xl border p-4 transition-all duration-150
        ${onClick ? "cursor-pointer hover:border-[#1A56DB]/30 hover:shadow-md" : ""}
        ${highlight ? "border-[#F59E0B]/40 bg-[#FFF8E1]/30" : "border-[#E5E7EB]"}
        ${className}`}
      {...rest}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {icon && <span className="text-lg flex-shrink-0">{icon}</span>}
          <div className="min-w-0">
            <h4 className="font-medium text-neutral-900 text-sm truncate">{title}</h4>
            {subtitle && <p className="text-xs text-neutral-500 truncate">{subtitle}</p>}
          </div>
        </div>
        {s && <StatusBadge status={s} />}
      </div>
      {children}
      {footer && <div className="mt-3 pt-3 border-t border-neutral-100">{footer}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════
// Section
// ══════════════════════════════════════════════
export function Section({ id, title, badge, children }: { id?: string; title: string; badge?: number; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">{title}</h3>
        {badge != null && badge > 0 && (
          <span className="text-xs font-medium bg-[#FFF8E1] text-[#B45309] px-2 py-0.5 rounded-full">{badge}</span>
        )}
      </div>
      {children}
    </section>
  );
}

// ══════════════════════════════════════════════
// Button
// ══════════════════════════════════════════════
const btnVariants = {
  primary:   "bg-[#1A56DB] text-white hover:bg-[#1E40AF] shadow-sm",
  secondary: "bg-white text-[#374151] border border-[#D1D5DB] hover:bg-[#F1F3F5]",
  danger:    "bg-[#EF4444] text-white hover:bg-[#DC2626] shadow-sm",
  ghost:     "text-[#4B5563] hover:bg-[#F1F3F5]",
};

export function Button({ label, variant = "secondary", size = "md", onClick, disabled, loading, className = "" }: {
  label: string; variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md"; onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean; loading?: boolean; className?: string;
}) {
  const sizeClass = size === "sm" ? "px-3 py-1.5 text-xs rounded-md" : "px-4 py-2 text-sm rounded-lg";
  return (
    <button type="button" disabled={disabled || loading} onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 font-medium transition-all duration-150
        ${btnVariants[variant]} ${sizeClass}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${loading ? "cursor-wait" : ""} ${className}`}>
      {loading && <Spinner />}{label}
    </button>
  );
}

export function Spinner() {
  return <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>;
}

// ══════════════════════════════════════════════
// Empty State
// ══════════════════════════════════════════════
export function EmptyState({ icon = "📭", message, actionLabel, onAction }: {
  icon?: string; message: string; actionLabel?: string; onAction?: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-neutral-300 p-8 text-center">
      <span className="text-3xl mb-3 block">{icon}</span>
      <p className="text-neutral-500 mb-4">{message}</p>
      {actionLabel && onAction && <Button label={actionLabel} variant="primary" onClick={onAction} />}
    </div>
  );
}

// ══════════════════════════════════════════════
// Skeleton
// ══════════════════════════════════════════════
export function Skeleton({ count = 3 }: { count?: number }) {
  return <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="h-24 bg-white rounded-xl border border-neutral-200 animate-pulse" />
    ))}
  </div>;
}
