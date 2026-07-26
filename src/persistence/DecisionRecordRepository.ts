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
  /** Salvează un Decision Record. Ownership derivat din sesiunea autentificată (nu din caller). */
  save(record: DecisionRecord): Promise<void>

  /** Lista deciziilor utilizatorului autentificat. */
  listByUser(): Promise<DecisionRecordSummary[]>

  /** Încarcă un record complet după ID (doar dacă aparține utilizatorului curent). */
  getById(id: string): Promise<DecisionRecord | null>
}
