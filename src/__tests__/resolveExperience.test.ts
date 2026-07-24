// ══════════════════════════════════════════════
// GLAZEO — Experience Resolver Unit Tests (Phase 1, v2)
// ADR-001: All 4 resolution states + edge cases
// ══════════════════════════════════════════════
import { describe, it, expect } from "vitest"
import { resolveExperience } from "../experience/resolveExperience"
import type { ExperienceProfile, ExperienceProfileResult } from "../experience/types"

// ── Test fixtures ──────────────────────────────────
// defaultExperience removed per ADR v2 — dead field in Phase 1

const BUYER_PROFILE: ExperienceProfile = {
  availableExperiences: ["buyer"],
  lastActiveExperience: null,
  organizationRoles: {},
}

const MULTI_PROFILE: ExperienceProfile = {
  availableExperiences: ["decision_maker", "buyer"],
  lastActiveExperience: null,
  organizationRoles: {},
}

const MULTI_WITH_LAST: ExperienceProfile = {
  availableExperiences: ["decision_maker", "buyer"],
  lastActiveExperience: "decision_maker",
  organizationRoles: {},
}

const ADMIN_PROFILE: ExperienceProfile = {
  availableExperiences: ["admin", "buyer"],
  lastActiveExperience: null,
  organizationRoles: {},
}

// ── 1. needs_onboarding (missing profile) ──────────

describe("resolveExperience — needs_onboarding (missing profile)", () => {
  it("returns needs_onboarding when profile result is missing", () => {
    const missing: ExperienceProfileResult = { status: "missing" }
    const result = resolveExperience(missing)
    expect(result).toEqual({
      status: "needs_onboarding",
      reason: "No experience profile found for this account.",
    })
  })

  it("returns needs_onboarding when availableExperiences is empty", () => {
    const emptyProfile: ExperienceProfile = {
      availableExperiences: [],
      lastActiveExperience: null,
      organizationRoles: {},
    }
    const result = resolveExperience({ status: "found", profile: emptyProfile })
    expect(result).toEqual({
      status: "needs_onboarding",
      reason: "No experiences available for this account.",
    })
  })
})

// ── 2. needs_onboarding (org without mapping) ──────

describe("resolveExperience — needs_onboarding (org context)", () => {
  it("returns needs_onboarding when org has empty role list", () => {
    const profile: ExperienceProfile = {
      availableExperiences: ["buyer", "decision_maker"],
      lastActiveExperience: null,
      organizationRoles: { "org-empty": [] },
    }
    const result = resolveExperience(
      { status: "found", profile },
      { activeOrganizationId: "org-empty" },
    )
    expect(result).toEqual({
      status: "needs_onboarding",
      reason: "No roles configured for organization org-empty.",
    })
  })

  it("returns needs_onboarding when org has no mapping (no fallback to availableExperiences)", () => {
    const result = resolveExperience(
      { status: "found", profile: BUYER_PROFILE },
      { activeOrganizationId: "org-unknown" },
    )
    // org-unknown not in organizationRoles → [] → needs_onboarding
    // NO fallback to availableExperiences (cross-org leakage)
    expect(result).toEqual({
      status: "needs_onboarding",
      reason: "No roles configured for organization org-unknown.",
    })
  })
})

// ── 3. needs_selection ─────────────────────────────

describe("resolveExperience — needs_selection", () => {
  it("returns needs_selection when multiple experiences and no preference", () => {
    const result = resolveExperience({ status: "found", profile: MULTI_PROFILE })
    expect(result).toEqual({
      status: "needs_selection",
      available: ["decision_maker", "buyer"],
    })
  })

  it("returns needs_selection when requested experience is invalid", () => {
    const result = resolveExperience(
      { status: "found", profile: MULTI_PROFILE },
      { requestedExperience: "admin" },
    )
    expect(result).toEqual({
      status: "needs_selection",
      available: ["decision_maker", "buyer"],
    })
  })

  it("returns needs_selection when lastActive is invalid AND multiple available", () => {
    const profile: ExperienceProfile = {
      availableExperiences: ["buyer", "admin"],
      lastActiveExperience: "decision_maker",
      organizationRoles: {},
    }
    const result = resolveExperience({ status: "found", profile })
    expect(result).toEqual({
      status: "needs_selection",
      available: ["buyer", "admin"],
    })
  })
})

// ── 4. resolved ────────────────────────────────────

describe("resolveExperience — resolved", () => {
  it("resolves to single available experience (no preference)", () => {
    const result = resolveExperience({ status: "found", profile: BUYER_PROFILE })
    expect(result).toEqual({ status: "resolved", experience: "buyer" })
  })

  it("resolves to explicitly requested experience", () => {
    const result = resolveExperience(
      { status: "found", profile: MULTI_PROFILE },
      { requestedExperience: "decision_maker" },
    )
    expect(result).toEqual({ status: "resolved", experience: "decision_maker" })
  })

  it("resolves to lastActiveExperience when valid", () => {
    const result = resolveExperience({ status: "found", profile: MULTI_WITH_LAST })
    expect(result).toEqual({ status: "resolved", experience: "decision_maker" })
  })

  it("resolves to builder when it is the only experience", () => {
    const builderProfile: ExperienceProfile = {
      availableExperiences: ["builder"],
      lastActiveExperience: null,
      organizationRoles: {},
    }
    const result = resolveExperience({ status: "found", profile: builderProfile })
    expect(result).toEqual({ status: "resolved", experience: "builder" })
  })

  it("resolves to admin when it is the only experience", () => {
    const adminOnly: ExperienceProfile = {
      availableExperiences: ["admin"],
      lastActiveExperience: null,
      organizationRoles: {},
    }
    const result = resolveExperience({ status: "found", profile: adminOnly })
    expect(result).toEqual({ status: "resolved", experience: "admin" })
  })

  it("resolves in org context when single role exists for org", () => {
    const profile: ExperienceProfile = {
      availableExperiences: ["buyer", "decision_maker", "admin"],
      lastActiveExperience: null,
      organizationRoles: { "org-1": ["buyer"] },
    }
    const result = resolveExperience(
      { status: "found", profile },
      { activeOrganizationId: "org-1" },
    )
    expect(result).toEqual({ status: "resolved", experience: "buyer" })
  })
})

// ── 5. Requested experience invalid ────────────────

describe("resolveExperience — requested experience invalid", () => {
  it("returns needs_selection when requested experience not in available", () => {
    const result = resolveExperience(
      { status: "found", profile: BUYER_PROFILE },
      { requestedExperience: "admin" },
    )
    expect(result).toEqual({
      status: "needs_selection",
      available: ["buyer"],
    })
  })

  it("returns needs_selection for multi-role user requesting invalid role", () => {
    const result = resolveExperience(
      { status: "found", profile: MULTI_PROFILE },
      { requestedExperience: "builder" },
    )
    expect(result).toEqual({
      status: "needs_selection",
      available: ["decision_maker", "buyer"],
    })
  })
})

// ── 6. Last-active experience invalid ──────────────

describe("resolveExperience — last-active experience invalid", () => {
  it("falls through to single available when lastActive is stale", () => {
    const profile: ExperienceProfile = {
      availableExperiences: ["buyer"],
      lastActiveExperience: "decision_maker",
      organizationRoles: {},
    }
    const result = resolveExperience({ status: "found", profile })
    expect(result).toEqual({ status: "resolved", experience: "buyer" })
  })

  it("returns needs_selection when lastActive is stale and multiple remain", () => {
    const profile: ExperienceProfile = {
      availableExperiences: ["buyer", "admin"],
      lastActiveExperience: "decision_maker",
      organizationRoles: {},
    }
    const result = resolveExperience({ status: "found", profile })
    expect(result).toEqual({
      status: "needs_selection",
      available: ["buyer", "admin"],
    })
  })
})

// ── 7. Admin does NOT auto-win ─────────────────────

describe("resolveExperience — admin does not auto-win", () => {
  it("returns needs_selection when admin is one of several available", () => {
    const result = resolveExperience({ status: "found", profile: ADMIN_PROFILE })
    expect(result).toEqual({
      status: "needs_selection",
      available: ["admin", "buyer"],
    })
  })

  it("resolves to admin only when explicitly requested", () => {
    const result = resolveExperience(
      { status: "found", profile: ADMIN_PROFILE },
      { requestedExperience: "admin" },
    )
    expect(result).toEqual({ status: "resolved", experience: "admin" })
  })

  it("resolves to admin only when it is the last active", () => {
    const adminLastActive: ExperienceProfile = {
      ...ADMIN_PROFILE,
      lastActiveExperience: "admin",
    }
    const result = resolveExperience({ status: "found", profile: adminLastActive })
    expect(result).toEqual({ status: "resolved", experience: "admin" })
  })
})
