// ══════════════════════════════════════════════
// GLAZEO — Auth Page
// Email login (password + OTP) + signup + auto-onboarding
// ══════════════════════════════════════════════
import { useState, useEffect } from "react"
import type { AuthGateway } from "../../auth/types"

type AuthPageProps = {
  auth: AuthGateway
  onAuthenticated: () => void
}

type LoginMethod = "password" | "otp"
type OtpStage = "idle" | "sent" | "verifying"

export default function AuthPage({ auth, onAuthenticated }: AuthPageProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [otpToken, setOtpToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("password")
  const [otpStage, setOtpStage] = useState<OtpStage>("idle")

  useEffect(() => {
    auth.getCurrentUser().then((user) => {
      if (user) onAuthenticated()
    })
  }, [auth, onAuthenticated])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const user = mode === "login"
        ? await auth.signIn(email, password)
        : await auth.signUp(email, password)

      if (mode === "signup" && user) {
        const key = `profile_created_${user.id}`
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1")
          try {
            await auth.registerAccount(user.id, user.email ?? email)
          } catch (rpcErr) {
            console.error("Onboarding failed:", rpcErr)
          }
        }
      }

      onAuthenticated()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await auth.sendOtp(email)
      setOtpStage("sent")
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    setOtpStage("verifying")

    try {
      await auth.verifyOtp(email, otpToken)
      onAuthenticated()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setOtpStage("sent") // allow retry
    } finally {
      setLoading(false)
    }
  }

  const resetOtp = () => {
    setOtpStage("idle")
    setOtpToken("")
  }

  const switchMethod = (method: LoginMethod) => {
    setLoginMethod(method)
    setError("")
    setOtpStage("idle")
    setOtpToken("")
  }

  // ─── OTP: code entry screen ─────────────────────────
  if (loginMethod === "otp" && otpStage !== "idle") {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center px-4">
        <div className="max-w-sm w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-neutral-900">GLAZEO</h1>
            <p className="text-neutral-500 mt-1">Verifică codul primit pe email</p>
          </div>

          <form onSubmit={handleVerifyOtp} className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6 space-y-4">
            <p className="text-sm text-neutral-500 text-center">
              Am trimis un cod de 6 cifre la <strong>{email}</strong>
            </p>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Cod verificare</label>
              <input
                type="text" inputMode="numeric" autoComplete="one-time-code"
                value={otpToken} onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required minLength={6} maxLength={6} autoFocus
                className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm text-center tracking-[0.5em] text-lg
                  focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/25 focus:border-[#1A56DB]"
                placeholder="000000"
              />
            </div>

            {error && (
              <div className="bg-[#FEF2F2] text-[#991B1B] text-sm p-3 rounded-lg">{error}</div>
            )}

            <button
              type="submit" disabled={loading || otpToken.length !== 6}
              className="w-full py-2.5 text-sm font-medium bg-[#1A56DB] text-white rounded-lg
                hover:bg-[#1E40AF] transition-colors disabled:opacity-50"
            >
              {loading ? "Se verifică..." : "Verifică"}
            </button>

            <p className="text-center text-sm text-neutral-500">
              <button type="button" onClick={resetOtp}
                className="text-[#1A56DB] font-medium hover:underline">
                ← Înapoi la email
              </button>
            </p>
          </form>
        </div>
      </div>
    )
  }

  // ─── Main login form ────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">GLAZEO</h1>
          <p className="text-neutral-500 mt-1">Platforma pentru proiecte din sticlă</p>
        </div>

        {/* ── Method toggle ── */}
        <div className="flex mb-3 bg-[#E5E7EB] rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => switchMethod("password")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              loginMethod === "password"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            Parolă
          </button>
          <button
            type="button"
            onClick={() => switchMethod("otp")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              loginMethod === "otp"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            Cod email
          </button>
        </div>

        {loginMethod === "password" ? (
          /* ── Password form ── */
          <form onSubmit={handlePasswordSubmit} className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required autoFocus
                className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/25 focus:border-[#1A56DB]
                  placeholder:text-neutral-400"
                placeholder="cornel@glass.associates"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Parolă</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required minLength={6}
                className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/25 focus:border-[#1A56DB]"
                placeholder="••••••"
              />
            </div>

            {error && (
              <div className="bg-[#FEF2F2] text-[#991B1B] text-sm p-3 rounded-lg">{error}</div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 text-sm font-medium bg-[#1A56DB] text-white rounded-lg
                hover:bg-[#1E40AF] transition-colors disabled:opacity-50"
            >
              {loading ? "Se procesează..." : mode === "login" ? "Autentificare" : "Creează cont"}
            </button>

            <p className="text-center text-sm text-neutral-500">
              {mode === "login" ? "Nu ai cont?" : "Ai deja cont?"}{" "}
              <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-[#1A56DB] font-medium hover:underline">
                {mode === "login" ? "Înregistrează-te" : "Autentifică-te"}
              </button>
            </p>
          </form>
        ) : (
          /* ── OTP form (email entry) ── */
          <form onSubmit={handleSendOtp} className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6 space-y-4">
            <p className="text-sm text-neutral-500 text-center">
              Introdu email-ul și primești un cod de verificare. Fără parole.
            </p>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required autoFocus
                className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/25 focus:border-[#1A56DB]
                  placeholder:text-neutral-400"
                placeholder="cornel@glass.associates"
              />
            </div>

            {error && (
              <div className="bg-[#FEF2F2] text-[#991B1B] text-sm p-3 rounded-lg">{error}</div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 text-sm font-medium bg-[#1A56DB] text-white rounded-lg
                hover:bg-[#1E40AF] transition-colors disabled:opacity-50"
            >
              {loading ? "Se trimite..." : "Trimite cod"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
