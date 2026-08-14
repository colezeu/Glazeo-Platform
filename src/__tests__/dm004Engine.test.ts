// ══════════════════════════════════════════════
// GLAZEO — DM-004 Engine Tests v2
// 3 sisteme réale: paravan, batanta, culisant.
// stabilized eliminat — e parametru al paravanului.
// ══════════════════════════════════════════════
import { describe, it, expect } from "vitest"
import { evaluateOptions, createDecisionRecord } from "../features/decision-maker/dm004/dm004Engine"
import type { DM004Context } from "../features/decision-maker/dm004/dm004Data"
import { MockDecisionRecordRepository } from "../persistence/MockDecisionRecordRepository"

// ══════════════════════════════════════════════
// Engine: Paravan Fix
// ══════════════════════════════════════════════

describe("DM-004 Engine — paravan", () => {
  const baseCtx: DM004Context = {
    geometry: "niche",
    surfaceCondition: "flat",
    accessibility: "standard",
    maintenance: "no_preference",
    stabilizationBar: "no",
  }

  it("recommends paravan for standard niche, flat surface", () => {
    const opts = evaluateOptions(baseCtx)
    const p = opts.find((o) => o.id === "paravan")!
    expect(p.status).toBe("recommended")
  })

  it("excludes paravan for island geometry", () => {
    const ctx = { ...baseCtx, geometry: "island" as const }
    const opts = evaluateOptions(ctx)
    const p = opts.find((o) => o.id === "paravan")!
    expect(p.status).toBe("excluded")
    expect(p.reason).toContain("insulă")
  })

  it("excludes paravan for uneven surface without stabilization bar", () => {
    const ctx = { ...baseCtx, surfaceCondition: "uneven" as const }
    const opts = evaluateOptions(ctx)
    const p = opts.find((o) => o.id === "paravan")!
    expect(p.status).toBe("excluded")
    expect(p.reason).toContain("bară")
  })

  it("recommends paravan for uneven surface WITH stabilization bar", () => {
    const ctx = { ...baseCtx, surfaceCondition: "uneven" as const, stabilizationBar: "yes" as const }
    const opts = evaluateOptions(ctx)
    const p = opts.find((o) => o.id === "paravan")!
    expect(p.status).toBe("recommended")
    expect(p.reason).toContain("bară")
  })

  it("recommends paravan with ENDURO-Shield note when maintenance is minimal", () => {
    const ctx = { ...baseCtx, maintenance: "minimal" as const }
    const opts = evaluateOptions(ctx)
    const p = opts.find((o) => o.id === "paravan")!
    expect(p.status).toBe("recommended")
    expect(p.reason).toContain("ENDURO")
  })
})

// ══════════════════════════════════════════════
// Engine: Ușă Batantă
// ══════════════════════════════════════════════

describe("DM-004 Engine — batanta", () => {
  const baseCtx: DM004Context = {
    geometry: "niche",
    surfaceCondition: "flat",
    accessibility: "standard",
    maintenance: "no_preference",
    stabilizationBar: "no",
  }

  it("recommends batanta for standard niche", () => {
    const opts = evaluateOptions(baseCtx)
    const b = opts.find((o) => o.id === "batanta")!
    expect(b.status).toBe("recommended")
  })

  it("excludes batanta for island geometry", () => {
    const ctx = { ...baseCtx, geometry: "island" as const }
    const opts = evaluateOptions(ctx)
    const b = opts.find((o) => o.id === "batanta")!
    expect(b.status).toBe("excluded")
    expect(b.reason).toContain("perete")
  })

  it("not_recommends batanta when accessibility is required", () => {
    const ctx = { ...baseCtx, accessibility: "accessible" as const }
    const opts = evaluateOptions(ctx)
    const b = opts.find((o) => o.id === "batanta")!
    expect(b.status).toBe("not_recommended")
    expect(b.reason).toContain("manevră")
  })
})

// ══════════════════════════════════════════════
// Engine: Ușă Glisantă
// ══════════════════════════════════════════════

describe("DM-004 Engine — culisant", () => {
  const baseCtx: DM004Context = {
    geometry: "niche",
    surfaceCondition: "flat",
    accessibility: "standard",
    maintenance: "no_preference",
    stabilizationBar: "no",
  }

  it("recommends culisant as the only option for island geometry", () => {
    const ctx = { ...baseCtx, geometry: "island" as const }
    const opts = evaluateOptions(ctx)
    const c = opts.find((o) => o.id === "culisant")!
    expect(c.status).toBe("recommended")
    expect(c.reason).toContain("Singura")
  })

  it("not_recommends culisant when maintenance is minimal", () => {
    const ctx = { ...baseCtx, maintenance: "minimal" as const }
    const opts = evaluateOptions(ctx)
    const c = opts.find((o) => o.id === "culisant")!
    expect(c.status).toBe("not_recommended")
    expect(c.reason).toContain("calcar")
  })

  it("recommends culisant for accessible needs", () => {
    const ctx = { ...baseCtx, accessibility: "accessible" as const }
    const opts = evaluateOptions(ctx)
    const c = opts.find((o) => o.id === "culisant")!
    expect(c.status).toBe("recommended")
    expect(c.reason).toContain("manevră")
  })

  it("keeps culisant recommended for island geometry even with minimal maintenance", () => {
    const ctx = { ...baseCtx, geometry: "island" as const, maintenance: "minimal" as const }
    const opts = evaluateOptions(ctx)
    const c = opts.find((o) => o.id === "culisant")!
    expect(c.status).toBe("recommended")
    expect(c.reason).toContain("Singura")
    expect(c.reason).toContain("curățare")
  })

  it("island + minimal maintenance yields exactly one recommended option (culisant)", () => {
    const ctx = { ...baseCtx, geometry: "island" as const, maintenance: "minimal" as const }
    const opts = evaluateOptions(ctx)
    const recommended = opts.filter((o) => o.status === "recommended")
    expect(recommended).toHaveLength(1)
    expect(recommended[0].id).toBe("culisant")
  })
})

// ══════════════════════════════════════════════
// Completeness + Regression
// ══════════════════════════════════════════════

describe("DM-004 Engine — completeness", () => {
  it("always returns exactly 3 options", () => {
    const ctx: DM004Context = {
      geometry: "niche",
      surfaceCondition: "flat",
      accessibility: "standard",
      maintenance: "no_preference",
      stabilizationBar: "no",
    }
    const opts = evaluateOptions(ctx)
    expect(opts).toHaveLength(3)
    expect(opts.map((o) => o.id).sort()).toEqual(["batanta", "culisant", "paravan"])
  })

  it("stabilized is NOT present as an option", () => {
    const ctx: DM004Context = {
      geometry: "niche",
      surfaceCondition: "flat",
      accessibility: "standard",
      maintenance: "no_preference",
      stabilizationBar: "no",
    }
    const opts = evaluateOptions(ctx)
    expect(opts.find((o) => o.id === "stabilized")).toBeUndefined()
    expect(opts.find((o) => o.id === "frameless")).toBeUndefined()
    expect(opts.find((o) => o.id === "enclosed")).toBeUndefined()
  })

  it("island geometry: paravan excluded, batanta excluded, culisant is the only option", () => {
    const ctx: DM004Context = {
      geometry: "island",
      surfaceCondition: "flat",
      accessibility: "standard",
      maintenance: "no_preference",
      stabilizationBar: "no",
    }
    const opts = evaluateOptions(ctx)
    expect(opts.find((o) => o.id === "paravan")!.status).toBe("excluded")
    expect(opts.find((o) => o.id === "batanta")!.status).toBe("excluded")
    expect(opts.find((o) => o.id === "culisant")!.status).toBe("recommended")
  })
})

// ══════════════════════════════════════════════
// Decision Record
// ══════════════════════════════════════════════

describe("DM-004 Engine — Decision Record", () => {
  it("creates a Decision Record with stabilization bar note when enabled", () => {
    const ctx: DM004Context = {
      geometry: "niche",
      surfaceCondition: "flat",
      accessibility: "standard",
      maintenance: "no_preference",
      stabilizationBar: "yes",
    }
    const opts = evaluateOptions(ctx)
    const record = createDecisionRecord(ctx, opts, "paravan")

    expect(record.id).toMatch(/^DM-\d+$/)
    expect(record.selectedOptionId).toBe("paravan")
    expect(record.lessons.some((l) => l.includes("stabilizare"))).toBe(true)
  })

  it("includes ENDURO-Shield next step when maintenance is minimal", () => {
    const ctx: DM004Context = {
      geometry: "niche",
      surfaceCondition: "flat",
      accessibility: "standard",
      maintenance: "minimal",
      stabilizationBar: "no",
    }
    const opts = evaluateOptions(ctx)
    const record = createDecisionRecord(ctx, opts, "paravan")
    expect(record.nextSteps.some((s) => s.includes("ENDURO"))).toBe(true)
  })

  it("includes culisant variant choice in next steps", () => {
    const ctx: DM004Context = {
      geometry: "island",
      surfaceCondition: "flat",
      accessibility: "standard",
      maintenance: "no_preference",
      stabilizationBar: "no",
    }
    const opts = evaluateOptions(ctx)
    const record = createDecisionRecord(ctx, opts, "culisant")
    expect(record.nextSteps.some((s) => s.includes("cărucioare"))).toBe(true)
  })

  it("throws for invalid option ID", () => {
    const ctx: DM004Context = {
      geometry: "niche",
      surfaceCondition: "flat",
      accessibility: "standard",
      maintenance: "no_preference",
      stabilizationBar: "no",
    }
    const opts = evaluateOptions(ctx)
    expect(() => createDecisionRecord(ctx, opts, "stabilized")).toThrow()
  })
})

// ══════════════════════════════════════════════
// Persistence (unchanged logic, new types)
// ══════════════════════════════════════════════

describe("DM-004 Persistence", () => {
  it("saves and loads snapshot identically", async () => {
    const repo = new MockDecisionRecordRepository("user-a")
    const ctx: DM004Context = {
      geometry: "corner",
      surfaceCondition: "flat",
      accessibility: "accessible",
      maintenance: "minimal",
      stabilizationBar: "yes",
    }
    const options = evaluateOptions(ctx)
    const record = createDecisionRecord(ctx, options, "culisant")

    await repo.save(record)
    const loaded = await repo.getById(record.id)

    expect(loaded).not.toBeNull()
    const r = loaded as any
    expect(r.id).toBe(record.id)
    expect(r.context.geometry).toBe("corner")
    expect(r.selectedOptionId).toBe("culisant")
    expect(loaded!.options).toHaveLength(3)
  })

  it("isolation: user B cannot read user A record", async () => {
    const repoA = new MockDecisionRecordRepository("user-a")
    const repoB = new MockDecisionRecordRepository("user-b")
    const ctx: DM004Context = {
      geometry: "niche",
      surfaceCondition: "flat",
      accessibility: "standard",
      maintenance: "no_preference",
      stabilizationBar: "no",
    }
    const options = evaluateOptions(ctx)
    const record = createDecisionRecord(ctx, options, "paravan")
    await repoA.save(record)
    const loaded = await repoB.getById(record.id)
    expect(loaded).toBeNull()
  })

  it("repository treats DM-004 identically to other models", async () => {
    const repo = new MockDecisionRecordRepository("user-a")
    const ctx: DM004Context = {
      geometry: "niche",
      surfaceCondition: "flat",
      accessibility: "standard",
      maintenance: "no_preference",
      stabilizationBar: "no",
    }
    const options = evaluateOptions(ctx)
    const record = createDecisionRecord(ctx, options, "paravan")
    await repo.save(record)

    const summaries = await repo.listByUser()
    expect(summaries).toHaveLength(1)
    expect(summaries[0].id).toBe(record.id)
    expect(summaries[0].selectedOptionName).not.toBeNull()
  })
})
