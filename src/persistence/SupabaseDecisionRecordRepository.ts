// ══════════════════════════════════════════════
// GLAZEO — Supabase Decision Record Repository
// ══════════════════════════════════════════════
import type { SupabaseClient } from "@supabase/supabase-js"
import type { DecisionRecord } from "../features/decision-maker/shared/decisionModelTypes"
import type { DecisionRecordRepository, DecisionRecordSummary } from "./DecisionRecordRepository"

export class SupabaseDecisionRecordRepository implements DecisionRecordRepository {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async save(record: DecisionRecord, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("decision_records")
      .insert({
        id: record.id,
        user_id: userId,
        model_id: (record as any).intention?.type ?? "unknown",
        decided_at: record.decidedAt,
        snapshot: record,
      })

    if (error) throw new Error(`Failed to save decision record: ${error.message}`)
  }

  async listByUser(userId: string): Promise<DecisionRecordSummary[]> {
    const { data, error } = await this.supabase
      .from("decision_records")
      .select("id, model_id, decided_at, snapshot")
      .eq("user_id", userId)
      .order("decided_at", { ascending: false })

    if (error) throw new Error(`Failed to list decision records: ${error.message}`)

    return (data ?? []).map((row: any) => ({
      id: row.id,
      modelId: row.model_id,
      modelTitle: row.snapshot?.intention?.label ?? row.model_id,
      selectedOptionName:
        row.snapshot?.options?.find((o: any) => o.id === row.snapshot?.selectedOptionId)?.name ?? null,
      decidedAt: row.decided_at,
    }))
  }

  async getById(id: string, userId: string): Promise<DecisionRecord | null> {
    const { data, error } = await this.supabase
      .from("decision_records")
      .select("snapshot")
      .eq("id", id)
      .eq("user_id", userId)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      throw new Error(`Failed to get decision record: ${error.message}`)
    }

    return (data as any)?.snapshot ?? null
  }
}
