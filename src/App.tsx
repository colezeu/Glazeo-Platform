// ══════════════════════════════════════════════
// GLAZEO Platform — App Shell (Gate 4 + Experience Resolution)
// Landing → Auth → Experience Resolution → Workspace → Project
// ══════════════════════════════════════════════
import { useState, useEffect } from "react"
import type { AuthGateway } from "./auth/types"
import type { ExperienceGateway, ExperienceResolution } from "./experience/types"
import { resolveExperience } from "./experience/resolveExperience"
import LandingPage from "./features/buyer/LandingPage"
import AuthPage from "./features/buyer/AuthPage"
import BuyerHome from "./features/buyer/BuyerHome"
import ProjectWorkspace from "./features/buyer/ProjectWorkspace"
import { FeedbackWidget, GlazeoErrorBoundary, AnalyticsDebug } from "./app/feedback"
import { Analytics } from "./app/feedback"
import type { BuyerLevel } from "./foundation/tokens"

type View = { screen: "landing" } | { screen: "auth" } | { screen: "home" } | { screen: "project"; projectId: string }

export default function App({ auth, experience }: { auth: AuthGateway; experience: ExperienceGateway }) {
  const [view, setView] = useState<View>({ screen: "landing" })
  const [level, setLevel] = useState<BuyerLevel>("verified")
  const [initializing, setInitializing] = useState(true)
  const [experienceState, setExperienceState] = useState<ExperienceResolution>({ status: "unauthenticated" })

  useEffect(() => {
    auth.getCurrentUser().then(async (user) => {
      if (user) {
        const profileResult = await experience.getProfile(user.id)
        const resolution = resolveExperience(profileResult)
        setExperienceState(resolution)

        if (resolution.status === "resolved") {
          setView({ screen: "home" })
          Analytics.login()
        }
        // needs_onboarding, needs_selection — rămân pe landing
        // (placeholder până la implementarea ecranelor dedicate)
      }
      setInitializing(false)
    })
  }, [auth, experience])

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

  // ── Experience state: nu e autentificat ──
  if (experienceState.status === "unauthenticated") {
    return (
      <GlazeoErrorBoundary>
        {view.screen === "landing" && (
          <LandingPage auth={auth} onAuthenticated={() => { Analytics.signup(); setView({ screen: "auth" }); }} />
        )}
        {view.screen === "auth" && (
          <AuthPage auth={auth} onAuthenticated={() => {
            // Re-trigger experience resolution after auth
            auth.getCurrentUser().then(async (user) => {
              if (user) {
                const profileResult = await experience.getProfile(user.id)
                const resolution = resolveExperience(profileResult)
                setExperienceState(resolution)
                if (resolution.status === "resolved") {
                  setView({ screen: "home" })
                  Analytics.login()
                }
              }
            })
          }} />
        )}
      </GlazeoErrorBoundary>
    )
  }

  // ── Experience state: needs_onboarding ──
  if (experienceState.status === "needs_onboarding") {
    return (
      <GlazeoErrorBoundary>
        <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <span className="text-4xl mb-4 block">🔧</span>
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Contul tău nu este configurat</h2>
            <p className="text-neutral-500 mb-1">{experienceState.reason}</p>
            <p className="text-sm text-neutral-400">
              Contactează Glass Associates pentru a-ți configura experiența.
            </p>
          </div>
        </div>
        {view.screen !== "landing" && <FeedbackWidget />}
      </GlazeoErrorBoundary>
    )
  }

  // ── Experience state: needs_selection ──
  if (experienceState.status === "needs_selection") {
    return (
      <GlazeoErrorBoundary>
        <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <span className="text-4xl mb-4 block">👤</span>
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Alege experiența</h2>
            <p className="text-neutral-500 mb-4">
              Ai mai multe experiențe disponibile. Selectează cu care vrei să intri.
            </p>
            <div className="flex flex-col gap-2">
              {experienceState.available.map((exp) => (
                <div key={exp} className="px-4 py-2 bg-white rounded-lg border border-neutral-200 text-neutral-500 text-sm">
                  {exp === "decision_maker" ? "🏗️ Decision Maker (în curând)" :
                   exp === "buyer" ? "🛒 Buyer" :
                   exp === "builder" ? "🔨 Builder (în curând)" :
                   exp === "admin" ? "⚙️ Admin (în curând)" : exp}
                </div>
              ))}
            </div>
          </div>
        </div>
        {view.screen !== "landing" && <FeedbackWidget />}
      </GlazeoErrorBoundary>
    )
  }

  // ── Experience resolved ──
  const resolvedExperience = experienceState.experience

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
              onClick={async () => { await auth.signOut(); setExperienceState({ status: "unauthenticated" }); setView({ screen: "landing" }); }}
              className="px-3 py-1.5 text-xs font-medium bg-[#FEF2F2] text-[#991B1B] rounded-lg hover:bg-[#FEE2E2] border border-[#EF4444]/30">
              Logout
            </button>
          </div>
        )}

        {/* ── Buyer Experience (singura implementată) ── */}
        {resolvedExperience === "buyer" && view.screen === "home" && (
          <BuyerHome
            buyerLevel={level}
            onNavigateProject={(projectId) => setView({ screen: "project", projectId })}
          />
        )}
        {resolvedExperience === "buyer" && view.screen === "project" && (
          <ProjectWorkspace
            projectId={view.projectId}
            onBack={() => setView({ screen: "home" })}
          />
        )}

        {/* ── Placeholder: experiențe neimplementate ── */}
        {resolvedExperience !== "buyer" && view.screen === "home" && (
          <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
            <div className="text-center max-w-md px-4">
              <span className="text-4xl mb-4 block">🚧</span>
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                {resolvedExperience === "decision_maker" ? "Decision Maker" :
                 resolvedExperience === "builder" ? "Builder" :
                 resolvedExperience === "admin" ? "Admin" : resolvedExperience}
              </h2>
              <p className="text-neutral-500">
                Această experiență nu este încă disponibilă. Revino curând.
              </p>
            </div>
          </div>
        )}

        {/* Global feedback widget */}
        {view.screen !== "landing" && <FeedbackWidget />}
        {/* Analytics debug (dev only) */}
        <AnalyticsDebug />
      </div>
    </GlazeoErrorBoundary>
  )
}
