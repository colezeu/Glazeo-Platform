// ══════════════════════════════════════════════
// GLAZEO — DM-002 Engine (Balustradă din sticlă)
// Motor pur, determinist. Zero I/O, zero React.
// ══════════════════════════════════════════════
import type { DM002Context } from "./dm002Data"
import type { DecisionOption, DecisionRecord } from "../shared/decisionModelTypes"
import { OPTIONS_BASE } from "./dm002Data"

export function evaluateOptions(context: DM002Context): DecisionOption[] {
  return OPTIONS_BASE.map((opt) => {
    const { recommended, reason } = evaluateOption(opt.id, context)
    return { ...opt, recommended, reason }
  })
}

function evaluateOption(optionId: string, ctx: DM002Context): { recommended: boolean; reason: string } {
  switch (optionId) {
    case "frameless": return evaluateFrameless(ctx)
    case "u_channel": return evaluateUChannel(ctx)
    case "integrated_handrail": return evaluateIntegratedHandrail(ctx)
    default: return { recommended: false, reason: "Opțiune necunoscută." }
  }
}

// ── Frameless ───────────────────────────────────────

function evaluateFrameless(ctx: DM002Context): { recommended: boolean; reason: string } {
  if (ctx.location === "exterior" && ctx.heightCategory === "peste_3m") {
    return { recommended: false, reason: "Wind load + dilatație termică la exterior cu înălțime >3m → risc de fisurare. Profilul U sau mâna curentă integrată sunt mai sigure." }
  }
  if (ctx.surfaceType === "wood_composite") {
    return { recommended: false, reason: "Lemnul și compozitul nu oferă ancorare sigură pentru puncte de prindere. Profilul U distribuie sarcina mai bine." }
  }
  return { recommended: true, reason: "Recomandat: transparență maximă, aspect premium. Ideal pentru interior și înălțimi moderate." }
}

// ── U-Channel ───────────────────────────────────────

function evaluateUChannel(ctx: DM002Context): { recommended: boolean; reason: string } {
  if (ctx.handrailRequired === "yes_integrated") {
    return { recommended: false, reason: "Profilul U nu include mână curentă integrată. Pentru mână curentă integrată, alege opțiunea cu profil superior structural." }
  }
  if (ctx.location === "exterior") {
    return { recommended: true, reason: "Recomandat pentru exterior: profilul distribuie uniform sarcina și rezistă la intemperii." }
  }
  if (ctx.surfaceType === "wood_composite" || ctx.surfaceType === "unknown") {
    return { recommended: true, reason: "Profilul continuu compensează denivelările și ancorarea incertă." }
  }
  return { recommended: true, reason: "Recomandat: robust, iertător, potrivit pentru majoritatea situațiilor." }
}

// ── Integrated Handrail ─────────────────────────────

function evaluateIntegratedHandrail(ctx: DM002Context): { recommended: boolean; reason: string } {
  if (ctx.location === "interior" && ctx.handrailRequired === "no_optional") {
    return { recommended: false, reason: "În interior, fără mână curentă obligatorie, bara superioară este inutilă vizual și structural." }
  }
  if (ctx.handrailRequired === "yes_mandatory" || ctx.handrailRequired === "yes_integrated") {
    return { recommended: true, reason: "Mâna curentă integrată oferă cea mai elegantă soluție când aceasta este obligatorie." }
  }
  return { recommended: true, reason: "Recomandat pentru trafic intens și spații publice — structură foarte rigidă." }
}

// ── Decision Record Factory ─────────────────────────

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
    "Verifică normele locale pentru înălțimea de cădere — poate necesita laminat obligatoriu.",
    "Confirmă tipul de suprafață și capacitatea portantă cu un inginer structural.",
    selected.id === "frameless"
      ? "Măsoară denivelările — abatere >3mm necesită compensare."
      : "Confirmă dimensiunile profilului cu furnizorul.",
    "Verifică compatibilitatea mâinii curente cu normativele locale.",
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
