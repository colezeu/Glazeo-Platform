// ══════════════════════════════════════════════
// GLAZEO — DM-004 Definition v2
// Reconstruit pe catalog.json. stabilized → parametru.
// ══════════════════════════════════════════════
import type { DecisionModelDefinition, DecisionModelRuntime } from "../shared/decisionModelTypes"
import type { DM004Context } from "./dm004Data"
import { CONTEXT_QUESTIONS, COMPARISON_CRITERIA, OPTIONS_BASE } from "./dm004Data"
import { evaluateOptions, createDecisionRecord } from "./dm004Engine"

export const dm004Definition: DecisionModelDefinition<DM004Context> = {
  id: "walk_in_shower",
  title: "Cabină de duș",
  intention: {
    type: "walk_in_shower",
    label: "Cabină de duș",
    description:
      "Ai nevoie de o cabină de duș din sticlă? " +
      "Alege între paravan fix (estetică pură), ușă batantă (control apă) sau ușă glisantă (economie de spațiu).",
    insight:
      "Arhitecții și proprietarii intră cu „duș walk-in, sticlă transparentă, fără profil.\" " +
      "Problema reală este <strong>echilibrul între estetică, funcționalitate și spațiu</strong> — " +
      "un duș trebuie să arate impecabil, să nu inunde baia și să se potrivească în spațiul disponibil.",
    insightDetail:
      "Bara de stabilizare (accesoriu pentru paravanul fix), tipul de sticlă, finisajele și " +
      "feroneria se configurează în etapa următoare — nu fac parte din această decizie.",
  },
  questions: CONTEXT_QUESTIONS.map((q) => ({
    id: q.id,
    question: q.question,
    whyItMatters: q.whyItMatters,
    options: q.options.map((o) => ({ value: o.value, label: o.label })),
  })),
  options: OPTIONS_BASE,
  criteria: COMPARISON_CRITERIA,
  lessons: [],
  nextSteps: [],
}

export const dm004Runtime: DecisionModelRuntime<DM004Context> = {
  evaluateOptions,
  createDecisionRecord: (ctx, opts, selectedId) => createDecisionRecord(ctx, opts, selectedId),
}

export const dm004DefaultContext: DM004Context = {
  geometry: "niche",
  surfaceCondition: "flat",
  accessibility: "standard",
  maintenance: "no_preference",
  stabilizationBar: "no",
}
