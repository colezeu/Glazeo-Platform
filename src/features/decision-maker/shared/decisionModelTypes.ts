// ══════════════════════════════════════════════
// GLAZEO — Decision Model Shared Types (v2)
// DM-003: introduces EvaluationStatus with constraint/preference separation.
// ══════════════════════════════════════════════

// ── Context Questions ──────────────────────────────

export interface DecisionQuestionOption<TValue = string> {
  value: TValue
  label: string
}

export interface DecisionQuestion<TContext> {
  id: keyof TContext & string
  question: string
  whyItMatters: string
  options: DecisionQuestionOption<TContext[keyof TContext]>[]
}

// ── Options ────────────────────────────────────────

export interface BaseOption {
  id: string
  name: string
  description: string
  pros: string[]
  cons: string[]
  criteria: Record<string, number>
  bestWhen: string
  notRecommendedWhen: string
  tradeoffs: string[]
}

/** Rezultatul evaluării engine-ului pentru o opțiune. */
export type EvaluationStatus = "recommended" | "not_recommended" | "excluded"

export interface EvaluationResult {
  status: EvaluationStatus
  /** Motivul determinant principal, evaluat în ordine stabilă (constraint → preference → recommend). */
  reason: string
}

export interface DecisionOption extends BaseOption, EvaluationResult {}

// ── Comparison Criteria ────────────────────────────

export interface ComparisonCriterion {
  id: string
  label: string
  description: string
}

// ── Decision Record ────────────────────────────────

export interface DecisionRecord<TContext = unknown> {
  id: string
  decidedAt: string
  context: TContext
  options: DecisionOption[]
  selectedOptionId: string | null
  acceptedTradeoffs: { description: string; whyAccepted: string }[]
  lessons: string[]
  nextSteps: string[]
}

// ── Intention ──────────────────────────────────────

export interface DecisionIntention {
  type: string
  label: string
  description: string
  insight: string
  insightDetail: string
}

// ── Model Definition (data contract) ───────────────

export interface DecisionModelDefinition<TContext> {
  id: string
  title: string
  intention: DecisionIntention
  questions: DecisionQuestion<TContext>[]
  options: BaseOption[]
  criteria: ComparisonCriterion[]
  lessons: string[]
  nextSteps: string[]
}

// ── Model Runtime (engine contract) ────────────────

export interface DecisionModelRuntime<TContext> {
  evaluateOptions(context: TContext): DecisionOption[]

  createDecisionRecord(
    context: TContext,
    options: DecisionOption[],
    selectedOptionId: string,
  ): DecisionRecord<TContext>
}
