// ══════════════════════════════════════════════
// GLAZEO — Mock Decision Record Repository
// În memorie. Deterministic. Pentru teste și dev.
// Aceleași reguli ca implementarea Supabase: model_id din meta, id persistent generat.
// ══════════════════════════════════════════════
import type { DecisionRecord } from "../features/decision-maker/shared/decisionModelTypes"
import type {
  DecisionRecordRepository,
  DecisionRecordSummary,
  DecisionSaveMeta,
} from "./DecisionRecordRepository"
import { assertDecisionSaveMeta } from "./decisionSaveMeta"

type Entry = { record: DecisionRecord; userId: string; meta: DecisionSaveMeta }

/** Id persistent, în spiritul `gen_random_uuid()` din bază (unic, nu derivat din record). */
function nextPersistentId(): string {
  const c = globalThis.crypto as Crypto | undefined
  if (c && typeof c.randomUUID === "function") return c.randomUUID()
  return `mock-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Hook EXCLUSIV pentru teste E2E — simulează eșecul/latența de persistență fără
 * infrastructură suplimentară. Nu afectează producția: aliasul „decision-record-repo"
 * alege implementarea Supabase pentru orice build care nu e e2e/e2e-dm/runtime-test.
 *
 *   "1"    → fiecare salvare eșuează
 *   "once" → doar următoarea salvare eșuează, apoi flag-ul e consumat (test de reîncercare)
 *   "slow" → salvează după 1500 ms (test „fără succes înainte de confirmare")
 */
const FAIL_FLAG = "glazeo_e2e_fail_save"
const SLOW_DELAY_MS = 1500

function readFlag(): string | null {
  try {
    return globalThis.localStorage?.getItem(FAIL_FLAG) ?? null
  } catch {
    return null
  }
}

function clearFlag(): void {
  try {
    globalThis.localStorage?.removeItem(FAIL_FLAG)
  } catch {
    /* fără localStorage (unit tests) — nimic de curățat */
  }
}

export class MockDecisionRecordRepository implements DecisionRecordRepository {
  private records: Map<string, Entry> = new Map()
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  async save(record: DecisionRecord, meta: DecisionSaveMeta): Promise<{ id: string }> {
    const normalized = assertDecisionSaveMeta(meta)

    // Hook de test (vezi readFlag): eșec/latență simulate, consumate o singură dată dacă e „once".
    const flag = readFlag()
    if (flag === "1" || flag === "once") {
      if (flag === "once") clearFlag()
      throw new Error("persistența a eșuat (simulat în E2E)")
    }
    if (flag === "slow") {
      await new Promise((resolve) => setTimeout(resolve, SLOW_DELAY_MS))
    }

    const id = nextPersistentId()
    this.records.set(id, { record: structuredClone(record), userId: this.userId, meta: normalized })
    return { id }
  }

  async listByUser(): Promise<DecisionRecordSummary[]> {
    const results: DecisionRecordSummary[] = []
    for (const [id, entry] of this.records) {
      if (entry.userId === this.userId) {
        results.push({
          id,
          modelId: entry.meta.modelId,
          modelTitle: entry.meta.modelTitle,
          selectedOptionName:
            entry.record.options.find((o) => o.id === entry.record.selectedOptionId)?.name ?? null,
          decidedAt: entry.record.decidedAt,
        })
      }
    }
    return results.sort((a, b) => new Date(b.decidedAt).getTime() - new Date(a.decidedAt).getTime())
  }

  async getById(id: string): Promise<DecisionRecord | null> {
    const entry = this.records.get(id)
    if (!entry || entry.userId !== this.userId) return null
    return structuredClone(entry.record) as DecisionRecord
  }
}
