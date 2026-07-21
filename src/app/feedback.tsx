// ══════════════════════════════════════════════
// GLAZEO — Feedback + Analytics (Track B)
// ══════════════════════════════════════════════
import { useState, useEffect } from "react";

// ── Analytics ──────────────────────────────────────
// Minimal event tracker. Swap for Plausible/PostHog later.
const EVENTS_KEY = "glazeo_analytics";

type AnalyticsEvent = {
  name: string;
  timestamp: string;
  props?: Record<string, string>;
};

export function trackEvent(name: string, props?: Record<string, string>) {
  try {
    const stored = localStorage.getItem(EVENTS_KEY);
    const events: AnalyticsEvent[] = stored ? JSON.parse(stored) : [];
    events.push({ name, timestamp: new Date().toISOString(), props });
    // Keep only last 100 events
    if (events.length > 100) events.splice(0, events.length - 100);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));

    // Log to console in dev
    if (import.meta.env.DEV) {
      console.log(`[Analytics] ${name}`, props ?? "");
    }
  } catch { /* silently ignore */ }
}

// Pre-defined events
export const Analytics = {
  pageView: (page: string) => trackEvent("page_view", { page }),
  signup: () => trackEvent("signup"),
  login: () => trackEvent("login"),
  projectCreated: () => trackEvent("project_created"),
  configurationStarted: (product: string) => trackEvent("configuration_started", { product }),
  quoteRequested: () => trackEvent("quote_requested"),
  quoteAccepted: () => trackEvent("quote_accepted"),
  orderCreated: () => trackEvent("order_created"),
};

// ── Feedback Widget ────────────────────────────────
export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!message.trim()) return;
    trackEvent("feedback_sent", { message: message.slice(0, 200) });
    setSent(true);
    setTimeout(() => { setOpen(false); setSent(false); setMessage(""); }, 2000);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-[#1A56DB] text-white rounded-full shadow-lg
          hover:bg-[#1E40AF] transition-all flex items-center justify-center text-xl"
        aria-label="Trimite feedback"
      >
        {open ? "×" : "💬"}
      </button>

      {/* Feedback panel */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-80 bg-white rounded-2xl shadow-xl border border-[#E5E7EB] p-4">
          {sent ? (
            <p className="text-sm text-[#059669] font-medium text-center py-4">✅ Feedback trimis. Mulțumim!</p>
          ) : (
            <>
              <p className="text-sm font-medium text-neutral-900 mb-2">Ce ai vrea să îmbunătățim?</p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm resize-none
                  focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/25"
                placeholder="Ex: Mi-ar plăcea să pot..."
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => setOpen(false)}
                  className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-700">
                  Anulează
                </button>
                <button onClick={handleSend}
                  className="px-3 py-1.5 text-xs font-medium bg-[#1A56DB] text-white rounded-lg hover:bg-[#1E40AF]">
                  Trimite
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

// ── Error Boundary (lightweight) ────────────────────
import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class GlazeoErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    trackEvent("error_boundary", {
      error: error.message.slice(0, 200),
      stack: (info.componentStack ?? "").slice(0, 500),
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <span className="text-4xl mb-4 block">🔧</span>
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Ceva nu a funcționat</h2>
            <p className="text-neutral-500 mb-4">
              Am înregistrat eroarea și o vom rezolva. Între timp, poți reîncărca pagina.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm font-medium bg-[#1A56DB] text-white rounded-lg hover:bg-[#1E40AF]"
            >
              Reîncarcă pagina
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Analytics Debug (dev only) ──────────────────────
export function AnalyticsDebug() {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);

  useEffect(() => {
    const update = () => {
      const stored = localStorage.getItem(EVENTS_KEY);
      setEvents(stored ? JSON.parse(stored) : []);
    };
    update();
    const interval = setInterval(update, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!import.meta.env.DEV) return null;

  return (
    <details className="fixed bottom-4 left-4 z-50 bg-black/80 text-white text-xs rounded-lg p-3 max-w-xs max-h-64 overflow-auto">
      <summary className="cursor-pointer font-mono">Analytics ({events.length})</summary>
      <div className="mt-2 space-y-1">
        {events.slice(-10).reverse().map((e, i) => (
          <div key={i} className="font-mono opacity-70">
            {new Date(e.timestamp).toLocaleTimeString()} — {e.name}
            {e.props ? ` (${JSON.stringify(e.props)})` : ""}
          </div>
        ))}
      </div>
    </details>
  );
}
