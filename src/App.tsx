// ══════════════════════════════════════════════
// GLAZEO Platform — App Shell (Gate 1)
// State-based routing: Home ⇄ Project Workspace
// ══════════════════════════════════════════════
import { useState } from "react";
import BuyerHome from "./features/buyer/BuyerHome";
import ProjectWorkspace from "./features/buyer/ProjectWorkspace";
import type { BuyerLevel } from "./foundation/tokens";

type View = { screen: "home" } | { screen: "project"; projectId: string };

export default function App() {
  const [level, setLevel] = useState<BuyerLevel>("verified");
  const [view, setView] = useState<View>({ screen: "home" });

  // Navigate to a project from Home
  const navigateToProject = (projectId: string) => setView({ screen: "project", projectId });
  // Back from Project to Home  
  const navigateHome = () => setView({ screen: "home" });

  return (
    <div>
      {/* Level switcher — Gate 1 demo only */}
      <div className="fixed top-16 right-4 z-50 flex gap-2">
        {(["public", "verified", "contracted"] as BuyerLevel[]).map((l) => (
          <button
            key={l}
            onClick={() => setLevel(l)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
              ${level === l ? "bg-[#1A56DB] text-white" : "bg-white text-neutral-600 border border-neutral-300 hover:bg-neutral-50"}`}
          >
            {l === "public" ? "Public" : l === "verified" ? "Verified" : "Contracted"}
          </button>
        ))}
        <span className="text-xs text-neutral-400 self-center ml-2 hidden sm:inline">Gate 1</span>
      </div>

      {view.screen === "home" ? (
        <BuyerHome buyerLevel={level} onNavigateProject={navigateToProject} />
      ) : (
        <ProjectWorkspace projectId={view.projectId} onBack={navigateHome} />
      )}
    </div>
  );
}
