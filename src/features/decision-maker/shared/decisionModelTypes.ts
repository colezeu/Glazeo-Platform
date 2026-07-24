// ══════════════════════════════════════════════
// GLAZEO — Decision Model Shared Types
// Parametrizează DecisionWorkspace fără a cunoaște DM-001 sau DM-002.
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

export interface DecisionOption extends BaseOption {
  recommended: boolean
  reason: string
}

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
