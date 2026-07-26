// ══════════════════════════════════════════════
// GLAZEO — Mock Decision Record Repository
// În memorie. Deterministic. Pentru teste și dev.
// ══════════════════════════════════════════════
import type { DecisionRecord } from "../features/decision-maker/shared/decisionModelTypes"
import type { DecisionRecordRepository, DecisionRecordSummary } from "./DecisionRecordRepository"

export class MockDecisionRecordRepository implements DecisionRecordRepository {
  private records: Map<string, { record: DecisionRecord; userId: string }> = new Map()
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  async save(record: DecisionRecord): Promise<void> {
    this.records.set(record.id, { record: structuredClone(record), userId: this.userId })
  }

  async listByUser(): Promise<DecisionRecordSummary[]> {
    const results: DecisionRecordSummary[] = []
    for (const [id, entry] of this.records) {
      if (entry.userId === this.userId) {
        results.push({
          id,
          modelId: (entry.record as any).intention?.type ?? "unknown",
          modelTitle: (entry.record as any).intention?.label ?? entry.record.id,
          selectedOptionName: entry.record.options.find((o) => o.id === entry.record.selectedOptionId)?.name ?? null,
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
