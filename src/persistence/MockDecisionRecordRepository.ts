// ══════════════════════════════════════════════
// GLAZEO — Mock Decision Record Repository
// În memorie. Deterministic. Pentru teste și dev.
// ══════════════════════════════════════════════
import type { DecisionRecord } from "../features/decision-maker/shared/decisionModelTypes"
import type { DecisionRecordRepository, DecisionRecordSummary } from "./DecisionRecordRepository"

export class MockDecisionRecordRepository implements DecisionRecordRepository {
  private records: Map<string, { record: DecisionRecord; userId: string }> = new Map()

  async save(record: DecisionRecord, userId: string): Promise<void> {
    this.records.set(record.id, { record: structuredClone(record), userId })
  }

  async listByUser(userId: string): Promise<DecisionRecordSummary[]> {
    const results: DecisionRecordSummary[] = []
    for (const [id, entry] of this.records) {
      if (entry.userId === userId) {
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

  async getById(id: string, userId: string): Promise<DecisionRecord | null> {
    const entry = this.records.get(id)
    if (!entry || entry.userId !== userId) return null
    return structuredClone(entry.record) as DecisionRecord
  }
}
