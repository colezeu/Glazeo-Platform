// ══════════════════════════════════════════════
// GLAZEO — Validarea metadatelor de salvare (C2)
//
// `model_id` se scrie din definition.id, niciodată dintr-un fallback.
// Regulile de aici oglindesc EXACT constrângerile din migrarea 008:
//   decision_records_model_id_format  ~ '^[A-Za-z0-9][A-Za-z0-9._:-]*$'
//   decision_records_model_id_real    not in ('unknown','undefined','null','n/a','none')
// Astfel, un model invalid e respins în client cu mesaj clar, nu de către bază cu 23514.
// ══════════════════════════════════════════════
import type { DecisionSaveMeta } from "./DecisionRecordRepository"

const PLACEHOLDER_MODEL_IDS = ["unknown", "undefined", "null", "n/a", "none"]
const MODEL_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/

/**
 * Validează meta și întoarce o formă normalizată (trim).
 * Aruncă explicit — caller-ul (saveDecision) transformă eroarea în feedback pentru UI.
 */
export function assertDecisionSaveMeta(meta: DecisionSaveMeta): DecisionSaveMeta {
  if (!meta || typeof meta !== "object") {
    throw new Error("model_id lipsă: este necesar definition.id al modelului")
  }

  const modelId = typeof meta.modelId === "string" ? meta.modelId.trim() : ""

  if (!modelId) {
    throw new Error("model_id lipsă: este necesar definition.id al modelului")
  }
  if (PLACEHOLDER_MODEL_IDS.includes(modelId.toLowerCase())) {
    throw new Error(`model_id invalid ("${modelId}"): valoare placeholder interzisă`)
  }
  if (!MODEL_ID_PATTERN.test(modelId)) {
    throw new Error(`model_id invalid ("${modelId}"): format neacceptat`)
  }

  const modelTitle =
    typeof meta.modelTitle === "string" && meta.modelTitle.trim() ? meta.modelTitle.trim() : modelId

  return { modelId, modelTitle }
}
