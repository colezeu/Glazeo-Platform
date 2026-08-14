// ══════════════════════════════════════════════
// GLAZEO — DM-002 Engine Tests v3
// 5 scenarii tehnice de validare + unit tests
// ══════════════════════════════════════════════
import { describe, it, expect } from "vitest"
import { evaluateOptions, createDecisionRecord } from "../features/decision-maker/dm002/dm002Engine"
import type { DM002Context } from "../features/decision-maker/dm002/dm002Data"

// ══════════════════════════════════════════════
// Scenariile de validare (5)
// ══════════════════════════════════════════════

describe("DM-002 Validation Scenarios", () => {

  // ── Scenariul 1: Interior, beton, plan, 1-3m, fără mână curentă, estetică ──
  it("S1: Interior balcony, flat concrete, 1-3m, no handrail, aesthetics priority → butoni", () => {
    const ctx: DM002Context = {
      location: "interior",
      heightCategory: "1_3m",
      surfaceType: "concrete",
      surfaceCondition: "flat",
      handrailNeed: "no",
      budgetPriority: "aesthetics",
    }
    const opts = evaluateOptions(ctx)

    const butoni = opts.find((o) => o.id === "butoni")!
    expect(butoni.status).toBe("recommended")
    expect(butoni.reason).toContain("transparență maximă")

    // Mini-montanții ar trebui să fie nerecomandați (estetica e prioritară și suprafața e plană)
    const mini = opts.find((o) => o.id === "mini-montanti")!
    expect(mini.status).toBe("not_recommended")

    // Profilul cu cale ar trebui să fie nerecomandat pe suprafață plană la interior
    const cale = opts.find((o) => o.id === "profil-cale")!
    expect(cale.status).toBe("not_recommended")
  })

  // ── Scenariul 2: Exterior, beton, peste_3m, mână curentă obligatorie, echilibrat ──
  it("S2: Exterior terrace, concrete, >3m, mandatory handrail, balanced → profil-cale or profil-reglaj", () => {
    const ctx: DM002Context = {
      location: "exterior",
      heightCategory: "peste_3m",
      surfaceType: "concrete",
      surfaceCondition: "flat",
      handrailNeed: "yes_mandatory",
      budgetPriority: "balanced",
    }
    const opts = evaluateOptions(ctx)

    // Butonii EXCLUȘI — exterior + peste_3m
    const butoni = opts.find((o) => o.id === "butoni")!
    expect(butoni.status).toBe("excluded")

    // Mini-montanții nerecomandați — exterior + peste_3m
    const mini = opts.find((o) => o.id === "mini-montanti")!
    expect(mini.status).toBe("not_recommended")

    // Profil cale recomandat
    const cale = opts.find((o) => o.id === "profil-cale")!
    expect(cale.status).toBe("recommended")

    // Reglaj mecanic nerecomandat — suprafața e plană, nu justifică costul
    const reglaj = opts.find((o) => o.id === "profil-reglaj")!
    expect(reglaj.status).toBe("not_recommended")
  })

  // ── Scenariul 3: Interior, lemn, sub_1m, mână curentă opțională, cost prioritar ──
  it("S3: Interior stairs, wood floor, <1m, optional handrail, cost priority → mini-montanti or profil-cale", () => {
    const ctx: DM002Context = {
      location: "interior",
      heightCategory: "sub_1m",
      surfaceType: "wood_composite",
      surfaceCondition: "flat",
      handrailNeed: "yes_optional",
      budgetPriority: "cost",
    }
    const opts = evaluateOptions(ctx)

    // Butonii EXCLUȘI — ancorare imposibilă în lemn
    const butoni = opts.find((o) => o.id === "butoni")!
    expect(butoni.status).toBe("excluded")
    expect(butoni.reason).toContain("ancorare")

    // Mini-montanții — nerecomandați (ancorare limitată), nu excluși
    const mini = opts.find((o) => o.id === "mini-montanti")!
    expect(mini.status).toBe("not_recommended")

    // Profil cale recomandat
    const cale = opts.find((o) => o.id === "profil-cale")!
    expect(cale.status).toBe("recommended")
    expect(cale.reason).toContain("calitate/preț")

    // Reglaj mecanic nerecomandat — prea scump când bugetul e prioritar
    const reglaj = opts.find((o) => o.id === "profil-reglaj")!
    expect(reglaj.status).toBe("not_recommended")
    expect(reglaj.reason).toContain("3x")
  })

  // ── Scenariul 4: Exterior, beton, denivelări severe, 1-3m, mână curentă obligatorie, echilibrat ──
  it("S4: Exterior balcony, severely uneven concrete, 1-3m, mandatory handrail, balanced → profil-reglaj", () => {
    const ctx: DM002Context = {
      location: "exterior",
      heightCategory: "1_3m",
      surfaceType: "concrete",
      surfaceCondition: "severely_uneven",
      handrailNeed: "yes_mandatory",
      budgetPriority: "balanced",
    }
    const opts = evaluateOptions(ctx)

    // Butonii EXCLUȘI — denivelări severe
    const butoni = opts.find((o) => o.id === "butoni")!
    expect(butoni.status).toBe("excluded")
    expect(butoni.reason).toContain("necesită")

    // Mini-montanții nerecomandați — denivelări severe
    const mini = opts.find((o) => o.id === "mini-montanti")!
    expect(mini.status).toBe("not_recommended")

    // Profil cale recomandat
    const cale = opts.find((o) => o.id === "profil-cale")!
    expect(cale.status).toBe("recommended")

    // Reglaj mecanic recomandat — denivelări severe + exterior
    const reglaj = opts.find((o) => o.id === "profil-reglaj")!
    expect(reglaj.status).toBe("recommended")
    expect(reglaj.reason).toContain("denivelări")
  })

  // ── Scenariul 5: Interior, structură metalică, plan, 1-3m, fără mână curentă, echilibrat ──
  it("S5: Interior loft, steel structure, flat, 1-3m, no handrail, balanced → butoni or mini-montanti", () => {
    const ctx: DM002Context = {
      location: "interior",
      heightCategory: "1_3m",
      surfaceType: "steel",
      surfaceCondition: "flat",
      handrailNeed: "no",
      budgetPriority: "balanced",
    }
    const opts = evaluateOptions(ctx)

    // Butonii recomandați — interior, plan, metal = ancorare bună
    const butoni = opts.find((o) => o.id === "butoni")!
    expect(butoni.status).toBe("recommended")

    // Mini-montanții recomandați ca alternativă solidă
    const mini = opts.find((o) => o.id === "mini-montanti")!
    expect(mini.status).toBe("recommended")

    // Profil cale nerecomandat — suprafață plană la interior, aspectul contează
    const cale = opts.find((o) => o.id === "profil-cale")!
    expect(cale.status).toBe("not_recommended")

    // Reglaj mecanic nerecomandat — overkill pe suprafață plană
    const reglaj = opts.find((o) => o.id === "profil-reglaj")!
    expect(reglaj.status).toBe("not_recommended")
  })
})

// ══════════════════════════════════════════════
// Unit Tests: Butoni
// ══════════════════════════════════════════════

describe("DM-002 Engine — butoni", () => {
  const baseCtx: DM002Context = {
    location: "interior",
    heightCategory: "1_3m",
    surfaceType: "concrete",
    surfaceCondition: "flat",
    handrailNeed: "no",
    budgetPriority: "balanced",
  }

  it("recommends butoni for ideal interior conditions", () => {
    const opts = evaluateOptions(baseCtx)
    const butoni = opts.find((o) => o.id === "butoni")!
    expect(butoni.status).toBe("recommended")
  })

  it("excludes butoni on wood/composite surface", () => {
    const ctx = { ...baseCtx, surfaceType: "wood_composite" as const }
    const opts = evaluateOptions(ctx)
    const butoni = opts.find((o) => o.id === "butoni")!
    expect(butoni.status).toBe("excluded")
    expect(butoni.reason).toContain("ancorare")
  })

  it("excludes butoni for exterior + height >3m", () => {
    const ctx = { ...baseCtx, location: "exterior" as const, heightCategory: "peste_3m" as const }
    const opts = evaluateOptions(ctx)
    const butoni = opts.find((o) => o.id === "butoni")!
    expect(butoni.status).toBe("excluded")
    expect(butoni.reason).toContain("Wind load")
  })

  it("excludes butoni for severely uneven surface", () => {
    const ctx = { ...baseCtx, surfaceCondition: "severely_uneven" as const }
    const opts = evaluateOptions(ctx)
    const butoni = opts.find((o) => o.id === "butoni")!
    expect(butoni.status).toBe("excluded")
    expect(butoni.reason).toContain("plană")
  })

  it("not_recommends butoni for minor uneven surface", () => {
    const ctx = { ...baseCtx, surfaceCondition: "minor_uneven" as const }
    const opts = evaluateOptions(ctx)
    const butoni = opts.find((o) => o.id === "butoni")!
    expect(butoni.status).toBe("not_recommended")
  })

  it("recommends butoni with caveats for exterior + 1-3m", () => {
    const ctx = { ...baseCtx, location: "exterior" as const, heightCategory: "1_3m" as const }
    const opts = evaluateOptions(ctx)
    const butoni = opts.find((o) => o.id === "butoni")!
    expect(butoni.status).toBe("recommended")
    expect(butoni.reason).toContain("observații")
    expect(butoni.reason).toContain("882")
  })

  it("recommends butoni when budget is priority", () => {
    const ctx = { ...baseCtx, budgetPriority: "cost" as const }
    const opts = evaluateOptions(ctx)
    const butoni = opts.find((o) => o.id === "butoni")!
    expect(butoni.status).toBe("recommended")
    expect(butoni.reason).toContain("35 RON")
  })

  it("does not recommend butoni when surface condition is unknown", () => {
    const ctx = { ...baseCtx, surfaceCondition: "unknown" as const }
    const opts = evaluateOptions(ctx)
    const butoni = opts.find((o) => o.id === "butoni")!
    expect(butoni.status).toBe("not_recommended")
    expect(butoni.reason).toContain("Măsoară")
  })

  it("does not recommend butoni when surface type is unknown", () => {
    const ctx = { ...baseCtx, surfaceType: "unknown" as const }
    const opts = evaluateOptions(ctx)
    const butoni = opts.find((o) => o.id === "butoni")!
    expect(butoni.status).toBe("not_recommended")
    expect(butoni.reason).toContain("substrat")
  })
})

// ══════════════════════════════════════════════
// Unit Tests: Mini-Montanți
// ══════════════════════════════════════════════

describe("DM-002 Engine — mini-montanti", () => {
  const baseCtx: DM002Context = {
    location: "interior",
    heightCategory: "1_3m",
    surfaceType: "concrete",
    surfaceCondition: "minor_uneven",
    handrailNeed: "no",
    budgetPriority: "balanced",
  }

  it("recommends mini-montanti on minor uneven surface", () => {
    const opts = evaluateOptions(baseCtx)
    const mini = opts.find((o) => o.id === "mini-montanti")!
    expect(mini.status).toBe("recommended")
  })

  it("not_recommends mini-montanti on wood surface", () => {
    const ctx = { ...baseCtx, surfaceType: "wood_composite" as const }
    const opts = evaluateOptions(ctx)
    const mini = opts.find((o) => o.id === "mini-montanti")!
    expect(mini.status).toBe("not_recommended")
  })

  it("not_recommends mini-montanti for exterior + >3m", () => {
    const ctx = { ...baseCtx, location: "exterior" as const, heightCategory: "peste_3m" as const }
    const opts = evaluateOptions(ctx)
    const mini = opts.find((o) => o.id === "mini-montanti")!
    expect(mini.status).toBe("not_recommended")
  })

  it("not_recommends mini-montanti when aesthetics priority on flat surface (butoni better)", () => {
    const ctx = { ...baseCtx, surfaceCondition: "flat" as const, budgetPriority: "aesthetics" as const }
    const opts = evaluateOptions(ctx)
    const mini = opts.find((o) => o.id === "mini-montanti")!
    expect(mini.status).toBe("not_recommended")
  })
})

// ══════════════════════════════════════════════
// Unit Tests: Profil Cale
// ══════════════════════════════════════════════

describe("DM-002 Engine — profil-cale", () => {
  it("recommends profil-cale for exterior", () => {
    const ctx: DM002Context = {
      location: "exterior",
      heightCategory: "1_3m",
      surfaceType: "concrete",
      surfaceCondition: "minor_uneven",
      handrailNeed: "no",
      budgetPriority: "balanced",
    }
    const opts = evaluateOptions(ctx)
    const cale = opts.find((o) => o.id === "profil-cale")!
    expect(cale.status).toBe("recommended")
    expect(cale.reason).toContain("exterior")
  })

  it("recommends profil-cale for height >3m", () => {
    const ctx: DM002Context = {
      location: "exterior",
      heightCategory: "peste_3m",
      surfaceType: "concrete",
      surfaceCondition: "flat",
      handrailNeed: "no",
      budgetPriority: "balanced",
    }
    const opts = evaluateOptions(ctx)
    const cale = opts.find((o) => o.id === "profil-cale")!
    expect(cale.status).toBe("recommended")
    expect(cale.reason).toContain("înălțimi mari")
  })

  it("not_recommends profil-cale on flat interior with aesthetics priority (overkill)", () => {
    const ctx: DM002Context = {
      location: "interior",
      heightCategory: "1_3m",
      surfaceType: "concrete",
      surfaceCondition: "flat",
      handrailNeed: "no",
      budgetPriority: "aesthetics",
    }
    const opts = evaluateOptions(ctx)
    const cale = opts.find((o) => o.id === "profil-cale")!
    expect(cale.status).toBe("not_recommended")
  })
})

// ══════════════════════════════════════════════
// Unit Tests: Profil Reglaj
// ══════════════════════════════════════════════

describe("DM-002 Engine — profil-reglaj", () => {
  it("recommends profil-reglaj for severely uneven surface", () => {
    const ctx: DM002Context = {
      location: "interior",
      heightCategory: "1_3m",
      surfaceType: "concrete",
      surfaceCondition: "severely_uneven",
      handrailNeed: "no",
      budgetPriority: "balanced",
    }
    const opts = evaluateOptions(ctx)
    const reglaj = opts.find((o) => o.id === "profil-reglaj")!
    expect(reglaj.status).toBe("recommended")
    expect(reglaj.reason).toContain("denivelări")
  })

  it("not_recommends profil-reglaj on flat surface (overkill)", () => {
    const ctx: DM002Context = {
      location: "interior",
      heightCategory: "1_3m",
      surfaceType: "concrete",
      surfaceCondition: "flat",
      handrailNeed: "no",
      budgetPriority: "balanced",
    }
    const opts = evaluateOptions(ctx)
    const reglaj = opts.find((o) => o.id === "profil-reglaj")!
    expect(reglaj.status).toBe("not_recommended")
  })

  it("not_recommends profil-reglaj when budget is priority (3x too expensive)", () => {
    const ctx: DM002Context = {
      location: "interior",
      heightCategory: "1_3m",
      surfaceType: "concrete",
      surfaceCondition: "minor_uneven",
      handrailNeed: "no",
      budgetPriority: "cost",
    }
    const opts = evaluateOptions(ctx)
    const reglaj = opts.find((o) => o.id === "profil-reglaj")!
    expect(reglaj.status).toBe("not_recommended")
    expect(reglaj.reason).toContain("3x")
  })

  it("recommends profil-reglaj when aesthetics matter on imperfect surface", () => {
    const ctx: DM002Context = {
      location: "interior",
      heightCategory: "1_3m",
      surfaceType: "concrete",
      surfaceCondition: "minor_uneven",
      handrailNeed: "no",
      budgetPriority: "aesthetics",
    }
    const opts = evaluateOptions(ctx)
    const reglaj = opts.find((o) => o.id === "profil-reglaj")!
    expect(reglaj.status).toBe("recommended")
  })
})

// ══════════════════════════════════════════════
// Unit Tests: Completeness & Immutability
// ══════════════════════════════════════════════

describe("DM-002 Engine — completeness", () => {
  it("always returns exactly 4 options", () => {
    const ctx: DM002Context = {
      location: "interior",
      heightCategory: "1_3m",
      surfaceType: "concrete",
      surfaceCondition: "flat",
      handrailNeed: "no",
      budgetPriority: "balanced",
    }
    const opts = evaluateOptions(ctx)
    expect(opts).toHaveLength(4)
    expect(opts.map((o) => o.id).sort()).toEqual([
      "butoni",
      "mini-montanti",
      "profil-cale",
      "profil-reglaj",
    ])
  })

  it("integrated_handrail is NOT present in any option", () => {
    const ctx: DM002Context = {
      location: "interior",
      heightCategory: "1_3m",
      surfaceType: "concrete",
      surfaceCondition: "flat",
      handrailNeed: "no",
      budgetPriority: "balanced",
    }
    const opts = evaluateOptions(ctx)
    const integrated = opts.find((o) => o.id === "integrated_handrail")
    expect(integrated).toBeUndefined()
  })
})

describe("DM-002 Engine — Decision Record", () => {
  it("creates a Decision Record with handrail note when handrail is needed", () => {
    const ctx: DM002Context = {
      location: "interior",
      heightCategory: "1_3m",
      surfaceType: "concrete",
      surfaceCondition: "flat",
      handrailNeed: "yes_mandatory",
      budgetPriority: "balanced",
    }
    const opts = evaluateOptions(ctx)
    const record = createDecisionRecord(ctx, opts, "butoni")

    expect(record.id).toMatch(/^DM-\d+$/)
    expect(record.selectedOptionId).toBe("butoni")
    expect(record.context).toEqual(ctx)
    expect(record.lessons.some((l) => l.includes("obligatorie"))).toBe(true)
    expect(record.nextSteps.some((s) => s.includes("mână curentă"))).toBe(true)
  })

  it("creates a Decision Record without handrail note when not needed", () => {
    const ctx: DM002Context = {
      location: "interior",
      heightCategory: "1_3m",
      surfaceType: "concrete",
      surfaceCondition: "flat",
      handrailNeed: "no",
      budgetPriority: "balanced",
    }
    const opts = evaluateOptions(ctx)
    const record = createDecisionRecord(ctx, opts, "butoni")

    expect(record.nextSteps.some((s) => s.includes("mâinii") || s.includes("absența"))).toBe(true)
  })

  it("Decision Record is immutable — context modification doesn't affect record", () => {
    const ctx: DM002Context = {
      location: "interior",
      heightCategory: "1_3m",
      surfaceType: "concrete",
      surfaceCondition: "flat",
      handrailNeed: "no",
      budgetPriority: "balanced",
    }
    const opts = evaluateOptions(ctx)
    const record = createDecisionRecord(ctx, opts, "butoni")

    // Modify context after record creation
    ctx.location = "exterior"
    ctx.heightCategory = "peste_3m"

    expect(record.context.location).toBe("interior")
    expect(record.context.heightCategory).toBe("1_3m")
  })

  it("throws for invalid option ID", () => {
    const ctx: DM002Context = {
      location: "interior",
      heightCategory: "1_3m",
      surfaceType: "concrete",
      surfaceCondition: "flat",
      handrailNeed: "no",
      budgetPriority: "balanced",
    }
    const opts = evaluateOptions(ctx)
    expect(() => createDecisionRecord(ctx, opts, "integrated_handrail")).toThrow()
  })
})

// ══════════════════════════════════════════════
// Regression: integrated_handrail is GONE
// ══════════════════════════════════════════════

describe("DM-002 Engine — regression: no integrated_handrail", () => {
  it("handrail mandatory does NOT force any specific system choice", () => {
    const ctx: DM002Context = {
      location: "interior",
      heightCategory: "1_3m",
      surfaceType: "concrete",
      surfaceCondition: "flat",
      handrailNeed: "yes_mandatory",
      budgetPriority: "balanced",
    }
    const opts = evaluateOptions(ctx)

    // All 4 real systems should be present (some recommended, some not)
    const ids = opts.map((o) => o.id).sort()
    expect(ids).toEqual(["butoni", "mini-montanti", "profil-cale", "profil-reglaj"])

    // Butoni should still be recommended (handrail is an accessory, not a system constraint)
    const butoni = opts.find((o) => o.id === "butoni")!
    expect(butoni.status).toBe("recommended")

    // The handrail information is in the Decision Record, not in the system recommendation
    const record = createDecisionRecord(ctx, opts, "butoni")
    expect(record.lessons.some((l) => l.includes("obligatorie"))).toBe(true)
  })
})
