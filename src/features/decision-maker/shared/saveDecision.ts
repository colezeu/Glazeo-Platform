// ══════════════════════════════════════════════
// GLAZEO — Decision save orchestration (C3)
// Succesul este raportat EXCLUSIV după ce repository-ul confirmă INSERT-ul
// și întoarce cheia persistentă. Erorile devin mesaj pentru utilizator,
// niciodată înghițite în tăcere.
// ══════════════════════════════════════════════
import type { DecisionRecord } from "./decisionModelTypes"
import type { DecisionRecordRepository, DecisionSaveMeta } from "../../../persistence/DecisionRecordRepository"

export type SaveDecisionResult = { ok: true; id: string } | { ok: false; message: string }

const GENERIC_MESSAGE = "Decizia nu a fost salvată. Verifică conexiunea și încearcă din nou."

export async function saveDecision(
  repo: DecisionRecordRepository,
  record: DecisionRecord,
  meta: DecisionSaveMeta,
): Promise<SaveDecisionResult> {
  try {
    const result = await repo.save(record, meta)
    const id = result && typeof result.id === "string" ? result.id : ""
    if (!id) {
      return { ok: false, message: `${GENERIC_MESSAGE} (răspuns fără id persistent)` }
    }
    return { ok: true, id }
  } catch (error) {
    const detail = error instanceof Error && error.message ? error.message : null
    return { ok: false, message: detail ? `${GENERIC_MESSAGE} (${detail})` : GENERIC_MESSAGE }
  }
}
