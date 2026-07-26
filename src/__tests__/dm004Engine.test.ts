// ══════════════════════════════════════════════
// GLAZEO — DM-004 Engine + Persistence Tests
// ══════════════════════════════════════════════
import { describe, it, expect } from "vitest"
import { evaluateOptions, createDecisionRecord } from "../features/decision-maker/dm004/dm004Engine"
import type { DM004Context } from "../features/decision-maker/dm004/dm004Data"
import { MockDecisionRecordRepository } from "../persistence/MockDecisionRecordRepository"

// ── Engine tests ────────────────────────────────────

describe("DM-004 Engine", () => {
  const defaultCtx: DM004Context = {
    geometry: "niche", accessType: "walk_in", surfaceCondition: "flat",
    accessibility: "standard", maintenance: "no_preference",
  }

  it("recommends all 3 for default niche/walk-in/flat", () => {
    const opts = evaluateOptions(defaultCtx)
    expect(opts.every((o) => o.status === "recommended")).toBe(true)
  })

  it("excludes frameless for sliding door", () => {
    const opts = evaluateOptions({ ...defaultCtx, accessType: "sliding_door" })
    expect(opts.find((o) => o.id === "frameless")!.status).toBe("excluded")
  })

  it("excludes frameless for uneven surface", () => {
    const opts = evaluateOptions({ ...defaultCtx, surfaceCondition: "uneven" })
    expect(opts.find((o) => o.id === "frameless")!.status).toBe("excluded")
  })

  it("excludes stabilized for island geometry", () => {
    const opts = evaluateOptions({ ...defaultCtx, geometry: "island" })
    expect(opts.find((o) => o.id === "stabilized")!.status).toBe("excluded")
  })

  it("not_recommends frameless when maintenance is minimal", () => {
    const opts = evaluateOptions({ ...defaultCtx, maintenance: "minimal" })
    expect(opts.find((o) => o.id === "frameless")!.status).toBe("not_recommended")
  })
})

// ── Persistence compatibility ───────────────────────

describe("DM-004 Persistence", () => {
  it("saves and loads snapshot identically", async () => {
    const repo = new MockDecisionRecordRepository("user-a")
    const ctx: DM004Context = {
      geometry: "corner", accessType: "hinged_door", surfaceCondition: "flat",
      accessibility: "accessible", maintenance: "minimal",
    }
    const options = evaluateOptions(ctx)
    const record = createDecisionRecord(ctx, options, "enclosed")

    await repo.save(record)
    const loaded = await repo.getById(record.id)

    expect(loaded).not.toBeNull()
    const r = loaded as any
    expect(r.id).toBe(record.id)
    expect(r.context.geometry).toBe("corner")
    expect(r.selectedOptionId).toBe("enclosed")
    expect(loaded!.options).toHaveLength(3)
  })

  it("isolation: user B cannot read user A record", async () => {
    const repoA = new MockDecisionRecordRepository("user-a")
    const repoB = new MockDecisionRecordRepository("user-b")
    const ctx: DM004Context = {
      geometry: "niche", accessType: "walk_in", surfaceCondition: "flat",
      accessibility: "standard", maintenance: "no_preference",
    }
    const options = evaluateOptions(ctx)
    const record = createDecisionRecord(ctx, options, "frameless")
    await repoA.save(record)
    const loaded = await repoB.getById(record.id)
    expect(loaded).toBeNull()
  })
})

// ── Schema independence ─────────────────────────────

describe("DM-004 Schema independence", () => {
  it("repository treats DM-004 identically to other models", async () => {
    const repo = new MockDecisionRecordRepository("user-a")
    const ctx: DM004Context = {
      geometry: "niche", accessType: "walk_in", surfaceCondition: "flat",
      accessibility: "standard", maintenance: "no_preference",
    }
    const options = evaluateOptions(ctx)
    const record = createDecisionRecord(ctx, options, "frameless")
    await repo.save(record)

    const summaries = await repo.listByUser()
    expect(summaries).toHaveLength(1)
    // Model ID comes from record metadata (repo-level), not from a model-specific branch
    expect(summaries[0].id).toBe(record.id)
    expect(summaries[0].selectedOptionName).not.toBeNull()
  })
})
