// ══════════════════════════════════════════════
// GLAZEO Design Tokens
// ══════════════════════════════════════════════

export const status = {
  draft:       { label: "Draft",       bg: "#F1F3F5", text: "#6B7280", dot: "#9CA3AF" },
  pending:     { label: "Pending",     bg: "#FFF8E1", text: "#B45309", dot: "#F59E0B" },
  active:      { label: "Active",      bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
  sent:        { label: "Sent",        bg: "#FFF7ED", text: "#C2410C", dot: "#F97316" },
  accepted:    { label: "Accepted",    bg: "#ECFDF5", text: "#065F46", dot: "#10B981" },
  rejected:    { label: "Rejected",    bg: "#FEF2F2", text: "#991B1B", dot: "#EF4444" },
  expired:     { label: "Expired",     bg: "#F3F4F6", text: "#4B5563", dot: "#9CA3AF" },
  in_progress: { label: "In Progress", bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
  completed:   { label: "Completed",   bg: "#ECFDF5", text: "#065F46", dot: "#059669" },
  cancelled:   { label: "Cancelled",   bg: "#FEF2F2", text: "#991B1B", dot: "#EF4444" },
  shipped:     { label: "Shipped",     bg: "#EDE9FE", text: "#5B21B6", dot: "#8B5CF6" },
  delivered:   { label: "Delivered",   bg: "#ECFDF5", text: "#065F46", dot: "#10B981" },
  archived:    { label: "Archived",    bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF" },
} as const;

export type StatusKey = keyof typeof status;

export const actionCategories = [
  "create", "select", "generate", "compare",
  "request", "review", "approve", "confirm",
  "share", "track", "report",
] as const;
export type ActionCategory = typeof actionCategories[number];

export type ActionDef = {
  id: string; category: ActionCategory; label: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

export type BuyerLevel = "public" | "verified" | "contracted";
