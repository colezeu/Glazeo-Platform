// ══════════════════════════════════════════════
// GLAZEO — DM-003 Engine (Fațadă — strategie de vitrare)
// Motor pur, determinist. Constraint > Preference > Recommend.
// ══════════════════════════════════════════════
import type { DM003Context } from "./dm003Data"
import type { DecisionOption, DecisionRecord, EvaluationResult } from "../shared/decisionModelTypes"
import { OPTIONS_BASE } from "./dm003Data"

// ── Solar rules: explicit constraint vs preference ──

/** g-value estimat pentru fiecare opțiune. */
const OPTION_G_VALUES: Record<string, number> = {
  transparency_first: 0.45,
  balanced_solar: 0.30,
  max_performance: 0.20,
}

/** Ug estimat pentru fiecare opțiune. */
const OPTION_UG_VALUES: Record<string, number> = {
  transparency_first: 1.1,
  balanced_solar: 0.95,
  max_performance: 0.6,
}

interface SolarRule {
  target: number
  enforcement: "preference" | "constraint"
}

const SOLAR_RULES: Record<string, SolarRule> = {
  moderate: { target: 0.5, enforcement: "preference" },
  high: { target: 0.35, enforcement: "preference" },
  maximum: { target: 0.25, enforcement: "constraint" },
}

// ── Evaluation ──────────────────────────────────────

export function evaluateOptions(context: DM003Context): DecisionOption[] {
  return OPTIONS_BASE.map((opt) => {
    const result = evaluateOption(opt.id, context)
    return { ...opt, status: result.status, reason: result.reason }
  })
}

/**
 * Ordinea de evaluare (stabilă, documentată):
 *   1. Cerințe normative / obligatorii (Ug pasiv)
 *   2. Compatibilitate fizică și de sistem (greutate)
 *   3. Cerințe de performanță declarate obligatorii (g-value constraint)
 *   4. Preferințe (g-value preference, orientare)
 *   5. Recomandare implicită
 */
function evaluateOption(optionId: string, ctx: DM003Context): EvaluationResult {
  const gValue = OPTION_G_VALUES[optionId] ?? 999
  const ugValue = OPTION_UG_VALUES[optionId] ?? 999
  const rule = SOLAR_RULES[ctx.solarControl]

  // 1. Cerințe normative / obligatorii
  if (ctx.thermalPerformance === "passive" && ugValue > 0.7) {
    return { status: "excluded", reason: `Prag obligatoriu: Ug ≤ 0.7 necesar pentru standard pasiv. Această opțiune are Ug ≈ ${ugValue}.` }
  }

  // 2. Compatibilitate fizică și de sistem
  if (ctx.facadeSystem === "stick" && optionId === "max_performance") {
    return { status: "excluded", reason: "Incompatibilitate: greutatea triple glazing depășește capacitatea sistemelor stick. Necesită sistem unitized sau consolidat." }
  }

  // 3. Cerințe de performanță declarate obligatorii (g-value constraint)
  if (rule?.enforcement === "constraint" && gValue > rule.target) {
    return { status: "excluded", reason: `Prag obligatoriu: g < ${rule.target} necesar pentru control solar maxim. Această opțiune are g ≈ ${gValue}.` }
  }

  // 4. Preferințe
  if (rule?.enforcement === "preference" && gValue > rule.target) {
    return { status: "not_recommended", reason: `Preferință: g < ${rule.target} recomandat. Această opțiune are g ≈ ${gValue} — control solar sub nivelul dorit.` }
  }

  if (ctx.orientation === "south" && gValue > 0.4) {
    return { status: "not_recommended", reason: "Fațada sudică necesită control solar mai bun. Această opțiuneare g > 0.4 — încălzirea solară va fi semnificativă vara." }
  }

  // 5. Recomandare
  return { status: "recommended", reason: "Recomandat: combinație potrivită de performanță, cost și compatibilitate pentru contextul dat." }
}

// ── Decision Record Factory ─────────────────────────

let decisionCounter = 200

export function createDecisionRecord(
  context: DM003Context,
  options: DecisionOption[],
  selectedOptionId: string,
): DecisionRecord<DM003Context> {
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
      "Confirmă valorile Ug și g cu furnizorul de sticlă (pot varia ±5% față de estimări).",
      context.thermalPerformance === "passive" ? "Verifică certificarea Passivhaus pentru configurația selectată." : "Consideră un upgrade la triple glazing dacă bugetul permite.",
      "Consultă un inginer de fațadă pentru validarea compatibilității cu sistemul ales.",
    ],
  }
}
