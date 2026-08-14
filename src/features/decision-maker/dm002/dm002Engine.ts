// ══════════════════════════════════════════════
// GLAZEO — DM-002 Engine (Balustradă din sticlă) v3
// Motor pur, determinist. 4 sisteme réale din catalog.json.
// Ordine evaluare: constraint → preference → recommend.
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
    case "butoni":            return evaluateButoni(ctx)
    case "mini-montanti":     return evaluateMiniMontanti(ctx)
    case "profil-cale":       return evaluateProfilCale(ctx)
    case "profil-reglaj":     return evaluateProfilReglaj(ctx)
    default: return { status: "not_recommended", reason: "Opțiune necunoscută." }
  }
}

// ══════════════════════════════════════════════
// Butoni Inox — puncte discrete, 35 RON/m
// ══════════════════════════════════════════════

function evaluateButoni(ctx: DM002Context): EvaluationResult {
  // ── CONSTRAINT: ancorare imposibilă ──
  if (ctx.surfaceType === "wood_composite") {
    return {
      status: "excluded",
      reason: "Lemnul și compozitul nu oferă ancorare sigură pentru butoni. Punctele de prindere necesită beton sau structură metalică.",
    }
  }

  // ── CONSTRAINT: wind load + dilatație termică ──
  if (ctx.location === "exterior" && ctx.heightCategory === "peste_3m") {
    return {
      status: "excluded",
      reason: "Wind load + dilatație termică la exterior cu înălțime >3m creează risc de fisurare. Sunt necesare profil continuu sau reglaj mecanic.",
    }
  }

  // ── CONSTRAINT: denivelări severe ──
  if (ctx.surfaceCondition === "severely_uneven") {
    return {
      status: "excluded",
      reason: "Butonii necesită suprafață aproape perfect plană (±3mm). Denivelările >10mm fac montajul imposibil fără compensare majoră.",
    }
  }

  // ── PREFERENCE: denivelări minore ──
  if (ctx.surfaceCondition === "minor_uneven") {
    return {
      status: "not_recommended",
      reason: "Butonii preferă suprafețe perfect plane. Denivelările de 3–10mm pot necesita compensare, ceea ce adaugă cost și complexitate.",
    }
  }

  // ── PREFERENCE: exterior + înălțime medie ──
  if (ctx.location === "exterior" && ctx.heightCategory === "1_3m") {
    const notes: string[] = []
    notes.push("La exterior, butonii necesită sticlă mai groasă (882, 17mm) — cost suplimentar.")
    notes.push("Dilatația termică trebuie gestionată cu atentie.")
    return {
      status: "recommended",
      reason: `Recomandat cu observații: ${notes.join(" ")}`,
    }
  }

  // ── PREFERENCE: buget prioritar → butonii sunt cei mai accesibili ──
  if (ctx.budgetPriority === "cost") {
    return {
      status: "recommended",
      reason: "Recomandat: cel mai accesibil sistem (35 RON/m). Transparență maximă, cost minim.",
    }
  }

  // ── RECOMMEND: default pentru interior, plan, estetică ──
  return {
    status: "recommended",
    reason: "Recomandat: transparență maximă, aspect premium. Cel mai minimalist sistem disponibil.",
  }
}

// ══════════════════════════════════════════════
// Mini-Montanți — montanți intermediari, 50 RON/m
// ══════════════════════════════════════════════

function evaluateMiniMontanti(ctx: DM002Context): EvaluationResult {
  // ── CONSTRAINT: ancorare nesigură ──
  if (ctx.surfaceType === "wood_composite") {
    return {
      status: "not_recommended",
      reason: "Lemnul și compozitul oferă ancorare limitată pentru mini-montanți. Se recomandă verificare structurală înainte de montaj.",
    }
  }

  // ── CONSTRAINT: exterior + înălțime mare ──
  if (ctx.location === "exterior" && ctx.heightCategory === "peste_3m") {
    return {
      status: "not_recommended",
      reason: "La exterior cu înălțime >3m, profilul continuu oferă siguranță superioară. Mini-montanții nu distribuie sarcina la fel de uniform.",
    }
  }

  // ── PREFERENCE: denivelări severe ──
  if (ctx.surfaceCondition === "severely_uneven") {
    return {
      status: "not_recommended",
      reason: "Denivelările >10mm depășesc capacitatea de compensare a mini-montanților. Profilul cu cale sau reglajul mecanic sunt mai potrivite.",
    }
  }

  // ── PREFERENCE: prioritate estetică ──
  if (ctx.budgetPriority === "aesthetics" && ctx.surfaceCondition === "flat") {
    return {
      status: "not_recommended",
      reason: "Pentru estetică maximă pe suprafață plană, butonii oferă un look mai curat. Mini-montanții adaugă elemente verticale vizibile.",
    }
  }

  // ── RECOMMEND: opțiune de mijloc solidă ──
  return {
    status: "recommended",
    reason: "Recomandat: echilibru bun între transparență, siguranță și toleranță. Mai robust decât butonii, mai transparent decât profilul continuu.",
  }
}

// ══════════════════════════════════════════════
// Profil Pardoseală cu Cale — canal continuu, 67 RON/m
// ══════════════════════════════════════════════

function evaluateProfilCale(ctx: DM002Context): EvaluationResult {
  // ── PREFERENCE: suprafață perfect plană + interior → profilul e vizibil fără beneficiu ──
  if (ctx.surfaceCondition === "flat" && ctx.location === "interior" && ctx.budgetPriority !== "cost") {
    return {
      status: "not_recommended",
      reason: "Pe suprafață plană la interior, profilul cu cale adaugă un element vizibil (3–5cm) fără beneficiu structural. Butonii oferă același nivel de siguranță cu aspect mai curat.",
    }
  }

  // ── RECOMMEND: opțiunea implicită pentru majoritatea cazurilor ──
  const reasons: string[] = []
  if (ctx.location === "exterior") reasons.push("Excelent pentru exterior (rezistență la intemperii, dilatație controlată).")
  if (ctx.surfaceCondition !== "flat") reasons.push("Iertător cu denivelările — canalul absoarbe variațiile.")
  if (ctx.heightCategory === "peste_3m") reasons.push("Distribuție uniformă a sarcinii — ideal pentru înălțimi mari.")
  if (ctx.budgetPriority === "cost" || ctx.budgetPriority === "balanced") reasons.push("Raport calitate/preț foarte bun (67 RON/m).")

  const reason = reasons.length > 0
    ? `Recomandat: ${reasons.join(" ")}`
    : "Recomandat: sistem versatil, robust, potrivit pentru majoritatea situațiilor."

  return { status: "recommended", reason }
}

// ══════════════════════════════════════════════
// Profil cu Reglaj Mecanic — precizie, 215 RON/m
// ══════════════════════════════════════════════

function evaluateProfilReglaj(ctx: DM002Context): EvaluationResult {
  // ── PREFERENCE: buget redus → prea scump ──
  if (ctx.budgetPriority === "cost" && ctx.surfaceCondition !== "severely_uneven") {
    return {
      status: "not_recommended",
      reason: "La 215 RON/m (3x profilul cu cale), reglajul mecanic nu se justifică când bugetul e prioritar și suprafața nu e sever denivelată.",
    }
  }

  // ── PREFERENCE: suprafață plană → overkill ──
  if (ctx.surfaceCondition === "flat" && ctx.budgetPriority !== "aesthetics") {
    return {
      status: "not_recommended",
      reason: "Pe suprafață perfect plană, reglajul mecanic nu aduce beneficii practice. Profilul cu cale oferă aceeași siguranță la o treime din cost.",
    }
  }

  // ── RECOMMEND: cazurile unde excelează ──
  const reasons: string[] = []
  if (ctx.surfaceCondition === "severely_uneven") reasons.push("Reglajul mecanic compensează denivelări mari fără improvizații.")
  if (ctx.location === "exterior" && ctx.heightCategory === "peste_3m") reasons.push("Distribuție perfect uniformă a sarcinii — siguranță maximă la exterior.")
  if (ctx.surfaceCondition === "minor_uneven" && ctx.budgetPriority === "aesthetics") reasons.push("Oferă cel mai curat rezultat pe suprafețe imperfecte.")

  const reason = reasons.length > 0
    ? `Recomandat: ${reasons.join(" ")}`
    : "Recomandat: sistemul cel mai precis. Justificat când condițiile de teren sau cerințele de siguranță o cer."

  return { status: "recommended", reason }
}

// ══════════════════════════════════════════════
// Decision Record Factory
// ══════════════════════════════════════════════

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

  const rejectedOptions = options.filter((o) => o.id !== selectedOptionId)

  const handrailNote =
    context.handrailNeed !== "no"
      ? `Mâna curentă (${context.handrailNeed === "yes_mandatory" ? "obligatorie" : "opțională"}) se va configura în etapa următoare.`
      : null

  return {
    id,
    decidedAt: new Date().toISOString(),
    context: { ...context },
    options: options.map((o) => ({
      ...o,
      criteria: { ...o.criteria },
      pros: [...o.pros],
      cons: [...o.cons],
      tradeoffs: [...o.tradeoffs],
    })),
    selectedOptionId,
    acceptedTradeoffs: selected.tradeoffs.map((t) => ({
      description: t,
      whyAccepted: "Acceptat în urma evaluării complete a opțiunilor disponibile.",
    })),
    lessons: [
      `Opțiunea ${selected.name} a fost aleasă pentru acest proiect.`,
      ...rejectedOptions.map((o) => `${o.name} a fost respinsă: ${o.reason}`),
      ...(handrailNote ? [handrailNote] : []),
    ],
    nextSteps: [
      "Verifică normativele locale pentru înălțimea de cădere și tipul de sticlă necesar.",
      "Confirmă tipul de suprafață și planeitatea cu un inginer structural.",
      selected.id === "butoni" || selected.id === "mini-montanti"
        ? "Măsoară denivelările în teren — abaterea determină fezabilitatea sistemului."
        : "Confirmă dimensiunile profilului și forma (U, Y, L) cu furnizorul.",
      context.handrailNeed !== "no"
        ? "Alege tipul de mână curentă în configurator (slim, rotundă, pătrată, structurală)."
        : "Confirmă dacă normativele locale permit absența mâinii curente.",
      "Configurează tipul de sticlă, dimensiunile și opțiunile (LED, formă) în etapa următoare.",
    ],
  }
}
