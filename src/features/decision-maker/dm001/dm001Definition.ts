// ══════════════════════════════════════════════
// GLAZEO — DM-001 Definition
// Wrapping peste dm001Data + dm001Engine.
// ══════════════════════════════════════════════
import type { DecisionModelDefinition, DecisionModelRuntime } from "../shared/decisionModelTypes"
import type { DM001Context } from "./dm001Data"
import { CONTEXT_QUESTIONS, COMPARISON_CRITERIA, OPTIONS_BASE } from "./dm001Data"
import { evaluateOptions, createDecisionRecord } from "./dm001Engine"

export const dm001Definition: DecisionModelDefinition<DM001Context> = {
  id: "meeting_room_partition",
  title: "Compartimentare din sticlă pentru sală de ședințe",
  intention: {
    type: "meeting_room_partition",
    label: "Compartimentare sală de ședințe",
    description:
      "Ai nevoie de un perete de sticlă pentru o sală de ședințe? " +
      "Hai să definim contextul și să găsim soluția potrivită — nu o listă de produse.",
    insight:
      "Arhitecții descriu adesea nevoia ca „perete continuu de sticlă, fără profile vizibile\", " +
      "dar problema reală este de obicei continuitatea spațială — păstrarea " +
      "luminii naturale și a senzației de deschidere, chiar și când ușa e închisă.",
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

export const dm001Runtime: DecisionModelRuntime<DM001Context> = {
  evaluateOptions,
  createDecisionRecord: (ctx, opts, selectedId) => createDecisionRecord(ctx, opts, selectedId),
}
