// ══════════════════════════════════════════════
// GLAZEO — Project State Machine (Gate 2)
// Reducer + types extracted for testability
// ══════════════════════════════════════════════

import type { StatusKey } from "../../foundation/tokens";

// ── Types ───────────────────────────────────────────
export type ConfigItem = {
  id: string; name: string; version: number;
  status: "draft" | "quoted" | "ordered" | "archived";
  lastEdited: string; productType: string;
};

export type QuoteItem = {
  id: string; number: string; configId: string; configVersion: number;
  total: number; currency: "EUR" | "RON";
  status: "draft" | "sent" | "accepted" | "rejected" | "expired" | "superseded";
  validUntil: string; createdAt: string;
};

export type OrderItem = {
  id: string; number: string;
  quoteId: string; quoteNumber: string;
  configId: string; configVersion: number;
  configName: string;
  total: number; currency: "EUR" | "RON";
  productName: string; status: StatusKey;
  estimatedDelivery: string; createdAt: string;
};

export type ActivityEvent = {
  id: string; date: string; text: string; type: "config" | "quote" | "order" | "project";
};

export type ProjectState = {
  id: string; name: string; productType: string;
  status: StatusKey; progress: number;
  address: string; participants: string[];
  configurations: ConfigItem[];
  quotes: QuoteItem[];
  orders: OrderItem[];
  activity: ActivityEvent[];
};

// ── Actions ─────────────────────────────────────────
export type Action =
  | { type: "REQUEST_QUOTE"; configId: string }
  | { type: "ACCEPT_QUOTE"; quoteId: string }
  | { type: "REJECT_QUOTE"; quoteId: string }
  | { type: "DUPLICATE_CONFIG"; configId: string };

// ── Helpers ─────────────────────────────────────────
let eventId = 10;
export function resetEventId() { eventId = 10; }
export function event(type: ActivityEvent["type"], text: string): ActivityEvent {
  return { id: `e${eventId++}`, date: new Date().toLocaleDateString("ro-RO", { day: "numeric", month: "short" }), text, type };
}

// ── Reducer ─────────────────────────────────────────
export function reducer(state: ProjectState, action: Action): ProjectState {
  switch (action.type) {

    case "REQUEST_QUOTE": {
      const cfg = state.configurations.find(c => c.id === action.configId);
      if (!cfg || cfg.status !== "draft") return state;

      // Guard: don't create duplicate quotes for same config version
      const existingSent = state.quotes.find(q => q.configId === cfg.id && q.configVersion === cfg.version && q.status === "sent");
      if (existingSent) return state;

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
      if (!q) return state;

      // Idempotency: cannot accept if not "sent"
      if (q.status !== "sent") return state;

      // Idempotency: cannot accept if an order already exists for this quote
      const existingOrder = state.orders.find(o => o.quoteId === q.id);
      if (existingOrder) return state;

      const cfg = state.configurations.find(c => c.id === q.configId);
      const orderNum = `CMD-2026-${String(30 + state.orders.length + 1).padStart(4, "0")}`;

      const newOrder: OrderItem = {
        id: `o${state.orders.length + 1}`, number: orderNum,
        quoteId: q.id, quoteNumber: q.number,
        configId: q.configId, configVersion: q.configVersion,
        configName: cfg?.name ?? "—",
        total: q.total, currency: q.currency,
        productName: cfg?.name ?? "Comandă nouă",
        status: "pending",
        estimatedDelivery: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        createdAt: new Date().toISOString().split("T")[0],
      };

      // Concurrent quotes: supersede other sent quotes for the same config
      const supersededQuotes = state.quotes
        .filter(other => other.id !== q.id && other.configId === q.configId && other.status === "sent")
        .map(other => other.id);

      return {
        ...state,
        quotes: state.quotes.map(qq => {
          if (qq.id === action.quoteId) return { ...qq, status: "accepted" as const };
          if (supersededQuotes.includes(qq.id)) return { ...qq, status: "superseded" as const };
          return qq;
        }),
        configurations: state.configurations.map(c =>
          c.id === q.configId ? { ...c, status: "ordered" as const } : c
        ),
        orders: [...state.orders, newOrder],
        activity: [
          event("order", `Comandă ${newOrder.number} creată din oferta ${q.number} (config v${q.configVersion})`),
          event("quote", `Ofertă ${q.number} acceptată`),
          ...(supersededQuotes.length > 0
            ? [event("quote", `${supersededQuotes.length} ofertă concurentă marcată ca superseded`)]
            : []),
          ...state.activity,
        ],
        progress: Math.min(100, state.progress + 20),
        status: state.progress + 20 >= 100 ? "in_progress" : state.status,
      };
    }

    case "REJECT_QUOTE": {
      const q = state.quotes.find(q => q.id === action.quoteId);
      if (!q || q.status !== "sent") return state;
      return {
        ...state,
        quotes: state.quotes.map(qq => qq.id === action.quoteId ? { ...qq, status: "rejected" as const } : qq),
        activity: [event("quote", `Ofertă ${q.number} respinsă`), ...state.activity],
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

// ── Initial State Factory ──────────────────────────
export function createInitialState(): ProjectState {
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
