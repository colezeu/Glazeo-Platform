// ══════════════════════════════════════════════
// GLAZEO — DM-001 Decision Engine (v2)
// Motor pur, determinist. Zero I/O, zero React.
// ══════════════════════════════════════════════
import type { DM001Context } from "./dm001Data"
import type { DecisionOption, DecisionRecord, EvaluationResult } from "../shared/decisionModelTypes"
import { OPTIONS_BASE } from "./dm001Data"

export function evaluateOptions(context: DM001Context): DecisionOption[] {
  return OPTIONS_BASE.map((opt) => {
    const result = evaluateOption(opt.id, context)
    return { ...opt, status: result.status, reason: result.reason }
  })
}

function evaluateOption(optionId: string, ctx: DM001Context): EvaluationResult {
  switch (optionId) {
    case "frameless": return evaluateFrameless(ctx)
    case "spider": return evaluateSpider(ctx)
    case "aluminum": return evaluateAluminum(ctx)
    default: return { status: "not_recommended", reason: "Opțiune necunoscută." }
  }
}

function evaluateFrameless(ctx: DM001Context): EvaluationResult {
  if (ctx.acousticNeed === "confidential") {
    return { status: "not_recommended", reason: "Acustica confidențială necesită sticlă laminată acustică și etanșări complete — frameless nu atinge Rw-ul necesar (max ~35)." }
  }
  if (ctx.ceilingType === "suspended") {
    return { status: "not_recommended", reason: "Tavanul suspendat nu oferă ancorare structurală sigură. Sistemul frameless necesită suport rigid la partea superioară." }
  }
  const notes: string[] = []
  if (ctx.acousticNeed === "conversational" || ctx.noiseNearby === true) {
    notes.push("Acustica va fi 'suficientă' (Rw ~33-35), nu 'excelentă'. Vocile se aud înfundat.")
  }
  if (ctx.ceilingType === "unknown") {
    notes.push("Tipul tavanului este necunoscut — verifică ancorarea înainte de execuție.")
  }
  const reason = notes.length > 0
    ? `Recomandat, cu observații: ${notes.join(" ")}`
    : "Recomandat: transparență maximă, lumină naturală, estetică minimalistă."
  return { status: "recommended", reason }
}

function evaluateSpider(ctx: DM001Context): EvaluationResult {
  if (ctx.doorTraffic === "intense") {
    return { status: "not_recommended", reason: "Punctele de fixare nu rezistă la trafic intens. Uzura accelerată a feroneriei point-fixed." }
  }
  if (ctx.noiseNearby === true) {
    return { status: "not_recommended", reason: "Etanșarea acustică a sistemelor point-fixed este slabă. Zgomotul ambiental va trece nestingherit." }
  }
  return { status: "recommended", reason: "Opțiune viabilă pentru un statement arhitectural industrial. Necesită întreținere regulată — punctele de fixare acumulează praf." }
}

function evaluateAluminum(ctx: DM001Context): EvaluationResult {
  if (ctx.acousticNeed === "confidential") {
    return { status: "recommended", reason: "Profilele aluminiu cu etanșări complete oferă cea mai bună izolare acustică. Singura opțiune viabilă pentru confidențialitate." }
  }
  if (ctx.ceilingType === "suspended") {
    return { status: "recommended", reason: "Sistemul structural este iertător cu denivelările. Profilele compensează abaterile fără detalii vizibile." }
  }
  return { status: "recommended", reason: "Opțiune solidă structural. Totuși, profilele verticale fragmentează vizual — nu e potrivit pentru spații sub 20m² unde transparența e prioritară." }
}

// ── Decision Record Factory ─────────────────────────

let decisionCounter = 0

export function createDecisionRecord(
  context: DM001Context,
  options: DecisionOption[],
  selectedOptionId: string,
): DecisionRecord<DM001Context> {
  const selected = options.find((o) => o.id === selectedOptionId)
  if (!selected) throw new Error(`Opțiunea ${selectedOptionId} nu există în lista evaluată.`)

  decisionCounter++
  const id = `DM-${String(decisionCounter).padStart(3, "0")}`

  const acceptedTradeoffs = selected.tradeoffs.map((t) => ({
    description: t,
    whyAccepted: "Acceptat în urma evaluării complete a opțiunilor disponibile.",
  }))

  const rejectedOptions = options.filter((o) => o.id !== selectedOptionId)
  const lessons = [
    `Opțiunea ${selected.name} a fost aleasă.`,
    ...rejectedOptions.map((o) => `${o.name} a fost respinsă: ${o.reason}`),
  ]

  const nextSteps = [
    "Verifică ancorarea tavanului cu un inginer structural.",
    "Confirmă dimensiunile exacte în teren (măsurători in-situ).",
    selected.id === "frameless"
      ? "Verifică denivelările — abatere >15mm necesită profil de compensare."
      : "Confirmă detaliile de montaj cu furnizorul de feronerie.",
    "Validează specificația cu contractorul înainte de comandă.",
  ]

  return {
    id,
    decidedAt: new Date().toISOString(),
    context: { ...context },
    options: options.map((o) => ({ ...o, criteria: { ...o.criteria }, pros: [...o.pros], cons: [...o.cons], tradeoffs: [...o.tradeoffs] })),
    selectedOptionId,
    acceptedTradeoffs,
    lessons,
    nextSteps,
  }
}
