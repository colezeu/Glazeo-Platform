// ══════════════════════════════════════════════
// GLAZEO — Auth Page
// Email login/logout + auto-create profile + org
// ══════════════════════════════════════════════
import { useState, useEffect } from "react"
import type { AuthGateway } from "../../auth/types"

type AuthPageProps = {
  auth: AuthGateway
  onAuthenticated: () => void
}

export default function AuthPage({ auth, onAuthenticated }: AuthPageProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [mode, setMode] = useState<"login" | "signup">("login")

  useEffect(() => {
    auth.getCurrentUser().then((user) => {
      if (user) onAuthenticated()
    })
  }, [auth, onAuthenticated])

  const handleSubmit = async (e: React.FormEvent) => {
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
            // Fallback: user can still use the app, just won't have demo data
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

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">GLAZEO</h1>
          <p className="text-neutral-500 mt-1">Platforma pentru proiecte din sticlă</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6 space-y-4">
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
      </div>
    </div>
  )
}
