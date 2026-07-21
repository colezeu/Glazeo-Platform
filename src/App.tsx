// ══════════════════════════════════════════════
// GLAZEO Platform — App Shell (Gate 3)
// Auth → Workspace → Project
// ══════════════════════════════════════════════
import { useState, useEffect } from "react";
import { supabase } from "./app/supabase";
import AuthPage from "./features/buyer/AuthPage";
import BuyerHome from "./features/buyer/BuyerHome";
import ProjectWorkspace from "./features/buyer/ProjectWorkspace";
import type { BuyerLevel } from "./foundation/tokens";

type View = { screen: "auth" } | { screen: "home" } | { screen: "project"; projectId: string };

export default function App() {
  const [view, setView] = useState<View>({ screen: "auth" });
  const [level, setLevel] = useState<BuyerLevel>("verified");
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setView({ screen: "home" });
      setInitializing(false);
    });
  }, []);

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-[#1A56DB] border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-neutral-500 text-sm">Se încarcă...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Level switcher (dev only) */}
      {view.screen !== "auth" && (
        <div className="fixed top-16 right-4 z-50 flex gap-2">
          {(["public", "verified", "contracted"] as BuyerLevel[]).map((l) => (
            <button key={l} onClick={() => setLevel(l)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                ${level === l ? "bg-[#1A56DB] text-white" : "bg-white text-neutral-600 border border-neutral-300 hover:bg-neutral-50"}`}>
              {l === "public" ? "Public" : l === "verified" ? "Verified" : "Contracted"}
            </button>
          ))}
          <button
            onClick={async () => { await supabase.auth.signOut(); setView({ screen: "auth" }); }}
            className="px-3 py-1.5 text-xs font-medium bg-[#FEF2F2] text-[#991B1B] rounded-lg hover:bg-[#FEE2E2] border border-[#EF4444]/30">
            Logout
          </button>
        </div>
      )}

      {view.screen === "auth" && (
        <AuthPage onAuthenticated={() => setView({ screen: "home" })} />
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
    </div>
  );
}
