// ══════════════════════════════════════════════
// GLAZEO — DM-004 Engine (Cabină de duș) v2
// 3 sisteme réale: paravan, batanta, culisant.
// stabilized eliminat — e parametru al paravanului.
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
    case "paravan":  return evaluateParavan(ctx)
    case "batanta":  return evaluateBatanta(ctx)
    case "culisant": return evaluateCulisant(ctx)
    default: return { status: "not_recommended", reason: "Opțiune necunoscută." }
  }
}

// ══════════════════════════════════════════════
// Paravan Fix — deschis, fără ușă
// ══════════════════════════════════════════════

function evaluateParavan(ctx: DM004Context): EvaluationResult {
  // ── CONSTRAINT: geometrie insulă → stropii ajung peste tot ──
  if (ctx.geometry === "island") {
    return {
      status: "excluded",
      reason: "Geometria insulă nu permite paravan fix fără ușă — stropii de apă ajung în toată baia. Este necesară o ușă (batantă sau glisantă).",
    }
  }

  // ── CONSTRAINT: denivelări severe ──
  if (ctx.surfaceCondition === "uneven" && ctx.stabilizationBar === "no") {
    return {
      status: "excluded",
      reason: "Suprafețele cu denivelări nu permit ancorarea sigură a paravanului fix fără bară de stabilizare. Activează bara de stabilizare sau alege o ușă.",
    }
  }

  // ── PREFERENCE: denivelări + bară de stabilizare → OK cu observații ──
  if (ctx.surfaceCondition === "uneven" && ctx.stabilizationBar === "yes") {
    return {
      status: "recommended",
      reason: "Recomandat cu bară de stabilizare: compensează denivelările și oferă robustețe. Bara va fi vizibilă (profil orizontal între pereți).",
    }
  }

  // ── PREFERENCE: întreținere minimă fără tratament → risc de calcar ──
  if (ctx.maintenance === "minimal") {
    return {
      status: "recommended",
      reason: "Recomandat, dar fără ușă sticla e complet expusă la apă. Tratamentul ENDURO-Shield (anti-calcificare) este recomandat pentru întreținere minimă.",
    }
  }

  // ── RECOMMEND: default pentru nișă/colț, plan ──
  return {
    status: "recommended",
    reason: "Recomandat: estetică maximă, acces facil, cel mai simplu de întreținut. Ideal pentru nișe și colțuri cu suprafață plană.",
  }
}

// ══════════════════════════════════════════════
// Fix + Ușă Batantă — control apă
// ══════════════════════════════════════════════

function evaluateBatanta(ctx: DM004Context): EvaluationResult {
  // ── CONSTRAINT: geometrie insulă → ușa are nevoie de perete ──
  if (ctx.geometry === "island") {
    return {
      status: "excluded",
      reason: "Ușa batantă necesită perete pentru balamale. Geometria insulă nu oferă acest suport. Alege ușă glisantă.",
    }
  }

  // ── PREFERENCE: accesibilitate → necesită manevră ──
  if (ctx.accessibility === "accessible") {
    return {
      status: "not_recommended",
      reason: "Ușa batantă necesită spațiu de manevră (~70cm în față) și forță pentru deschidere. Paravanul fix (walk-in) sau ușa glisantă sunt mai accesibile.",
    }
  }

  // ── RECOMMEND: opțiunea standard pentru controlul apei ──
  return {
    status: "recommended",
    reason: "Recomandat: control maxim al stropirii, deschidere generoasă, mai ușor de curățat decât glisanta (fără ghidaj inferior).",
  }
}

// ══════════════════════════════════════════════
// Fix + Ușă Glisantă — economie de spațiu
// ══════════════════════════════════════════════

function evaluateCulisant(ctx: DM004Context): EvaluationResult {
  // ── CONSTRAINT: geometrie insulă → singura opțiune fezabilă ──
  // Constrângerea geometrică are prioritate față de preferința de întreținere:
  // întreținerea minimă poate penaliza glisanta când există alternative, dar
  // nu trebuie să elimine singura soluție compatibilă cu geometria insulă.
  if (ctx.geometry === "island") {
    const reasons: string[] = ["Singura opțiune viabilă pentru geometrie insulă."]
    if (ctx.maintenance === "minimal") {
      reasons.push("Întreținere minimă: ghidajul inferior necesită totuși curățare periodică — alege cărucioare la vedere pentru acces facil.")
    }
    return {
      status: "recommended",
      reason: `Recomandat: ${reasons.join(" ")}`,
    }
  }

  // ── PREFERENCE: întreținere minimă → ghidajele necesită curățare ──
  if (ctx.maintenance === "minimal") {
    return {
      status: "not_recommended",
      reason: "Ușa glisantă are ghidaj inferior care acumulează calcar și necesită curățare frecventă. Pentru întreținere minimă, paravanul fix e mai potrivit.",
    }
  }

  // ── RECOMMEND: spațiu îngust, accesibilitate ──
  const reasons: string[] = []
  if (ctx.accessibility === "accessible") reasons.push("Nu necesită spațiu de manevră — bun pentru accesibilitate.")
  reasons.push("Economisește spațiu — ideal pentru băi mici.")

  return {
    status: "recommended",
    reason: `Recomandat: ${reasons.join(" ")}`,
  }
}

// ══════════════════════════════════════════════
// Decision Record Factory
// ══════════════════════════════════════════════

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

  const barNote =
    selected.id === "paravan" && context.stabilizationBar === "yes"
      ? "Bara de stabilizare va fi adăugată la paravanul fix pentru robustețe suplimentară."
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
      `Opțiunea ${selected.name} a fost aleasă.`,
      ...options
        .filter((o) => o.id !== selectedOptionId)
        .map((o) => `${o.name}: ${o.status === "excluded" ? "EXCLUSĂ" : "nerecomandată"} — ${o.reason}`),
      ...(barNote ? [barNote] : []),
    ],
    nextSteps: [
      "Verifică dimensiunile exacte în teren (măsurători in-situ).",
      selected.id === "culisant"
        ? "Alege varianta de cărucioare: la vedere (culisant-vedere) sau ascunse soft-close (culisant-sina)."
        : selected.id === "paravan"
          ? "Confirmă dacă este necesară bara de stabilizare."
          : "Confirmă tipul de balamale și mâner.",
      "Alege tipul de sticlă (8mm/10mm) și finisajul (clară, parsol, satinată) în configurator.",
      context.maintenance === "minimal"
        ? "Include tratament ENDURO-Shield pentru protecție anti-calcificare."
        : "Consultă un instalator pentru validarea punctelor de prindere.",
    ],
  }
}
