// ══════════════════════════════════════════════
// GLAZEO Platform — App Shell (Gate 1 Demo)
// ══════════════════════════════════════════════
import { useState } from "react";
import BuyerHome from "./features/buyer/BuyerHome";
import type { BuyerLevel } from "./foundation/tokens";

export default function App() {
  const [level, setLevel] = useState<BuyerLevel>("verified");

  return (
    <div>
      {/* Level switcher — doar pentru demo Gate 1 */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
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
        <span className="text-xs text-neutral-400 self-center ml-2 hidden sm:inline">Gate 1 Demo</span>
      </div>

      <BuyerHome buyerLevel={level} />
    </div>
  );
}
