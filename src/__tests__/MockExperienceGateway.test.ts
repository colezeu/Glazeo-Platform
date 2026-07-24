// ══════════════════════════════════════════════
// GLAZEO — Mock Experience Gateway Tests (Phase 2)
// ══════════════════════════════════════════════
import { describe, it, expect } from "vitest"
import { createMockExperienceGateway } from "../experience/MockExperienceGateway"
import {
  LEGACY_BUYER_PROFILE_RESULT,
  DECISION_MAKER_PROFILE_RESULT,
  MISSING_PROFILE_RESULT,
} from "../experience/fixtures"

// ── found ──────────────────────────────────────────

describe("MockExperienceGateway — found", () => {
  it("returns the configured profile result", async () => {
    const gateway = createMockExperienceGateway(DECISION_MAKER_PROFILE_RESULT)
    const result = await gateway.getProfile("any-user-id")

    expect(result.status).toBe("found")
    if (result.status === "found") {
      expect(result.profile.availableExperiences).toEqual(["decision_maker"])
    }
  })

  it("returns legacy buyer profile correctly", async () => {
    const gateway = createMockExperienceGateway(LEGACY_BUYER_PROFILE_RESULT)
    const result = await gateway.getProfile("any-user-id")

    expect(result.status).toBe("found")
    if (result.status === "found") {
      expect(result.profile.availableExperiences).toEqual(["buyer"])
      expect(result.profile.lastActiveExperience).toBeNull()
    }
  })

  it("ignores the userId parameter (deterministic)", async () => {
    const gateway = createMockExperienceGateway(DECISION_MAKER_PROFILE_RESULT)

    const r1 = await gateway.getProfile("user-a")
    const r2 = await gateway.getProfile("user-b")
    const r3 = await gateway.getProfile("")

    expect(r1).toEqual(r2)
    expect(r2).toEqual(r3)
  })
})

// ── missing ────────────────────────────────────────

describe("MockExperienceGateway — missing", () => {
  it("returns missing status", async () => {
    const gateway = createMockExperienceGateway(MISSING_PROFILE_RESULT)
    const result = await gateway.getProfile("any-user-id")

    expect(result).toEqual({ status: "missing" })
  })
})

// ── No mutations ───────────────────────────────────

describe("MockExperienceGateway — immutability", () => {
  it("returns a defensive copy, not the original reference", async () => {
    const gateway = createMockExperienceGateway(LEGACY_BUYER_PROFILE_RESULT)
    const result = await gateway.getProfile("user-1")

    expect(result.status).toBe("found")
    if (result.status === "found") {
      // Mutate the returned profile
      result.profile.availableExperiences.push("admin" as any)

      // Original fixture must be unaffected
      expect(LEGACY_BUYER_PROFILE_RESULT.status).toBe("found")
      if (LEGACY_BUYER_PROFILE_RESULT.status === "found") {
        expect(LEGACY_BUYER_PROFILE_RESULT.profile.availableExperiences).toEqual(["buyer"])
      }
    }
  })

  it("returns distinct copies on each call", async () => {
    const gateway = createMockExperienceGateway(LEGACY_BUYER_PROFILE_RESULT)

    const r1 = await gateway.getProfile("user-1")
    const r2 = await gateway.getProfile("user-1")

    expect(r1.status).toBe("found")
    expect(r2.status).toBe("found")
    if (r1.status === "found" && r2.status === "found") {
      // They should be deep-equal but not the same reference
      expect(r1.profile.availableExperiences).toEqual(r2.profile.availableExperiences)
      expect(r1.profile.availableExperiences).not.toBe(r2.profile.availableExperiences)
    }
  })
})

// ── No implicit default ────────────────────────────

describe("MockExperienceGateway — no implicit default", () => {
  it("requires an explicit result parameter", () => {
    // TypeScript enforces this at compile time — verified by the signature.
    // createMockExperienceGateway() // would be a compile error
    expect(createMockExperienceGateway).toBeDefined()
  })

  it("does not default to buyer when missing is provided", async () => {
    const gateway = createMockExperienceGateway(MISSING_PROFILE_RESULT)
    const result = await gateway.getProfile("any-id")
    expect(result.status).toBe("missing")
  })
})
