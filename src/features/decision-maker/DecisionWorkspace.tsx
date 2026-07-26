// ══════════════════════════════════════════════
// GLAZEO — Decision Workspace (parametrized)
// Nu știe de DM-001 sau DM-002. Primește definition + runtime.
// ══════════════════════════════════════════════
import { useState, useMemo } from "react"
import type { DecisionModelDefinition, DecisionModelRuntime, DecisionOption, DecisionRecord } from "./shared/decisionModelTypes"

type Stage = "intent" | "context" | "options" | "comparison" | "decision"

interface Props<TContext> {
  definition: DecisionModelDefinition<TContext>
  runtime: DecisionModelRuntime<TContext>
  defaultContext: TContext
  onBack: () => void
}

export default function DecisionWorkspace<TContext>({
  definition,
  runtime,
  defaultContext,
  onBack,
}: Props<TContext>) {
  const [stage, setStage] = useState<Stage>("intent")
  const [context, setContext] = useState<TContext>(defaultContext)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [record, setRecord] = useState<DecisionRecord<TContext> | null>(null)

  // Motorul: evaluează opțiunile pe baza contextului curent
  const options = useMemo(() => runtime.evaluateOptions(context), [context, runtime])

  const recommendedOptions = options.filter((o) => o.status === "recommended")

  const handleContextChange = (field: keyof TContext & string, value: TContext[typeof field]) => {
    if (record !== null) {
      setRecord(null)
      setSelectedOptionId(null)
      setStage("options")
    }
    setContext((prev) => ({ ...prev, [field]: value }))
  }

  const handleSelectOption = (optionId: string) => {
    setSelectedOptionId(optionId)
  }

  const handleFinalize = () => {
    if (!selectedOptionId) return
    const rec = runtime.createDecisionRecord(context, options, selectedOptionId)
    setRecord(rec)
    setStage("decision")
  }

  const canProceedToDecision = selectedOptionId !== null

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* ── Top Bar ── */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-sm text-neutral-500 hover:text-neutral-700">
              ← Înapoi
            </button>
            <span className="font-semibold text-neutral-900 text-sm">{definition.title}</span>
          </div>
          {/* Stage indicator */}
          <div className="flex items-center gap-1">
            {(["intent", "context", "options", "comparison", "decision"] as Stage[]).map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    stage === s ? "bg-[#1A56DB]" : "bg-neutral-300"
                  }`}
                  title={s}
                />
                {i < 4 && <div className="w-4 h-px bg-neutral-300" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* ════════════════════════════════════════ */}
        {/* STAGE 1: INTENȚIE                       */}
        {/* ════════════════════════════════════════ */}
        {stage === "intent" && (
          <div>
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">Etapa 1/5</p>
            <h1 className="text-2xl font-semibold text-neutral-900 mb-3">{definition.title}</h1>
            <p className="text-neutral-600 mb-6">{definition.intention.description}</p>
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 mb-6">
              <p className="text-sm font-medium text-neutral-800 mb-2">💡 Știai?</p>
              <p className="text-sm text-neutral-600" dangerouslySetInnerHTML={{ __html: definition.intention.insight }} />
            </div>
            <button
              onClick={() => setStage("context")}
              className="px-6 py-3 text-sm font-medium bg-[#1A56DB] text-white rounded-xl hover:bg-[#1E40AF] transition-colors"
            >
              Definește contextul →
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* STAGE 2: CONTEXT                       */}
        {/* ════════════════════════════════════════ */}
        {stage === "context" && (
          <div>
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">Etapa 2/5</p>
            <h2 className="text-xl font-semibold text-neutral-900 mb-6">Contextul proiectului</h2>

            {definition.questions.map((q) => (
              <div key={q.id} className="mb-6 bg-white rounded-xl border border-[#E5E7EB] p-5">
                <p className="text-sm font-semibold text-neutral-900 mb-1">{q.question}</p>
                <p className="text-xs text-neutral-500 mb-3">{q.whyItMatters}</p>
                <div className="flex flex-wrap gap-2">
                  {q.options.map((opt: { value: unknown; label: string }, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => handleContextChange(q.id, opt.value as TContext[typeof q.id])}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        context[q.id] === opt.value
                          ? "bg-[#EFF6FF] border-[#1A56DB] text-[#1A56DB] font-medium"
                          : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex gap-3">
              <button onClick={() => setStage("intent")} className="text-sm text-neutral-500 hover:text-neutral-700">← Înapoi</button>
              <button onClick={() => setStage("options")}
                className="px-6 py-2 text-sm font-medium bg-[#1A56DB] text-white rounded-xl hover:bg-[#1E40AF] transition-colors">
                Vezi opțiunile →
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* STAGE 3: OPȚIUNI (generic)              */}
        {/* ════════════════════════════════════════ */}
        {stage === "options" && (
          <div>
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">Etapa 3/5</p>
            <h2 className="text-xl font-semibold text-neutral-900 mb-1">Opțiuni pentru proiectul tău</h2>
            <p className="text-sm text-neutral-500 mb-6">
              Pe baza contextului definit, {recommendedOptions.length} din {options.length} opțiuni sunt recomandate.
            </p>

            <div className="flex flex-col gap-4 mb-6">
              {options.map((opt) => (
                <OptionCard key={opt.id} option={opt} onSelect={() => { handleSelectOption(opt.id); setStage("comparison") }} />
              ))}
            </div>

            <button onClick={() => setStage("context")} className="text-sm text-neutral-500 hover:text-neutral-700">
              ← Modifică contextul
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* STAGE 4: COMPARAȚIE (generic)           */}
        {/* ════════════════════════════════════════ */}
        {stage === "comparison" && (
          <div>
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">Etapa 4/5</p>
            <h2 className="text-xl font-semibold text-neutral-900 mb-6">Comparație</h2>

            <ComparisonTable criteria={definition.criteria} options={options} selectedOptionId={selectedOptionId} />

            {selectedOptionId && (
              <div className="bg-[#EFF6FF] rounded-xl border border-[#1A56DB]/20 p-5 mb-6">
                <p className="text-xs font-medium text-[#1A56DB] uppercase tracking-wider mb-1">Opțiunea ta</p>
                <p className="text-sm font-semibold text-neutral-900">
                  {options.find((o) => o.id === selectedOptionId)?.name}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStage("options")} className="text-sm text-neutral-500 hover:text-neutral-700">← Alege altă opțiune</button>
              <button onClick={handleFinalize} disabled={!canProceedToDecision}
                className={`px-6 py-2 text-sm font-medium rounded-xl transition-colors ${
                  canProceedToDecision ? "bg-[#059669] text-white hover:bg-[#047857]" : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                }`}>
                Finalizează decizia →
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* STAGE 5: DECISION RECORD (generic)      */}
        {/* ════════════════════════════════════════ */}
        {stage === "decision" && record && <DecisionRecordView record={record} onBack={onBack} onRestart={() => { setRecord(null); setSelectedOptionId(null); setStage("context") }} />}
      </div>
    </div>
  )
}

// ── Sub-components (shared across all DMs) ──────────

function OptionCard({ option, onSelect }: { option: DecisionOption; onSelect: () => void }) {
  const isRecommended = option.status === "recommended"
  const isExcluded = option.status === "excluded"
  return (
    <div className={`bg-white rounded-xl border-2 p-5 transition-colors ${
      isRecommended ? "border-[#059669]/30 hover:border-[#059669]/60" :
      isExcluded ? "border-red-300 opacity-60" :
      "border-red-200 opacity-75"
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-neutral-900">{option.name}</h3>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              isRecommended ? "bg-[#ECFDF5] text-[#059669]" :
              isExcluded ? "bg-[#FEF2F2] text-[#991B1B]" :
              "bg-[#FFF7ED] text-[#9A3412]"
            }`}>
              {isRecommended ? "Recomandat" : isExcluded ? "Exclus" : "Nerecomandat"}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">{option.reason}</p>
        </div>
      </div>
      <p className="text-sm text-neutral-600 mb-3">{option.description}</p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs font-medium text-[#059669] mb-1">Avantaje</p>
          <ul className="text-xs text-neutral-600 space-y-0.5">
            {option.pros.map((p, i) => <li key={i}>✓ {p}</li>)}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium text-[#991B1B] mb-1">Limite</p>
          <ul className="text-xs text-neutral-600 space-y-0.5">
            {option.cons.map((c, i) => <li key={i}>✗ {c}</li>)}
          </ul>
        </div>
      </div>
      {option.tradeoffs.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-neutral-500 mb-1">Compromisuri</p>
          <ul className="text-xs text-neutral-500 space-y-0.5">
            {option.tradeoffs.map((t, i) => <li key={i}>⚠ {t}</li>)}
          </ul>
        </div>
      )}
      {(isRecommended || option.status === "not_recommended") && (
        <button onClick={onSelect} className="text-xs font-medium text-[#1A56DB] hover:text-[#1E40AF]">
          Selectează și compară →
        </button>
      )}
    </div>
  )
}

function ComparisonTable({ criteria, options, selectedOptionId }: {
  criteria: { id: string; label: string; description: string }[]
  options: DecisionOption[]
  selectedOptionId: string | null
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden mb-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50">
            <th className="text-left px-4 py-3 font-medium text-neutral-600">Criteriu</th>
            {options.map((opt) => (
              <th key={opt.id} className={`text-center px-3 py-3 font-medium ${
                opt.id === selectedOptionId ? "text-[#1A56DB]" : "text-neutral-600"
              }`}>
                {opt.id}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {criteria.map((crit) => (
            <tr key={crit.id} className="border-b border-neutral-100">
              <td className="px-4 py-3">
                <p className="font-medium text-neutral-800">{crit.label}</p>
                <p className="text-xs text-neutral-400">{crit.description}</p>
              </td>
              {options.map((opt) => (
                <td key={opt.id} className={`text-center px-3 py-3 ${opt.id === selectedOptionId ? "bg-[#EFF6FF]/50" : ""}`}>
                  <span className="text-lg">
                    {"⬤".repeat(opt.criteria[crit.id] || 0)}
                    <span className="text-neutral-200">
                      {"⬤".repeat(3 - (opt.criteria[crit.id] || 0))}
                    </span>
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DecisionRecordView<TContext>({ record, onBack, onRestart }: {
  record: DecisionRecord<TContext>
  onBack: () => void
  onRestart: () => void
}) {
  return (
    <div>
      <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">Etapa 5/5</p>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">✅</span>
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Decizie finalizată</h2>
          <p className="text-sm text-neutral-500">{record.id} · {new Date(record.decidedAt).toLocaleString("ro-RO")}</p>
        </div>
      </div>

      {record.selectedOptionId && (
        <div className="bg-white rounded-xl border border-[#059669]/30 p-5 mb-4">
          <p className="text-xs font-medium text-[#059669] uppercase tracking-wider mb-1">Soluția aleasă</p>
          <p className="text-sm font-semibold text-neutral-900">
            {record.options.find((o) => o.id === record.selectedOptionId)?.name}
          </p>
        </div>
      )}

      {record.acceptedTradeoffs.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 mb-4">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Compromisuri acceptate</p>
          <ul className="space-y-2">
            {record.acceptedTradeoffs.map((t, i) => (
              <li key={i} className="text-sm text-neutral-700"><span className="text-amber-500 mr-1">⚠</span>{t.description}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 mb-4">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Rezumat</p>
        <ul className="space-y-1">
          {record.lessons.map((l, i) => <li key={i} className="text-sm text-neutral-700">• {l}</li>)}
        </ul>
      </div>

      <div className="bg-[#FFF8E1] rounded-xl border border-[#F59E0B]/30 p-5 mb-6">
        <p className="text-xs font-medium text-[#B45309] uppercase tracking-wider mb-2">Pașii următori</p>
        <ul className="space-y-1">
          {record.nextSteps.map((s, i) => <li key={i} className="text-sm text-[#92400E]">→ {s}</li>)}
        </ul>
      </div>

      <div className="flex gap-3">
        <button onClick={onRestart} className="text-sm text-neutral-500 hover:text-neutral-700">← Reîncepe cu alt context</button>
        <button onClick={onBack} className="px-4 py-2 text-sm font-medium bg-neutral-100 text-neutral-700 rounded-xl hover:bg-neutral-200">Înapoi la proiecte</button>
      </div>
    </div>
  )
}
