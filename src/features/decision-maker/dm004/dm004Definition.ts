// ══════════════════════════════════════════════
// GLAZEO — DM-004 Definition
// ══════════════════════════════════════════════
import type { DecisionModelDefinition, DecisionModelRuntime } from "../shared/decisionModelTypes"
import type { DM004Context } from "./dm004Data"
import { CONTEXT_QUESTIONS, COMPARISON_CRITERIA, OPTIONS_BASE } from "./dm004Data"
import { evaluateOptions, createDecisionRecord } from "./dm004Engine"

export const dm004Definition: DecisionModelDefinition<DM004Context> = {
  id: "walk_in_shower",
  title: "Cabină de duș walk-in",
  intention: {
    type: "walk_in_shower",
    label: "Cabină de duș walk-in",
    description: "Ai nevoie de o cabină de duș din sticlă? Alege între estetică pură, robustețe și controlul apei.",
    insight:
      "Arhitecții și proprietarii intră cu „duș walk-in, sticlă transparentă, fără profil.\" " +
      "Problema reală este <strong>echilibrul între estetică, funcționalitate și întreținere</strong> — " +
      "un duș trebuie să arate impecabil, să nu inunde baia și să fie ușor de păstrat curat.",
    insightDetail: "",
  },
  questions: CONTEXT_QUESTIONS.map((q) => ({ id: q.id, question: q.question, whyItMatters: q.whyItMatters, options: q.options.map((o) => ({ value: o.value, label: o.label })) })),
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
  accessType: "walk_in",
  surfaceCondition: "flat",
  accessibility: "standard",
  maintenance: "no_preference",
}
