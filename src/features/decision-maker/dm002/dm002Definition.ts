// ══════════════════════════════════════════════
// GLAZEO — DM-002 Definition v3
// Reconstruit pe catalog.json. 4 sisteme réale.
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
      "Alege sistemul de prindere potrivit — de la butoni minimaliști la profil cu reglaj mecanic de precizie.",
    insight:
      "Arhitecții intră cu „balustradă transparentă, fără profil.\" " +
      "Problema reală este <strong>siguranța fără compromis estetic</strong> — " +
      "balustrada trebuie să oprească o cădere, să reziste la vânt și să fie aproape invizibilă, simultan. " +
      "Cele 4 sisteme de prindere (butoni, mini-montanți, profil cu cale, reglaj mecanic) oferă " +
      "un spectru complet: de la transparență maximă la robustețe inginerească.",
    insightDetail:
      "Mâna curentă, tipul de sticlă, forma profilului și LED-ul se configurează " +
      "în etapa următoare — nu fac parte din această decizie.",
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
  surfaceCondition: "flat",
  handrailNeed: "no",
  budgetPriority: "balanced",
}
