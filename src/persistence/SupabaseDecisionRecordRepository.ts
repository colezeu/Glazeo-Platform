// ══════════════════════════════════════════════
// GLAZEO — Supabase Decision Record Repository
// Ownership: derivat din auth.uid(), nu din caller.
// Cheia persistentă: generată de bază (C1), nu de client.
// ══════════════════════════════════════════════
import type { SupabaseClient } from "@supabase/supabase-js"
import type { DecisionRecord } from "../features/decision-maker/shared/decisionModelTypes"
import type {
  DecisionRecordRepository,
  DecisionRecordSummary,
  DecisionSaveMeta,
} from "./DecisionRecordRepository"
import { assertDecisionSaveMeta } from "./decisionSaveMeta"

export class SupabaseDecisionRecordRepository implements DecisionRecordRepository {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async save(record: DecisionRecord, meta: DecisionSaveMeta): Promise<{ id: string }> {
    // C2: model_id vine din definition.id, validat ÎNAINTE de orice apel de rețea.
    const { modelId } = assertDecisionSaveMeta(meta)

    // Ownership din auth.uid(): rezolvat ÎNAINTE de insert.
    // (Regresie istorică: promisiunea lui getUser() era pasată direct ca `user_id`,
    //  ajungea `{}` după serializare → insert invalid pe coloana uuid.)
    const {
      data: { user },
      error: userError,
    } = await this.supabase.auth.getUser()
    if (userError) throw new Error(`Failed to resolve current user: ${userError.message}`)
    if (!user) throw new Error("Cannot save decision record: no authenticated user")

    // C1: NU trimitem `id` — îl generează baza (default gen_random_uuid()).
    // Identificatorul intern al deciziei („DM-101") rămâne în snapshot, pentru trasabilitate.
    const { data, error } = await this.supabase
      .from("decision_records")
      .insert({
        user_id: user.id,
        model_id: modelId,
        decided_at: record.decidedAt,
        snapshot: record,
      })
      .select("id")
      .single()

    if (error) throw new Error(`Failed to save decision record: ${error.message}`)
    if (!data || typeof (data as { id?: unknown }).id !== "string") {
      throw new Error("Failed to save decision record: baza nu a întors id-ul persistent generat")
    }

    return { id: (data as { id: string }).id }
  }

  async listByUser(): Promise<DecisionRecordSummary[]> {
    const { data, error } = await this.supabase
      .from("decision_records")
      .select("id, model_id, decided_at, snapshot")
      .order("decided_at", { ascending: false })

    if (error) throw new Error(`Failed to list decision records: ${error.message}`)

    return (data ?? []).map((row: any) => ({
      id: row.id,
      modelId: row.model_id,
      modelTitle: row.snapshot?.modelTitle ?? row.model_id,
      selectedOptionName:
        row.snapshot?.options?.find((o: any) => o.id === row.snapshot?.selectedOptionId)?.name ?? null,
      decidedAt: row.decided_at,
    }))
  }

  async getById(id: string): Promise<DecisionRecord | null> {
    const { data, error } = await this.supabase
      .from("decision_records")
      .select("snapshot")
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      throw new Error(`Failed to get decision record: ${error.message}`)
    }

    return (data as any)?.snapshot ?? null
  }
}
