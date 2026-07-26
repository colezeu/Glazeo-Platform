// ══════════════════════════════════════════════
// GLAZEO — DM-001 Engine Tests (Phase 4B)
// ══════════════════════════════════════════════
import { describe, it, expect } from "vitest"
import { evaluateOptions, createDecisionRecord } from "../features/decision-maker/dm001/dm001Engine"
import type { DM001Context } from "../features/decision-maker/dm001/dm001Data"

// ── Frameless recommended ──────────────────────────

describe("DM-001 Engine — frameless recommended", () => {
  const ctx: DM001Context = {
    ceilingType: "structural",
    doorTraffic: "moderate",
    acousticNeed: "visual_only",
    noiseNearby: false,
  }

  it("recommends frameless when ceiling is structural and acoustic is visual_only", () => {
    const options = evaluateOptions(ctx)
    const frameless = options.find((o) => o.id === "frameless")!
    expect(frameless.status).toBe("recommended")
    expect(frameless.reason).toContain("Recomandat")
  })

  it("recommends frameless with conversational acoustic (with note)", () => {
    const ctx2: DM001Context = { ...ctx, acousticNeed: "conversational" }
    const options = evaluateOptions(ctx2)
    const frameless = options.find((o) => o.id === "frameless")!
    expect(frameless.status).toBe("recommended")
    expect(frameless.reason).toContain("observații")
    expect(frameless.reason).toContain("Acustica")
  })

  it("recommends frameless when ceiling is unknown (with note)", () => {
    const ctx2: DM001Context = { ...ctx, ceilingType: "unknown" }
    const options = evaluateOptions(ctx2)
    const frameless = options.find((o) => o.id === "frameless")!
    expect(frameless.status).toBe("recommended")
    expect(frameless.reason).toContain("necunoscut")
  })
})

// ── Frameless rejected ─────────────────────────────

describe("DM-001 Engine — frameless rejected", () => {
  it("rejects frameless when acoustic need is confidential", () => {
    const ctx: DM001Context = {
      ceilingType: "structural",
      doorTraffic: "moderate",
      acousticNeed: "confidential",
      noiseNearby: false,
    }
    const options = evaluateOptions(ctx)
    const frameless = options.find((o) => o.id === "frameless")!
    expect(frameless.status).toBe("not_recommended")
    expect(frameless.reason).toContain("confidențială")
  })

  it("rejects frameless when ceiling is suspended", () => {
    const ctx: DM001Context = {
      ceilingType: "suspended",
      doorTraffic: "moderate",
      acousticNeed: "visual_only",
      noiseNearby: false,
    }
    const options = evaluateOptions(ctx)
    const frameless = options.find((o) => o.id === "frameless")!
    expect(frameless.status).toBe("not_recommended")
    expect(frameless.reason).toContain("suspendat")
  })
})

// ── Spider evaluation ──────────────────────────────

describe("DM-001 Engine — spider", () => {
  it("rejects spider when traffic is intense", () => {
    const ctx: DM001Context = {
      ceilingType: "structural",
      doorTraffic: "intense",
      acousticNeed: "visual_only",
      noiseNearby: false,
    }
    const options = evaluateOptions(ctx)
    const spider = options.find((o) => o.id === "spider")!
    expect(spider.status).toBe("not_recommended")
    expect(spider.reason).toContain("trafic intens")
  })

  it("rejects spider when noise nearby is true", () => {
    const ctx: DM001Context = {
      ceilingType: "structural",
      doorTraffic: "moderate",
      acousticNeed: "visual_only",
      noiseNearby: true,
    }
    const options = evaluateOptions(ctx)
    const spider = options.find((o) => o.id === "spider")!
    expect(spider.status).toBe("not_recommended")
    expect(spider.reason).toContain("Zgomotul")
  })

  it("recommends spider as industrial statement when conditions are met", () => {
    const ctx: DM001Context = {
      ceilingType: "structural",
      doorTraffic: "moderate",
      acousticNeed: "visual_only",
      noiseNearby: false,
    }
    const options = evaluateOptions(ctx)
    const spider = options.find((o) => o.id === "spider")!
    expect(spider.status).toBe("recommended")
    expect(spider.reason).toContain("industrial")
  })
})

// ── Aluminum evaluation ────────────────────────────

describe("DM-001 Engine — aluminum", () => {
  it("recommends aluminum for confidential acoustic needs", () => {
    const ctx: DM001Context = {
      ceilingType: "structural",
      doorTraffic: "moderate",
      acousticNeed: "confidential",
      noiseNearby: true,
    }
    const options = evaluateOptions(ctx)
    const aluminum = options.find((o) => o.id === "aluminum")!
    expect(aluminum.status).toBe("recommended")
    expect(aluminum.reason).toContain("confidențialitate")
  })

  it("recommends aluminum for suspended ceiling", () => {
    const ctx: DM001Context = {
      ceilingType: "suspended",
      doorTraffic: "moderate",
      acousticNeed: "visual_only",
      noiseNearby: false,
    }
    const options = evaluateOptions(ctx)
    const aluminum = options.find((o) => o.id === "aluminum")!
    expect(aluminum.status).toBe("recommended")
    expect(aluminum.reason).toContain("iertător")
  })
})

// ── Decision Record ────────────────────────────

describe("DM-001 Engine — Decision Record", () => {
  it("creates a Decision Record snapshot", () => {
    const ctx: DM001Context = {
      ceilingType: "structural",
      doorTraffic: "moderate",
      acousticNeed: "visual_only",
      noiseNearby: false,
    }
    const options = evaluateOptions(ctx)
    const record = createDecisionRecord(ctx, options, "frameless")

    expect(record.id).toMatch(/^DM-\d{3}$/)
    expect(record.selectedOptionId).toBe("frameless")
    expect(record.context).toEqual(ctx)
    expect(record.acceptedTradeoffs.length).toBeGreaterThan(0)
    expect(record.lessons.length).toBeGreaterThan(0)
    expect(record.nextSteps.length).toBeGreaterThan(0)
    expect(record.options).toEqual(options)
  })

  it("throws for invalid option ID", () => {
    const ctx: DM001Context = {
      ceilingType: "structural",
      doorTraffic: "moderate",
      acousticNeed: "visual_only",
      noiseNearby: false,
    }
    const options = evaluateOptions(ctx)
    expect(() => createDecisionRecord(ctx, options, "nonexistent")).toThrow()
  })
})

// ── All 3 options always present ────────────────────

describe("DM-001 Engine — completeness", () => {
  it("always returns exactly 3 options", () => {
    const ctx: DM001Context = {
      ceilingType: "structural",
      doorTraffic: "moderate",
      acousticNeed: "visual_only",
      noiseNearby: false,
    }
    const options = evaluateOptions(ctx)
    expect(options).toHaveLength(3)
    expect(options.map((o) => o.id).sort()).toEqual(["aluminum", "frameless", "spider"])
  })
})

// ── Decision Record immutability ────────────────────

describe("DM-001 Engine — Decision Record immutability", () => {
  it("is independent copy — modifying context after creation does not change the record", () => {
    const ctx: DM001Context = {
      ceilingType: "structural",
      doorTraffic: "moderate",
      acousticNeed: "visual_only",
      noiseNearby: false,
    }
    const options = evaluateOptions(ctx)
    const record = createDecisionRecord(ctx, options, "frameless")

    // Modifică contextul după crearea recordului
    ctx.acousticNeed = "confidential"
    ctx.ceilingType = "suspended"

    // Recordul rămâne neschimbat
    expect(record.context.acousticNeed).toBe("visual_only")
    expect(record.context.ceilingType).toBe("structural")
  })
})
