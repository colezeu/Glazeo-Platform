// ══════════════════════════════════════════════
// GLAZEO — SupabaseDecisionRecordRepository.save(): ownership derivat din auth.uid()
//
// Regresie: save() trimitea `this.supabase.auth.getUser().then(...)` — un PROMISE —
// ca valoare pentru coloana `user_id` (uuid). PostgREST primea `{}` → insert invalid.
// Ownership-ul trebuie rezolvat cu `await` ÎNAINTE de insert, iar payload-ul trebuie
// să conțină un uuid real (string), niciodată un thenable.
// ══════════════════════════════════════════════
import { describe, it, expect, vi } from "vitest"
// supabase.ts face fail-fast la import fără env vars; testele injectează un client fake explicit.
vi.mock("../app/supabase", () => ({ supabase: {} }))
import { SupabaseDecisionRecordRepository } from "../persistence/SupabaseDecisionRecordRepository"
import type { DecisionRecord } from "../features/decision-maker/shared/decisionModelTypes"

const RECORD = {
  id: "rec-1",
  decidedAt: "2026-09-12T00:00:00.000Z",
  intention: { type: "walk_in_shower", label: "Cabină duș walk-in" },
  selectedOptionId: "opt-1",
  options: [{ id: "opt-1", name: "10mm clar" }],
} as unknown as DecisionRecord

type InsertPayload = Record<string, unknown>

/**
 * Client fake minimal: expune auth.getUser() + lanțul .from().insert().
 * `insert` capturează payload-ul SINCRON, exact cum îl vede PostgREST.
 */
function fakeClient(opts: {
  user?: { id: string } | null
  userError?: { message: string } | null
  insertError?: { message: string } | null
}) {
  const captured: { payload?: InsertPayload } = {}
  const client = {
    auth: {
      getUser: async () => ({
        data: { user: opts.user ?? null },
        error: opts.userError ?? null,
      }),
    },
    from: (table: string) => {
      expect(table).toBe("decision_records")
      return {
        insert: (payload: InsertPayload) => {
          captured.payload = payload
          return Promise.resolve({ data: null, error: opts.insertError ?? null })
        },
      }
    },
  }
  return { client: client as unknown as ConstructorParameters<typeof SupabaseDecisionRecordRepository>[0], captured }
}

describe("SupabaseDecisionRecordRepository.save — ownership (auth.uid, nu caller)", () => {
  it("trimite user_id ca uuid REAL (string), niciodată un Promise/thenable", async () => {
    const { client, captured } = fakeClient({ user: { id: "user-1" } })
    await new SupabaseDecisionRecordRepository(client).save(RECORD)

    expect(captured.payload).toBeDefined()
    // Bug-ul istoric: un Promise ajungea aici; la serializare devenea {}.
    expect(typeof (captured.payload as InsertPayload).user_id).toBe("string")
    expect(typeof ((captured.payload as InsertPayload).user_id as { then?: unknown })?.then).not.toBe("function")
    expect((captured.payload as InsertPayload).user_id).toBe("user-1")
  })

  it("propagă restul payload-ului nealterat (id, model_id, snapshot)", async () => {
    const { client, captured } = fakeClient({ user: { id: "user-1" } })
    await new SupabaseDecisionRecordRepository(client).save(RECORD)

    const p = captured.payload as InsertPayload
    expect(p.id).toBe("rec-1")
    expect(p.model_id).toBe("walk_in_shower")
    expect(p.decided_at).toBe("2026-09-12T00:00:00.000Z")
    expect(p.snapshot).toBe(RECORD)
  })

  it("fără utilizator autentificat → throw explicit (NU insert anonim)", async () => {
    const { client, captured } = fakeClient({ user: null })
    await expect(new SupabaseDecisionRecordRepository(client).save(RECORD)).rejects.toThrow(
      /no authenticated user/i,
    )
    expect(captured.payload).toBeUndefined()
  })

  it("eroare la rezolvarea utilizatorului → throw, fără insert", async () => {
    const { client, captured } = fakeClient({ user: null, userError: { message: "auth unavailable" } })
    await expect(new SupabaseDecisionRecordRepository(client).save(RECORD)).rejects.toThrow(/auth unavailable/)
    expect(captured.payload).toBeUndefined()
  })

  it("eroare la insert → throw cu mesajul repo-ului", async () => {
    const { client } = fakeClient({ user: { id: "user-1" }, insertError: { message: "duplicate key" } })
    await expect(new SupabaseDecisionRecordRepository(client).save(RECORD)).rejects.toThrow(
      /Failed to save decision record: duplicate key/,
    )
  })
})
