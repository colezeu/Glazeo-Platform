// ══════════════════════════════════════════════
// GLAZEO — DM-003 Definition
// ══════════════════════════════════════════════
import type { DecisionModelDefinition, DecisionModelRuntime } from "../shared/decisionModelTypes"
import type { DM003Context } from "./dm003Data"
import { CONTEXT_QUESTIONS, COMPARISON_CRITERIA, OPTIONS_BASE } from "./dm003Data"
import { evaluateOptions, createDecisionRecord } from "./dm003Engine"

export const dm003Definition: DecisionModelDefinition<DM003Context> = {
  id: "facade_glazing_strategy",
  title: "Fațadă — strategie de vitrare",
  intention: {
    type: "facade_glazing_strategy",
    label: "Fațadă — strategie de vitrare",
    description:
      "Ce tip de vitraj se potrivește fațadei proiectului tău? " +
      "Transparența și performanța termică sunt în tensiune — hai să găsim echilibrul corect.",
    insight:
      "Arhitecții intră cu „fațadă transparentă, performantă termic.\" " +
      "Cele două obiective sunt în <strong>tensiune directă</strong>. " +
      "Fiecare creștere de transparență sacrifică control solar. " +
      "Fiecare creștere de performanță adaugă greutate și grosime.",
    insightDetail: "",
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

export const dm003Runtime: DecisionModelRuntime<DM003Context> = {
  evaluateOptions,
  createDecisionRecord: (ctx, opts, selectedId) => createDecisionRecord(ctx, opts, selectedId),
}

export const dm003DefaultContext: DM003Context = {
  orientation: "east_west",
  surfaceArea: "100_500",
  thermalPerformance: "standard",
  solarControl: "moderate",
  facadeSystem: "unknown",
}
