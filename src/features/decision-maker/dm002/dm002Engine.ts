// ══════════════════════════════════════════════
// GLAZEO — DM-002 Engine (Balustradă din sticlă) v2
// Motor pur, determinist. Zero I/O, zero React.
// ══════════════════════════════════════════════
import type { DM002Context } from "./dm002Data"
import type { DecisionOption, DecisionRecord, EvaluationResult } from "../shared/decisionModelTypes"
import { OPTIONS_BASE } from "./dm002Data"

export function evaluateOptions(context: DM002Context): DecisionOption[] {
  return OPTIONS_BASE.map((opt) => {
    const result = evaluateOption(opt.id, context)
    return { ...opt, status: result.status, reason: result.reason }
  })
}

function evaluateOption(optionId: string, ctx: DM002Context): EvaluationResult {
  switch (optionId) {
    case "frameless": return evaluateFrameless(ctx)
    case "u_channel": return evaluateUChannel(ctx)
    case "integrated_handrail": return evaluateIntegratedHandrail(ctx)
    default: return { status: "not_recommended", reason: "Opțiune necunoscută." }
  }
}

function evaluateFrameless(ctx: DM002Context): EvaluationResult {
  if (ctx.location === "exterior" && ctx.heightCategory === "peste_3m") {
    return { status: "not_recommended", reason: "Wind load + dilatație termică la exterior cu înălțime >3m → risc de fisurare." }
  }
  if (ctx.surfaceType === "wood_composite") {
    return { status: "not_recommended", reason: "Lemnul și compozitul nu oferă ancorare sigură pentru puncte de prindere." }
  }
  return { status: "recommended", reason: "Recomandat: transparență maximă, aspect premium." }
}

function evaluateUChannel(ctx: DM002Context): EvaluationResult {
  if (ctx.handrailRequired === "yes_integrated") {
    return { status: "not_recommended", reason: "Profilul U nu include mână curentă integrată." }
  }
  return { status: "recommended", reason: "Recomandat: robust, iertător, potrivit pentru majoritatea situațiilor." }
}

function evaluateIntegratedHandrail(ctx: DM002Context): EvaluationResult {
  if (ctx.location === "interior" && ctx.handrailRequired === "no_optional") {
    return { status: "not_recommended", reason: "Fără mână curentă obligatorie, bara superioară este inutilă." }
  }
  return { status: "recommended", reason: "Mâna curentă integrată oferă cea mai elegantă soluție." }
}

let decisionCounter = 100

export function createDecisionRecord(
  context: DM002Context,
  options: DecisionOption[],
  selectedOptionId: string,
): DecisionRecord<DM002Context> {
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
      ...options.filter((o) => o.id !== selectedOptionId).map((o) => `${o.name} a fost respinsă: ${o.reason}`),
    ],
    nextSteps: [
      "Verifică normele locale pentru înălțimea de cădere.",
      "Confirmă tipul de suprafață cu un inginer structural.",
      selected.id === "frameless" ? "Măsoară denivelările — abatere >3mm necesită compensare." : "Confirmă dimensiunile profilului cu furnizorul.",
      "Verifică compatibilitatea mâinii curente cu normativele locale.",
    ],
  }
}
