// ══════════════════════════════════════════════
// GLAZEO — Validarea model_id (C2)
// Regulile oglindesc constrângerile din migrarea 008; un model invalid trebuie
// respins în client, cu mesaj clar, nu de către bază cu 23514.
// ══════════════════════════════════════════════
import { describe, it, expect } from "vitest"
import { assertDecisionSaveMeta } from "../persistence/decisionSaveMeta"

describe("assertDecisionSaveMeta", () => {
  it("acceptă identificatorii reali ai modelelor DM", () => {
    for (const id of ["walk_in_shower", "glass_balustrade", "meeting_room_partition", "facade_glazing_strategy", "dm-004"]) {
      expect(assertDecisionSaveMeta({ modelId: id, modelTitle: "T" }).modelId).toBe(id)
    }
  })

  it("normalizează prin trim", () => {
    expect(assertDecisionSaveMeta({ modelId: "  walk_in_shower  ", modelTitle: " T " })).toEqual({
      modelId: "walk_in_shower",
      modelTitle: "T",
    })
  })

  it("respinge valorile placeholder interzise de baza de date", () => {
    for (const id of ["unknown", "UNKNOWN", "undefined", "null", "n/a", "none"]) {
      expect(() => assertDecisionSaveMeta({ modelId: id, modelTitle: "T" })).toThrow(/placeholder/i)
    }
  })

  it("respinge model_id gol sau doar spații", () => {
    expect(() => assertDecisionSaveMeta({ modelId: "", modelTitle: "T" })).toThrow(/model_id lipsă/i)
    expect(() => assertDecisionSaveMeta({ modelId: "   ", modelTitle: "T" })).toThrow(/model_id lipsă/i)
  })

  it("respinge formatele neacceptate de constrângerea din 008", () => {
    for (const id of ["-leading-dash", "with space", "diacritic-ș", "a/b"]) {
      expect(() => assertDecisionSaveMeta({ modelId: id, modelTitle: "T" })).toThrow(/format neacceptat/i)
    }
  })

  it("respinge meta absentă (nu inventează un fallback)", () => {
    expect(() => assertDecisionSaveMeta(undefined as never)).toThrow(/model_id lipsă/i)
    expect(() => assertDecisionSaveMeta(null as never)).toThrow(/model_id lipsă/i)
  })

  it("completează modelTitle cu modelId când titlul lipsește", () => {
    expect(assertDecisionSaveMeta({ modelId: "dm-004", modelTitle: "   " }).modelTitle).toBe("dm-004")
  })
})
