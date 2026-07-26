// ══════════════════════════════════════════════
// GLAZEO — DM-001 Decision Engine (Phase 4B)
// Motor pur, determinist. Zero I/O, zero React.
// ══════════════════════════════════════════════
import type { DM001Context, DM001Option, DecisionRecord } from "./dm001Data"
import { OPTIONS_BASE } from "./dm001Data"

/**
 * Evaluează toate opțiunile pe baza contextului.
 * Fiecare opțiune primește `recommended: true/false` și o justificare.
 */
export function evaluateOptions(context: DM001Context): DM001Option[] {
  return OPTIONS_BASE.map((opt) => {
    const { recommended, reason } = evaluateOption(opt.id, context)
    return { ...opt, recommended, reason }
  })
}

/**
 * Regulile de recomandare/respingere pentru o singură opțiune.
 */
function evaluateOption(
  optionId: string,
  ctx: DM001Context,
): { recommended: boolean; reason: string } {
  switch (optionId) {
    case "frameless":
      return evaluateFrameless(ctx)
    case "spider":
      return evaluateSpider(ctx)
    case "aluminum":
      return evaluateAluminum(ctx)
    default:
      return { recommended: false, reason: "Opțiune necunoscută." }
  }
}

// ── Frameless (Opțiunea A) ─────────────────────────

function evaluateFrameless(ctx: DM001Context): { recommended: boolean; reason: string } {
  // Respins: acustică confidențială
  if (ctx.acousticNeed === "confidential") {
    return {
      recommended: false,
      reason: "Acustica confidențială necesită sticlă laminată acustică și etanșări complete — frameless nu atinge Rw-ul necesar (max ~35).",
    }
  }

  // Respins: tavan suspendat
  if (ctx.ceilingType === "suspended") {
    return {
      recommended: false,
      reason: "Tavanul suspendat nu oferă ancorare structurală sigură. Sistemul frameless necesită suport rigid la partea superioară.",
    }
  }

  // Recomandat cu observații
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

  return { recommended: true, reason }
}

// ── Spider (Opțiunea B) ────────────────────────────

function evaluateSpider(ctx: DM001Context): { recommended: boolean; reason: string } {
  // Respins: trafic intens
  if (ctx.doorTraffic === "intense") {
    return {
      recommended: false,
      reason: "Punctele de fixare nu rezistă la trafic intens. Uzura accelerată a feroneriei point-fixed.",
    }
  }

  // Respins: zgomot ambiental
  if (ctx.noiseNearby === true) {
    return {
      recommended: false,
      reason: "Etanșarea acustică a sistemelor point-fixed este slabă. Zgomotul ambiental va trece nestingherit.",
    }
  }

  // Recomandat doar ca alternativă distinctivă
  return {
    recommended: true,
    reason: "Opțiune viabilă pentru un statement arhitectural industrial. Necesită întreținere regulată — punctele de fixare acumulează praf.",
  }
}

// ── Aluminum (Opțiunea C) ──────────────────────────

function evaluateAluminum(ctx: DM001Context): { recommended: boolean; reason: string } {
  // Recomandat: acustică confidențială (cazul principal)
  if (ctx.acousticNeed === "confidential") {
    return {
      recommended: true,
      reason: "Profilele aluminiu cu etanșări complete oferă cea mai bună izolare acustică. Singura opțiune viabilă pentru confidențialitate.",
    }
  }

  // Recomandat: tavan suspendat
  if (ctx.ceilingType === "suspended") {
    return {
      recommended: true,
      reason: "Sistemul structural este iertător cu denivelările. Profilele compensează abaterile fără detalii vizibile.",
    }
  }

  // Recomandat cu observație estetică
  return {
    recommended: true,
    reason: "Opțiune solidă structural. Totuși, profilele verticale fragmentează vizual — nu e potrivit pentru spații sub 20m² unde transparența e prioritară.",
  }
}

// ── Decision Record Factory ─────────────────────────

let decisionCounter = 0

/**
 * Creează un Decision Record din contextul complet și opțiunea aleasă.
 * Este un snapshot final — nu o referință la starea editabilă.
 */
export function createDecisionRecord(
  context: DM001Context,
  options: DM001Option[],
  selectedOptionId: string,
): DecisionRecord {
  const selected = options.find((o) => o.id === selectedOptionId)
  if (!selected) {
    throw new Error(`Opțiunea ${selectedOptionId} nu există în lista evaluată.`)
  }

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
