// ══════════════════════════════════════════════
// GLAZEO Platform — App Shell
// ══════════════════════════════════════════════
import { useState, useEffect, useCallback, useRef } from "react"
import type { AuthGateway } from "./auth/types"
import type { ExperienceGateway, ExperienceResolution } from "./experience/types"
import { resolveExperience } from "./experience/resolveExperience"
import LandingPage from "./features/buyer/LandingPage"
import AuthPage from "./features/buyer/AuthPage"
import BuyerHome from "./features/buyer/BuyerHome"
import DecisionMakerHome from "./features/decision-maker/DecisionMakerHome"
import DecisionWorkspace from "./features/decision-maker/DecisionWorkspace"
import { dm001Definition, dm001Runtime } from "./features/decision-maker/dm001/dm001Definition"
import { dm002Definition, dm002Runtime, dm002DefaultContext } from "./features/decision-maker/dm002/dm002Definition"
import { dm003Definition, dm003Runtime, dm003DefaultContext } from "./features/decision-maker/dm003/dm003Definition"
import type { DM001Context } from "./features/decision-maker/dm001/dm001Data"
import ProjectWorkspace from "./features/buyer/ProjectWorkspace"
import { FeedbackWidget, GlazeoErrorBoundary, AnalyticsDebug } from "./app/feedback"
import { Analytics } from "./app/feedback"
import type { BuyerLevel } from "./foundation/tokens"
import type { DecisionRecordRepository } from "./persistence/DecisionRecordRepository"

type View = { screen: "landing" } | { screen: "auth" } | { screen: "home" } | { screen: "project"; projectId: string } | { screen: "dm-decision"; modelId: string } | { screen: "dm-record"; recordId: string }

type InitPhase = { phase: "checking_auth" } | { phase: "resolving_experience" } | { phase: "experience_error"; message: string } | { phase: "ready" }

export default function App({ auth, experience, repo }: { auth: AuthGateway; experience: ExperienceGateway; repo: DecisionRecordRepository }) {
  const [view, setView] = useState<View>({ screen: "landing" })
  const [level, setLevel] = useState<BuyerLevel>("verified")
  const [initPhase, setInitPhase] = useState<InitPhase>({ phase: "checking_auth" })
  const [experienceState, setExperienceState] = useState<ExperienceResolution>({ status: "unauthenticated" })
  const requestIdRef = useRef(0)

  const resolveAfterAuth = useCallback(async (id: string) => {
    const requestId = ++requestIdRef.current
    setInitPhase({ phase: "resolving_experience" })
    try {
      const profileResult = await experience.getProfile(id)
      if (requestId !== requestIdRef.current) return
      const resolution = resolveExperience(profileResult)
      setExperienceState(resolution)
      if (resolution.status === "resolved") { setView({ screen: "home" }); Analytics.login() }
      setInitPhase({ phase: "ready" })
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setInitPhase({ phase: "experience_error", message: err instanceof Error ? err.message : "Gateway error" })
    }
  }, [experience])

  useEffect(() => {
    setInitPhase({ phase: "checking_auth" })
    const requestId = ++requestIdRef.current
    auth.getCurrentUser().then(async (user) => {
      if (requestId !== requestIdRef.current) return
      if (user) { await resolveAfterAuth(user.id) }
      else { setInitPhase({ phase: "ready" }) }
    })
  }, [auth, resolveAfterAuth])

  const handleLogout = useCallback(async () => {
    ++requestIdRef.current
    await auth.signOut()
    setExperienceState({ status: "unauthenticated" })
    setView({ screen: "landing" })
    setInitPhase({ phase: "ready" })
  }, [auth])

  const handleAuthenticated = useCallback(async () => {
    const user = await auth.getCurrentUser()
    if (user) { await resolveAfterAuth(user.id) }
  }, [auth, resolveAfterAuth])

  if (initPhase.phase === "checking_auth") {
    return <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center"><div className="text-center"><div className="animate-spin h-8 w-8 border-2 border-[#1A56DB] border-t-transparent rounded-full mx-auto mb-3" /><p className="text-neutral-500 text-sm">Verificare autentificare...</p></div></div>
  }
  if (initPhase.phase === "resolving_experience") {
    return <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center"><div className="text-center"><div className="animate-spin h-8 w-8 border-2 border-[#1A56DB] border-t-transparent rounded-full mx-auto mb-3" /><p className="text-neutral-500 text-sm">Se încarcă experiența...</p></div></div>
  }
  if (initPhase.phase === "experience_error") {
    return <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center"><div className="text-center max-w-md px-4"><span className="text-4xl mb-4 block">⚠️</span><h2 className="text-xl font-semibold text-neutral-900 mb-2">Eroare la încărcarea experienței</h2><p className="text-neutral-500 text-sm mb-4">{initPhase.message}</p><button onClick={() => { const requestId = ++requestIdRef.current; setInitPhase({ phase: "checking_auth" }); auth.getCurrentUser().then(async (user) => { if (requestId !== requestIdRef.current) return; if (user) { resolveAfterAuth(user.id) } else { setInitPhase({ phase: "ready" }) } }) }} className="px-4 py-2 text-sm font-medium bg-[#1A56DB] text-white rounded-lg hover:bg-[#1E40AF] transition-colors">Reîncearcă</button></div></div>
  }

  if (experienceState.status === "unauthenticated") {
    return (
      <GlazeoErrorBoundary>
        {view.screen === "landing" && <LandingPage auth={auth} onAuthenticated={() => { Analytics.signup(); setView({ screen: "auth" }) }} />}
        {view.screen === "auth" && <AuthPage auth={auth} onAuthenticated={handleAuthenticated} />}
      </GlazeoErrorBoundary>
    )
  }
  if (experienceState.status === "needs_onboarding") {
    return (
      <GlazeoErrorBoundary>
        <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center"><div className="text-center max-w-md px-4"><span className="text-4xl mb-4 block">🔧</span><h2 className="text-xl font-semibold text-neutral-900 mb-2">Contul tău nu este configurat</h2><p className="text-neutral-500 mb-1">{experienceState.reason}</p><p className="text-sm text-neutral-400">Contactează Glass Associates pentru a-ți configura experiența.</p></div></div>
        <button onClick={handleLogout} className="fixed top-4 right-4 px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-700 bg-white rounded-lg border border-neutral-200">Sign out</button>
        {view.screen !== "landing" && <FeedbackWidget />}
      </GlazeoErrorBoundary>
    )
  }
  if (experienceState.status === "needs_selection") {
    return (
      <GlazeoErrorBoundary>
        <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center"><div className="text-center max-w-md px-4"><span className="text-4xl mb-4 block">👤</span><h2 className="text-xl font-semibold text-neutral-900 mb-2">Alege experiența</h2><p className="text-neutral-500 mb-4">Ai mai multe experiențe disponibile.</p><div className="flex flex-col gap-2">{experienceState.available.map((exp) => (<div key={exp} className="px-4 py-2 bg-white rounded-lg border border-neutral-200 text-neutral-500 text-sm">{exp === "decision_maker" ? "🏗️ Decision Maker" : exp === "buyer" ? "🛒 Buyer" : exp === "builder" ? "🔨 Builder" : exp === "admin" ? "⚙️ Admin" : exp}</div>))}</div></div></div>
        <button onClick={handleLogout} className="fixed top-4 right-4 px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-700 bg-white rounded-lg border border-neutral-200">Sign out</button>
        {view.screen !== "landing" && <FeedbackWidget />}
      </GlazeoErrorBoundary>
    )
  }

  const resolvedExperience = experienceState.experience
  return (
    <GlazeoErrorBoundary>
      <div>
        {view.screen !== "landing" && view.screen !== "auth" && (
          <div className="fixed top-16 right-4 z-40 flex gap-2">
            {(["public", "verified", "contracted"] as BuyerLevel[]).map((l) => (
              <button key={l} onClick={() => setLevel(l)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${level === l ? "bg-[#1A56DB] text-white" : "bg-white text-neutral-600 border border-neutral-300 hover:bg-neutral-50"}`}>{l === "public" ? "Public" : l === "verified" ? "Verified" : "Contracted"}</button>
            ))}
            <button onClick={handleLogout} className="px-3 py-1.5 text-xs font-medium bg-[#FEF2F2] text-[#991B1B] rounded-lg hover:bg-[#FEE2E2] border border-[#EF4444]/30">Logout</button>
          </div>
        )}
        {resolvedExperience === "buyer" && view.screen === "home" && <BuyerHome buyerLevel={level} onNavigateProject={(projectId) => setView({ screen: "project", projectId })} />}
        {resolvedExperience === "buyer" && view.screen === "project" && <ProjectWorkspace projectId={view.projectId} onBack={() => setView({ screen: "home" })} />}
        {resolvedExperience === "decision_maker" && view.screen === "home" && <DecisionMakerHome onNavigateDecision={(modelId) => setView({ screen: "dm-decision", modelId })} />}
        {resolvedExperience === "decision_maker" && view.screen === "dm-decision" && view.modelId === "meeting_room_partition" && (
          <DecisionWorkspace definition={dm001Definition} runtime={dm001Runtime} defaultContext={{ ceilingType: "unknown", doorTraffic: "unknown", acousticNeed: "visual_only", noiseNearby: null } as DM001Context} repo={repo} onBack={() => setView({ screen: "home" })} />
        )}
        {resolvedExperience === "decision_maker" && view.screen === "dm-decision" && view.modelId === "glass_balustrade" && (
          <DecisionWorkspace definition={dm002Definition} runtime={dm002Runtime} defaultContext={dm002DefaultContext} repo={repo} onBack={() => setView({ screen: "home" })} />
        )}
        {resolvedExperience === "decision_maker" && view.screen === "dm-decision" && view.modelId === "facade_glazing_strategy" && (
          <DecisionWorkspace definition={dm003Definition} runtime={dm003Runtime} defaultContext={dm003DefaultContext} repo={repo} onBack={() => setView({ screen: "home" })} />
        )}
        {(resolvedExperience === "builder" || resolvedExperience === "admin") && view.screen === "home" && (
          <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center"><div className="text-center max-w-md px-4"><span className="text-4xl mb-4 block">🚧</span><h2 className="text-xl font-semibold text-neutral-900 mb-2">{resolvedExperience === "builder" ? "Builder" : "Admin"}</h2><p className="text-neutral-500">Această experiență nu este încă disponibilă.</p></div></div>
        )}
        {view.screen !== "landing" && <FeedbackWidget />}
        <AnalyticsDebug />
      </div>
    </GlazeoErrorBoundary>
  )
}
