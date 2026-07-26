// ══════════════════════════════════════════════
// GLAZEO — Decision Record Repository
// Interfață abstractă. Implementări: Supabase, Mock.
// ══════════════════════════════════════════════
import type { DecisionRecord } from "../features/decision-maker/shared/decisionModelTypes"

export interface DecisionRecordSummary {
  id: string
  modelId: string
  modelTitle: string
  selectedOptionName: string | null
  decidedAt: string
}

export interface DecisionRecordRepository {
  /** Salvează un Decision Record finalizat. */
  save(record: DecisionRecord, userId: string): Promise<void>

  /** Lista deciziilor utilizatorului curent. */
  listByUser(userId: string): Promise<DecisionRecordSummary[]>

  /** Încarcă un record complet după ID. */
  getById(id: string, userId: string): Promise<DecisionRecord | null>
}
