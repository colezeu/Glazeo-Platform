// ══════════════════════════════════════════════
// GLAZEO Platform — App Shell (Gate 4)
// Landing → Auth → Workspace → Project
// ══════════════════════════════════════════════
import { useState, useEffect } from "react"
import type { AuthGateway } from "./auth/types"
import LandingPage from "./features/buyer/LandingPage"
import AuthPage from "./features/buyer/AuthPage"
import BuyerHome from "./features/buyer/BuyerHome"
import ProjectWorkspace from "./features/buyer/ProjectWorkspace"
import { FeedbackWidget, GlazeoErrorBoundary, AnalyticsDebug } from "./app/feedback"
import { Analytics } from "./app/feedback"
import type { BuyerLevel } from "./foundation/tokens"

type View = { screen: "landing" } | { screen: "auth" } | { screen: "home" } | { screen: "project"; projectId: string }

export default function App({ auth }: { auth: AuthGateway }) {
  const [view, setView] = useState<View>({ screen: "landing" })
  const [level, setLevel] = useState<BuyerLevel>("verified")
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    auth.getCurrentUser().then((user) => {
      if (user) {
        setView({ screen: "home" })
        Analytics.login()
      }
      setInitializing(false)
    })
  }, [auth])

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-[#1A56DB] border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-neutral-500 text-sm">Se încarcă...</p>
        </div>
      </div>
    )
  }

  return (
    <GlazeoErrorBoundary>
      <div>
        {/* Level switcher (dev only) */}
        {view.screen !== "landing" && view.screen !== "auth" && (
          <div className="fixed top-16 right-4 z-40 flex gap-2">
            {(["public", "verified", "contracted"] as BuyerLevel[]).map((l) => (
              <button key={l} onClick={() => setLevel(l)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                  ${level === l ? "bg-[#1A56DB] text-white" : "bg-white text-neutral-600 border border-neutral-300 hover:bg-neutral-50"}`}>
                {l === "public" ? "Public" : l === "verified" ? "Verified" : "Contracted"}
              </button>
            ))}
            <button
              onClick={async () => { await auth.signOut(); setView({ screen: "landing" }); }}
              className="px-3 py-1.5 text-xs font-medium bg-[#FEF2F2] text-[#991B1B] rounded-lg hover:bg-[#FEE2E2] border border-[#EF4444]/30">
              Logout
            </button>
          </div>
        )}

        {view.screen === "landing" && (
          <LandingPage auth={auth} onAuthenticated={() => { Analytics.signup(); setView({ screen: "home" }); }} />
        )}
        {view.screen === "auth" && (
          <AuthPage auth={auth} onAuthenticated={() => setView({ screen: "home" })} />
        )}
        {view.screen === "home" && (
          <BuyerHome
            buyerLevel={level}
            onNavigateProject={(projectId) => setView({ screen: "project", projectId })}
          />
        )}
        {view.screen === "project" && (
          <ProjectWorkspace
            projectId={view.projectId}
            onBack={() => setView({ screen: "home" })}
          />
        )}

        {/* Global feedback widget */}
        {view.screen !== "landing" && <FeedbackWidget />}
        {/* Analytics debug (dev only) */}
        <AnalyticsDebug />
      </div>
    </GlazeoErrorBoundary>
  )
}
