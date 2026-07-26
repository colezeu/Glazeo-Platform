// ══════════════════════════════════════════════
// GLAZEO — DM-002 Definition
// ══════════════════════════════════════════════
import type { DecisionModelDefinition, DecisionModelRuntime } from "../shared/decisionModelTypes"
import type { DM002Context } from "./dm002Data"
import { CONTEXT_QUESTIONS, COMPARISON_CRITERIA, OPTIONS_BASE } from "./dm002Data"
import { evaluateOptions, createDecisionRecord } from "./dm002Engine"

export const dm002Definition: DecisionModelDefinition<DM002Context> = {
  id: "glass_balustrade",
  title: "Balustradă din sticlă",
  intention: {
    type: "glass_balustrade",
    label: "Balustradă din sticlă",
    description:
      "Ai nevoie de o balustradă din sticlă? " +
      "Hai să definim contextul și să găsim cea mai sigură și estetică soluție.",
    insight:
      "Arhitecții intră cu „balustradă transparentă, fără profil.\" " +
      "Problema reală este <strong>siguranța fără compromis estetic</strong> — " +
      "balustrada trebuie să oprească o cădere, să reziste la vânt și să fie aproape invizibilă, simultan.",
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

export const dm002Runtime: DecisionModelRuntime<DM002Context> = {
  evaluateOptions,
  createDecisionRecord: (ctx, opts, selectedId) => createDecisionRecord(ctx, opts, selectedId),
}

export const dm002DefaultContext: DM002Context = {
  location: "interior",
  heightCategory: "1_3m",
  surfaceType: "concrete",
  handrailRequired: "no_optional",
}
