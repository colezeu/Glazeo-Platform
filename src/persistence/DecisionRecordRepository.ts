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

/**
 * Metadate care NU fac parte din DecisionRecord.
 *
 * `model_id` nu poate fi derivat din record: DecisionRecord (schemaVersion 2) nu are `intention`,
 * doar definiția modelului are un `id` real. Fallback-ul istoric `"unknown"` era respins explicit
 * de constrângerea `decision_records_model_id_real` din migrarea 008 — deci meta e obligatorie.
 */
export interface DecisionSaveMeta {
  /** Identificatorul real al modelului (ex. `walk_in_shower`). */
  modelId: string
  /** Titlul modelului, pentru listări fără join cu definiția. */
  modelTitle: string
}

export interface DecisionRecordRepository {
  /**
   * Salvează un Decision Record.
   * Ownership derivat din sesiunea autentificată (nu din caller).
   * Cheia persistentă (id) este generată de bază și întoarsă aici (C1) — clientul nu o inventează.
   */
  save(record: DecisionRecord, meta: DecisionSaveMeta): Promise<{ id: string }>

  /** Lista deciziilor utilizatorului autentificat. */
  listByUser(): Promise<DecisionRecordSummary[]>

  /** Încarcă un record complet după ID (doar dacă aparține utilizatorului curent). */
  getById(id: string): Promise<DecisionRecord | null>
}
