// ══════════════════════════════════════════════
// GLAZEO — Landing Page (neautentificat)
// ══════════════════════════════════════════════
import { useState } from "react"
import type { AuthGateway } from "../../auth/types"

export default function LandingPage({
  auth,
  onAuthenticated,
}: {
  auth: AuthGateway
  onAuthenticated: () => void
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showDemo, setShowDemo] = useState(false)

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const user = await auth.signUp(email, password)
      const key = `profile_created_${user.id}`
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1")
        await auth.registerAccount(user.id, user.email ?? email)
      }
      onAuthenticated()
    } catch {
      // If user exists, try sign in
      try {
        await auth.signIn(email, password)
        onAuthenticated()
      } catch (loginErr) {
        setError(loginErr instanceof Error ? loginErr.message : String(loginErr))
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 leading-tight mb-6">
          Transformă un proiect cu sticlă{" "}
          <span className="text-[#1A56DB]">într-o ofertă executabilă</span>
        </h1>
        <p className="text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto mb-10">
          Fără zeci de telefoane și emailuri. Configurezi, vezi prețul, primești oferta — totul într-un singur loc.
        </p>

        {/* Signup form */}
        <div className="max-w-sm mx-auto bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6 mb-8">
          <form onSubmit={handleStart} className="space-y-4">
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-[#D1D5DB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/25 focus:border-[#1A56DB]"
              placeholder="email@companie.ro"
            />
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required minLength={6}
              className="w-full px-4 py-3 border border-[#D1D5DB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/25 focus:border-[#1A56DB]"
              placeholder="Parolă (minim 6 caractere)"
            />
            {error && (
              <div className="bg-[#FEF2F2] text-[#991B1B] text-sm p-3 rounded-lg">{error}</div>
            )}
            <button
              type="submit" disabled={loading}
              className="w-full py-3 text-sm font-semibold bg-[#1A56DB] text-white rounded-xl hover:bg-[#1E40AF] transition-colors disabled:opacity-50"
            >
              {loading ? "Se încarcă..." : "Începe gratuit"}
            </button>
          </form>
          <p className="text-xs text-neutral-400 text-center mt-4">
            Fără card de credit. Fără configurare complicată.
          </p>
        </div>

        {/* Demo preview link */}
        <button
          onClick={() => setShowDemo(!showDemo)}
          className="text-sm text-[#1A56DB] font-medium hover:underline"
        >
          {showDemo ? "Ascunde demo-ul" : "Vezi un proiect demo →"}
        </button>
      </div>

      {/* Demo Preview */}
      {showDemo && (
        <div className="max-w-4xl mx-auto px-4 pb-20">
          <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
            <div className="bg-[#EFF6FF] px-6 py-3 border-b border-[#1A56DB]/10 flex items-center justify-between">
              <span className="text-sm font-medium text-[#1D4ED8]">Demo — Vila Popescu</span>
              <span className="text-xs text-[#1D4ED8]/60">Proiect exemplu</span>
            </div>
            <div className="p-6 grid sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-neutral-400 uppercase">Configurări</p>
                <div className="bg-[#F8F9FB] rounded-lg p-3">
                  <p className="text-sm font-medium">Balustradă terasă</p>
                  <p className="text-xs text-neutral-500">12.5m · inox lucios · v3</p>
                </div>
                <div className="bg-[#F8F9FB] rounded-lg p-3">
                  <p className="text-sm font-medium">Cabină duș walk-in</p>
                  <p className="text-xs text-neutral-500">10mm clar · v1</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-neutral-400 uppercase">Oferte</p>
                <div className="bg-[#FFF8E1] rounded-lg p-3 border border-[#F59E0B]/20">
                  <p className="text-sm font-medium">OF-2026-0042</p>
                  <p className="text-xs text-[#B45309]">2.847 EUR · Expiră 23 Iul</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-neutral-400 uppercase">Comenzi</p>
                <div className="bg-[#ECFDF5] rounded-lg p-3 border border-[#059669]/20">
                  <p className="text-sm font-medium">CMD-2026-0035</p>
                  <p className="text-xs text-[#065F46]">Copertină · În producție</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="max-w-4xl mx-auto px-4 pb-20">
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: "⚙️", title: "Configurezi", desc: "Alege dimensiuni, materiale, feronerie. Vezi prețul în timp real." },
            { icon: "📋", title: "Primești oferta", desc: "Un singur click. Fără telefoane. Fără așteptare." },
            { icon: "📦", title: "Urmărești comanda", desc: "De la producție până la livrare. Totul într-un singur loc." },
          ].map((f) => (
            <div key={f.title} className="text-center p-6">
              <span className="text-3xl mb-3 block">{f.icon}</span>
              <h3 className="font-semibold text-neutral-900 mb-2">{f.title}</h3>
              <p className="text-sm text-neutral-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-8">
        <p className="text-xs text-neutral-400">
          Construit de Glass Associates ·{" "}
          <span className="text-[#1A56DB]">VitroVibe</span> Collection
        </p>
      </div>
    </div>
  )
}
