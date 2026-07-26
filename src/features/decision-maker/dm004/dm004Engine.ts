// ══════════════════════════════════════════════
// GLAZEO — DM-004 Engine (Cabină de duș walk-in)
// constraints → preferences → recommendation
// ══════════════════════════════════════════════
import type { DM004Context } from "./dm004Data"
import type { DecisionOption, DecisionRecord, EvaluationResult } from "../shared/decisionModelTypes"
import { OPTIONS_BASE } from "./dm004Data"

export function evaluateOptions(context: DM004Context): DecisionOption[] {
  return OPTIONS_BASE.map((opt) => {
    const result = evaluateOption(opt.id, context)
    return { ...opt, status: result.status, reason: result.reason }
  })
}

function evaluateOption(optionId: string, ctx: DM004Context): EvaluationResult {
  switch (optionId) {
    case "frameless": return evaluateFrameless(ctx)
    case "stabilized": return evaluateStabilized(ctx)
    case "enclosed": return evaluateEnclosed(ctx)
    default: return { status: "not_recommended", reason: "Opțiune necunoscută." }
  }
}

// ── Frameless ───────────────────────────────────────

function evaluateFrameless(ctx: DM004Context): EvaluationResult {
  // Constraint: ușă glisantă incompatibilă cu frameless
  if (ctx.accessType === "sliding_door") {
    return { status: "excluded", reason: "Frameless nu suportă ușă glisantă — profilul de ghidaj contrazice designul fără profil." }
  }
  // Constraint: denivelări severe
  if (ctx.surfaceCondition === "uneven") {
    return { status: "excluded", reason: "Suprafețele cu denivelări nu permit ancorarea sigură a panoului frameless. Este necesar profil sau stabilizator." }
  }
  // Preference: întreținere
  if (ctx.maintenance === "minimal") {
    return { status: "not_recommended", reason: "Frameless necesită curățare frecventă și tratament anti-calcificare. Pentru întreținere minimă, opțiunea cu ușă reduce expunerea la apă." }
  }
  // Preference: accesibilitate
  if (ctx.accessibility === "accessible") {
    return { status: "not_recommended", reason: "Fără ușă, intrarea/ieșirea poate necesita spațiu de manevră mai mare. Ușa glisantă oferă acces mai facil." }
  }
  return { status: "recommended", reason: "Recomandat: estetică maximă, ideal pentru nișe cu suprafețe plane." }
}

// ── Stabilized ──────────────────────────────────────

function evaluateStabilized(ctx: DM004Context): EvaluationResult {
  // Constraint: geometrie insulă
  if (ctx.geometry === "island") {
    return { status: "excluded", reason: "Bara de stabilizare necesită 2 pereți opuși. Geometria insulă nu oferă acest suport." }
  }
  // Constraint: ușă glisantă
  if (ctx.accessType === "sliding_door") {
    return { status: "excluded", reason: "Bara de stabilizare nu este compatibilă cu ușa glisantă — ghidajele interferează." }
  }
  // Preference: walk-in cu denivelări
  if (ctx.surfaceCondition === "uneven" && ctx.accessType === "walk_in") {
    return { status: "recommended", reason: "Recomandat: bara de stabilizare compensează denivelările și oferă robustețe suplimentară." }
  }
  return { status: "recommended", reason: "Recomandat: echilibru bun între estetică și robustețe." }
}

// ── Enclosed ────────────────────────────────────────

function evaluateEnclosed(_ctx: DM004Context): EvaluationResult {
  // Cea mai flexibilă opțiune — aproape întotdeauna recomandată
  return { status: "recommended", reason: "Recomandat: control maxim al apei, compatibil cu toate geometriile și cerințele de accesibilitate." }
}

// ── Decision Record Factory ─────────────────────────

let decisionCounter = 300

export function createDecisionRecord(
  context: DM004Context,
  options: DecisionOption[],
  selectedOptionId: string,
): DecisionRecord<DM004Context> {
  const selected = options.find((o) => o.id === selectedOptionId)
  if (!selected) throw new Error(`Opțiunea ${selectedOptionId} nu există.`)

  decisionCounter++
  const id = `DM-${decisionCounter}`

  return {
    id,
    decidedAt: new Date().toISOString(),
    context: { ...context },
    options: options.map((o) => ({ ...o, criteria: { ...o.criteria }, pros: [...o.pros], cons: [...o.cons], tradeoffs: [...o.tradeoffs] })),
    selectedOptionId,
    acceptedTradeoffs: selected.tradeoffs.map((t) => ({ description: t, whyAccepted: "Acceptat în urma evaluării complete." })),
    lessons: [
      `Opțiunea ${selected.name} a fost aleasă.`,
      ...options.filter((o) => o.id !== selectedOptionId).map((o) => `${o.name}: ${o.status === "excluded" ? "EXCLUSĂ" : "nerecomandată"} — ${o.reason}`),
    ],
    nextSteps: [
      "Verifică dimensiunile exacte în teren (măsurători in-situ).",
      "Confirmă tipul de sticlă (securizată, tratament hidrofob opțional).",
      context.accessType === "sliding_door" ? "Verifică compatibilitatea ghidajelor cu pardoseala." : "Asigură-te că panta de scurgere este suficientă pentru walk-in.",
      "Consultă un instalator pentru validarea punctelor de prindere.",
    ],
  }
}
