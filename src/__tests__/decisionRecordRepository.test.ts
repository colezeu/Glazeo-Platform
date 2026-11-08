// ══════════════════════════════════════════════
// GLAZEO — Contractul repository ↔ tabela decision_records
//
// Fixează cele trei decizii:
//   C1 — cheia persistentă e generată de BAZĂ (clientul nu trimite `id`)
//   C2 — `model_id` vine din DecisionSaveMeta (definition.id), validat în client
//   C3 — succesul e raportat doar după confirmarea INSERT-ului
//
// Regresie istorică păstrată: `user_id` trebuie să fie uuid REAL (string),
// niciodată un Promise (`{}` după serializare → insert invalid).
// ══════════════════════════════════════════════
import { describe, it, expect, vi } from "vitest"
// supabase.ts face fail-fast la import fără env vars; testele injectează un client fake explicit.
vi.mock("../app/supabase", () => ({ supabase: {} }))
import { SupabaseDecisionRecordRepository } from "../persistence/SupabaseDecisionRecordRepository"
import type { DecisionRecord } from "../features/decision-maker/shared/decisionModelTypes"

const RECORD = {
  id: "DM-101",
  decidedAt: "2026-09-12T00:00:00.000Z",
  intention: { type: "walk_in_shower", label: "Cabină duș walk-in" },
  selectedOptionId: "opt-1",
  options: [{ id: "opt-1", name: "10mm clar" }],
} as unknown as DecisionRecord

const META = { modelId: "walk_in_shower", modelTitle: "Cabină duș walk-in" }

type InsertPayload = Record<string, unknown>

/**
 * Client fake minimal: auth.getUser() + lanțul .from().insert().select().single().
 * `insert` capturează payload-ul SINCRON, exact cum îl vede PostgREST.
 */
function fakeClient(opts: {
  user?: { id: string } | null
  userError?: { message: string } | null
  insertError?: { message: string } | null
  generatedId?: string | null
  incrementIds?: boolean
}) {
  const captured: { payload?: InsertPayload; selectCols?: string; calls: number } = { calls: 0 }
  let counter = 0
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
          captured.calls += 1
          return {
            select: (cols: string) => {
              captured.selectCols = cols
              return {
                single: async () => {
                  if (opts.insertError) return { data: null, error: opts.insertError }
                  if (opts.generatedId === null) return { data: null, error: null }
                  counter += 1
                  const id = opts.incrementIds ? `db-uuid-${counter}` : (opts.generatedId ?? "db-uuid-1")
                  return { data: { id }, error: null }
                },
              }
            },
          }
        },
      }
    },
  }
  return {
    client: client as unknown as ConstructorParameters<typeof SupabaseDecisionRecordRepository>[0],
    captured,
  }
}

describe("SupabaseDecisionRecordRepository.save — contract C1/C2/C3", () => {
  it("C1: NU trimite `id` în payload — cheia o generează baza", async () => {
    const { client, captured } = fakeClient({ user: { id: "user-1" } })
    await new SupabaseDecisionRecordRepository(client).save(RECORD, META)

    expect(captured.payload).toBeDefined()
    expect("id" in (captured.payload as InsertPayload)).toBe(false)
    // identificatorul intern al deciziei rămâne în snapshot, pentru trasabilitate
    expect((captured.payload as InsertPayload).snapshot).toBe(RECORD)
  })

  it("C1: întoarce id-ul persistent generat de bază", async () => {
    const { client, captured } = fakeClient({ user: { id: "user-1" }, generatedId: "db-uuid-abc" })
    const result = await new SupabaseDecisionRecordRepository(client).save(RECORD, META)

    expect(result).toEqual({ id: "db-uuid-abc" })
    expect(captured.selectCols).toBe("id")
  })

  it("C1: două salvari ale ACELUIAȘI record.id primesc chei persistente diferite", async () => {
    const { client } = fakeClient({ user: { id: "user-1" }, incrementIds: true })
    const repo = new SupabaseDecisionRecordRepository(client)

    const first = await repo.save(RECORD, META)
    const second = await repo.save(RECORD, META)

    expect(first.id).not.toBe(second.id)
  })

  it("C2: model_id vine din meta, niciodată „unknown”", async () => {
    const { client, captured } = fakeClient({ user: { id: "user-1" } })
    await new SupabaseDecisionRecordRepository(client).save(RECORD, META)

    expect((captured.payload as InsertPayload).model_id).toBe("walk_in_shower")
    expect((captured.payload as InsertPayload).model_id).not.toBe("unknown")
  })

  it("C2: respinge placeholder-ul ÎNAINTE de orice apel de rețea (fără insert)", async () => {
    const { client, captured } = fakeClient({ user: { id: "user-1" } })
    await expect(
      new SupabaseDecisionRecordRepository(client).save(RECORD, { modelId: "unknown", modelTitle: "x" }),
    ).rejects.toThrow(/placeholder/i)
    expect(captured.payload).toBeUndefined()
  })

  it("trimite user_id ca uuid REAL (string), niciodată un Promise/thenable", async () => {
    const { client, captured } = fakeClient({ user: { id: "user-1" } })
    await new SupabaseDecisionRecordRepository(client).save(RECORD, META)

    const p = captured.payload as InsertPayload
    expect(typeof p.user_id).toBe("string")
    expect(typeof ((p.user_id as { then?: unknown })?.then)).not.toBe("function")
    expect(p.user_id).toBe("user-1")
  })

  it("propagă decided_at și snapshot nealterate", async () => {
    const { client, captured } = fakeClient({ user: { id: "user-1" } })
    await new SupabaseDecisionRecordRepository(client).save(RECORD, META)

    const p = captured.payload as InsertPayload
    expect(p.decided_at).toBe("2026-09-12T00:00:00.000Z")
    expect(p.snapshot).toBe(RECORD)
  })

  it("fără utilizator autentificat → throw explicit (NU insert anonim)", async () => {
    const { client, captured } = fakeClient({ user: null })
    await expect(new SupabaseDecisionRecordRepository(client).save(RECORD, META)).rejects.toThrow(
      /no authenticated user/i,
    )
    expect(captured.payload).toBeUndefined()
  })

  it("eroare la rezolvarea utilizatorului → throw, fără insert", async () => {
    const { client, captured } = fakeClient({ user: null, userError: { message: "auth unavailable" } })
    await expect(new SupabaseDecisionRecordRepository(client).save(RECORD, META)).rejects.toThrow(/auth unavailable/)
    expect(captured.payload).toBeUndefined()
  })

  it("eroare la insert → throw cu mesajul repo-ului", async () => {
    const { client } = fakeClient({ user: { id: "user-1" }, insertError: { message: "duplicate key" } })
    await expect(new SupabaseDecisionRecordRepository(client).save(RECORD, META)).rejects.toThrow(
      /Failed to save decision record: duplicate key/,
    )
  })

  it("insert fără id întors → throw explicit (nu raporta succes fără cheie)", async () => {
    const { client } = fakeClient({ user: { id: "user-1" }, generatedId: null })
    await expect(new SupabaseDecisionRecordRepository(client).save(RECORD, META)).rejects.toThrow(
      /nu a întors id-ul persistent/i,
    )
  })
})
