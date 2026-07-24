// ══════════════════════════════════════════════
// GLAZEO — Decision Maker Home (Phase 4A)
// Shell cu limbaj orientat spre decizie, nu produs.
// ══════════════════════════════════════════════

const INTENTS = [
  {
    key: "meeting_room_partition",
    label: "Compartimentare sală de ședințe",
    description: "Perete de sticlă pentru meeting room — păstrezi lumina naturală și delimitarea vizuală.",
    available: true, // 4B: DM-001 vertical slice
  },
  {
    key: "glass_balustrade",
    label: "Balustradă din sticlă",
    description: "Protecție perimetrală pentru terase, scări, balcoane — siguranță fără compromis estetic.",
    available: true, // DM-002
  },
  {
    key: "facade",
    label: "Fațadă",
    description: "Fațadă ventilată, curtain wall sau stick system.",
    available: false,
  },
]

export default function DecisionMakerHome({
  userName = "Arhitect",
  onNavigateDecision,
}: {
  userName?: string
  onNavigateDecision?: (key: string) => void
}) {
  const greeting = new Date().getHours() < 12 ? "Bună dimineața" : new Date().getHours() < 18 ? "Bună ziua" : "Bună seara"

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* ── Top Nav ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-200">
        <span className="font-semibold text-neutral-900 text-sm">GLAZEO</span>
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-[#EFF6FF] flex items-center justify-center text-xs font-medium text-[#1A56DB]">
            {userName[0]}
          </span>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* ── Greeting ── */}
        <div className="mb-10">
          <p className="text-sm text-neutral-500 mb-1">{greeting}, {userName}</p>
          <h1 className="text-2xl font-semibold text-neutral-900 leading-tight">
            Ce proiectezi?
          </h1>
          <p className="text-sm text-neutral-500 mt-2 max-w-lg">
            Definește contextul și primești opțiuni comparabile — nu o listă de produse.
          </p>
        </div>

        {/* ── Decision Tools ── */}
        <div className="mb-8">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">Decision Tools</p>
          <div className="flex flex-col gap-3">
            {INTENTS.map((intent) => (
              <div
                key={intent.key}
                onClick={intent.available && onNavigateDecision ? () => onNavigateDecision(intent.key) : undefined}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                  intent.available
                    ? "bg-white border-[#E5E7EB] hover:border-[#1A56DB]/40 hover:bg-[#F8FAFD] cursor-pointer"
                    : "bg-neutral-50 border-neutral-200 opacity-60 cursor-not-allowed"
                }`}
              >
                <span className="text-xl mt-0.5">
                  {intent.key === "meeting-room-partition" ? "🧱" :
                   intent.key === "facade" ? "🏢" : "🏗️"}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-neutral-900">{intent.label}</p>
                    {!intent.available && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-200 text-neutral-500 font-medium">
                        În curând
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">{intent.description}</p>
                </div>
                {intent.available && (
                  <span className="text-neutral-400 text-sm self-center">→</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Knowledge ── */}
        <div className="border-t border-neutral-200 pt-8">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">Knowledge</p>
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 hover:border-[#1A56DB]/30 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-lg">📚</span>
              <div>
                <p className="text-xs font-medium text-neutral-400 uppercase">Decision Memory</p>
                <p className="text-sm font-medium text-neutral-800">
                  Compartimentare sală de ședințe — clădire de patrimoniu
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Cum o cerință de „sticlă frameless" ascundea nevoia reală de continuitate spațială.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <p className="text-xs text-neutral-400 text-center mt-12">
          Decision Maker Experience — Glass Associates
        </p>
      </div>
    </div>
  )
}
