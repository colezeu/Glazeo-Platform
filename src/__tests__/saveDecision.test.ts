// ══════════════════════════════════════════════
// GLAZEO — Feedback-ul de salvare (C3)
// Succesul nu se raportează înainte ca repository-ul să confirme INSERT-ul.
// Eșecul nu se înghite: devine mesaj pentru utilizator.
// ══════════════════════════════════════════════
import { describe, it, expect } from "vitest"
import { saveDecision } from "../features/decision-maker/shared/saveDecision"
import type { DecisionRecordRepository, DecisionSaveMeta } from "../persistence/DecisionRecordRepository"
import type { DecisionRecord } from "../features/decision-maker/shared/decisionModelTypes"

const RECORD = { id: "DM-101", decidedAt: "2026-09-12T00:00:00.000Z" } as unknown as DecisionRecord
const META: DecisionSaveMeta = { modelId: "walk_in_shower", modelTitle: "Cabină duș walk-in" }

function repoReturning(fn: DecisionRecordRepository["save"]): DecisionRecordRepository {
  return {
    save: fn,
    listByUser: async () => [],
    getById: async () => null,
  }
}

describe("saveDecision — feedback onest", () => {
  it("succes: raportează ok + id-ul persistent confirmat", async () => {
    const repo = repoReturning(async () => ({ id: "db-uuid-1" }))
    await expect(saveDecision(repo, RECORD, META)).resolves.toEqual({ ok: true, id: "db-uuid-1" })
  })

  it("NU raportează succes înainte ca INSERT-ul să fie confirmat", async () => {
    let release: (v: { id: string }) => void = () => {}
    const gate = new Promise<{ id: string }>((resolve) => {
      release = resolve
    })
    const repo = repoReturning(async () => gate)

    const pending = saveDecision(repo, RECORD, META)
    const early = await Promise.race([
      pending.then(() => "resolved" as const),
      new Promise<"pending">((r) => setTimeout(() => r("pending"), 25)),
    ])

    expect(early).toBe("pending")
    release({ id: "db-uuid-2" })
    await expect(pending).resolves.toEqual({ ok: true, id: "db-uuid-2" })
  })

  it("eșec: întoarce mesaj cu detaliul erorii, nu o valoare de succes", async () => {
    const repo = repoReturning(async () => {
      throw new Error("Failed to save decision record: model_id invalid")
    })
    const result = await saveDecision(repo, RECORD, META)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toMatch(/Decizia nu a fost salvată/)
      expect(result.message).toMatch(/model_id invalid/)
    }
  })

  it("răspuns fără id persistent → eșec explicit", async () => {
    const repo = repoReturning(async () => ({ id: "" }))
    const result = await saveDecision(repo, RECORD, META)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toMatch(/fără id persistent/)
  })

  it("eroare non-Error → mesaj generic, fără crash", async () => {
    const repo = repoReturning(async () => {
      throw "boom"
    })
    const result = await saveDecision(repo, RECORD, META)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toBe("Decizia nu a fost salvată. Verifică conexiunea și încearcă din nou.")
  })
})
