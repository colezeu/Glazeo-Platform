// ══════════════════════════════════════════════
// GLAZEO — Auth Page
// Email login/logout + auto-create profile + org
// ══════════════════════════════════════════════
import { useState, useEffect } from "react";
import { supabase } from "../../app/supabase";

type AuthPageProps = {
  onAuthenticated: () => void;
};

export default function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) onAuthenticated();
    });
  }, [onAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fn = mode === "login"
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password });

    const { data, error: err } = await fn;

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const key = `profile_created_${data.user.id}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");

        // Atomic onboarding via RPC
        const { error: rpcErr } = await supabase.rpc("rpc_initialize_account", {
          p_user_id: data.user.id,
          p_email: data.user.email ?? email,
          p_full_name: email.split("@")[0],
        });

        if (rpcErr) {
          console.error("Onboarding failed:", rpcErr);
          // Fallback: user can still use the app, just won't have demo data
        }
      }

      onAuthenticated();
    }

    setLoading(false);
  };

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
  );
}
