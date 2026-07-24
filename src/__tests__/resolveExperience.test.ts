// ══════════════════════════════════════════════
// GLAZEO — Experience Resolver Unit Tests (Phase 1)
// ADR-001: All 6 states + edge cases
// ══════════════════════════════════════════════
import { describe, it, expect } from "vitest"
import { resolveExperience } from "../experience/resolveExperience"
import type { ExperienceProfile } from "../experience/types"

// ── Test fixtures ──────────────────────────────────

const BUYER_PROFILE: ExperienceProfile = {
  availableExperiences: ["buyer"],
  defaultExperience: "buyer",
  lastActiveExperience: null,
  organizationRoles: {},
}

const MULTI_PROFILE: ExperienceProfile = {
  availableExperiences: ["decision_maker", "buyer"],
  defaultExperience: "buyer",
  lastActiveExperience: null,
  organizationRoles: {},
}

const MULTI_WITH_LAST: ExperienceProfile = {
  availableExperiences: ["decision_maker", "buyer"],
  defaultExperience: "buyer",
  lastActiveExperience: "decision_maker",
  organizationRoles: {},
}

const ADMIN_PROFILE: ExperienceProfile = {
  availableExperiences: ["admin", "buyer"],
  defaultExperience: "buyer",
  lastActiveExperience: null,
  organizationRoles: {},
}

// ── 1. unauthenticated ─────────────────────────────

describe("resolveExperience — unauthenticated", () => {
  it("returns unauthenticated for null profile", () => {
    const result = resolveExperience(null)
    expect(result).toEqual({ status: "unauthenticated" })
  })

  it("returns unauthenticated regardless of context", () => {
    const result = resolveExperience(null, {
      requestedExperience: "buyer",
      activeOrganizationId: "org-1",
    })
    expect(result).toEqual({ status: "unauthenticated" })
  })
})

// ── 2. needs_onboarding ────────────────────────────

describe("resolveExperience — needs_onboarding", () => {
  it("returns needs_onboarding when availableExperiences is empty", () => {
    const emptyProfile: ExperienceProfile = {
      availableExperiences: [],
      defaultExperience: "buyer",
      lastActiveExperience: null,
      organizationRoles: {},
    }
    const result = resolveExperience(emptyProfile)
    expect(result).toEqual({
      status: "needs_onboarding",
      reason: "No experiences available for this account.",
    })
  })

  it("returns needs_onboarding when org has no roles mapped", () => {
    const profile: ExperienceProfile = {
      availableExperiences: ["buyer", "decision_maker"],
      defaultExperience: "buyer",
      lastActiveExperience: null,
      organizationRoles: { "org-empty": [] },
    }
    const result = resolveExperience(profile, {
      activeOrganizationId: "org-empty",
    })
    expect(result).toEqual({
      status: "needs_onboarding",
      reason: "No experiences available for this account.",
    })
  })
})

// ── 3. needs_selection ─────────────────────────────

describe("resolveExperience — needs_selection", () => {
  it("returns needs_selection when multiple experiences and no preference", () => {
    const result = resolveExperience(MULTI_PROFILE)
    expect(result).toEqual({
      status: "needs_selection",
      available: ["decision_maker", "buyer"],
    })
  })

  it("returns needs_selection when requested experience is invalid", () => {
    const result = resolveExperience(MULTI_PROFILE, {
      requestedExperience: "admin",
    })
    expect(result).toEqual({
      status: "needs_selection",
      available: ["decision_maker", "buyer"],
    })
  })

  it("returns needs_selection when lastActiveExperience is no longer available", () => {
    const profile: ExperienceProfile = {
      availableExperiences: ["buyer"],
      defaultExperience: "buyer",
      lastActiveExperience: "decision_maker",
      organizationRoles: {},
    }
    const result = resolveExperience(profile)
    // lastActive "decision_maker" not in available → falls through to single available
    // Single available resolves automatically
    expect(result).toEqual({
      status: "resolved",
      experience: "buyer",
    })
  })

  it("returns needs_selection when lastActive is invalid AND multiple available", () => {
    const profile: ExperienceProfile = {
      availableExperiences: ["buyer", "admin"],
      defaultExperience: "buyer",
      lastActiveExperience: "decision_maker",
      organizationRoles: {},
    }
    const result = resolveExperience(profile)
    expect(result).toEqual({
      status: "needs_selection",
      available: ["buyer", "admin"],
    })
  })
})

// ── 4. resolved ────────────────────────────────────

describe("resolveExperience — resolved", () => {
  it("resolves to single available experience (no preference)", () => {
    const result = resolveExperience(BUYER_PROFILE)
    expect(result).toEqual({ status: "resolved", experience: "buyer" })
  })

  it("resolves to explicitly requested experience", () => {
    const result = resolveExperience(MULTI_PROFILE, {
      requestedExperience: "decision_maker",
    })
    expect(result).toEqual({ status: "resolved", experience: "decision_maker" })
  })

  it("resolves to lastActiveExperience when valid", () => {
    const result = resolveExperience(MULTI_WITH_LAST)
    expect(result).toEqual({ status: "resolved", experience: "decision_maker" })
  })

  it("resolves to builder when it is the only experience", () => {
    const builderProfile: ExperienceProfile = {
      availableExperiences: ["builder"],
      defaultExperience: "builder",
      lastActiveExperience: null,
      organizationRoles: {},
    }
    const result = resolveExperience(builderProfile)
    expect(result).toEqual({ status: "resolved", experience: "builder" })
  })

  it("resolves to admin when it is the only experience", () => {
    const adminOnly: ExperienceProfile = {
      availableExperiences: ["admin"],
      defaultExperience: "admin",
      lastActiveExperience: null,
      organizationRoles: {},
    }
    const result = resolveExperience(adminOnly)
    expect(result).toEqual({ status: "resolved", experience: "admin" })
  })
})

// ── 5. Requested experience invalid ────────────────

describe("resolveExperience — requested experience invalid", () => {
  it("returns needs_selection when requested experience not in available", () => {
    const result = resolveExperience(BUYER_PROFILE, {
      requestedExperience: "admin",
    })
    expect(result).toEqual({
      status: "needs_selection",
      available: ["buyer"],
    })
  })

  it("returns needs_selection even for multi-role user requesting invalid role", () => {
    const result = resolveExperience(MULTI_PROFILE, {
      requestedExperience: "builder",
    })
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
      defaultExperience: "buyer",
      lastActiveExperience: "decision_maker",
      organizationRoles: {},
    }
    const result = resolveExperience(profile)
    expect(result).toEqual({ status: "resolved", experience: "buyer" })
  })

  it("returns needs_selection when lastActive is stale and multiple remain", () => {
    const profile: ExperienceProfile = {
      availableExperiences: ["buyer", "admin"],
      defaultExperience: "buyer",
      lastActiveExperience: "decision_maker",
      organizationRoles: {},
    }
    const result = resolveExperience(profile)
    expect(result).toEqual({
      status: "needs_selection",
      available: ["buyer", "admin"],
    })
  })
})

// ── 7. Organization context ────────────────────────

describe("resolveExperience — organization context", () => {
  it("restricts experiences to org-specific roles", () => {
    const profile: ExperienceProfile = {
      availableExperiences: ["buyer", "decision_maker", "admin"],
      defaultExperience: "buyer",
      lastActiveExperience: null,
      organizationRoles: {
        "org-1": ["buyer"],
      },
    }
    const result = resolveExperience(profile, {
      activeOrganizationId: "org-1",
    })
    // Only ["buyer"] in org-1 → single available → resolved
    expect(result).toEqual({ status: "resolved", experience: "buyer" })
  })

  it("falls back to availableExperiences when org has no specific roles", () => {
    const result = resolveExperience(MULTI_PROFILE, {
      activeOrganizationId: "org-unknown",
    })
    // orgRoles["org-unknown"] is undefined → fall back to availableExperiences
    expect(result).toEqual({
      status: "needs_selection",
      available: ["decision_maker", "buyer"],
    })
  })
})

// ── 8. Admin does NOT auto-win ─────────────────────

describe("resolveExperience — admin does not auto-win", () => {
  it("returns needs_selection when admin is one of several available", () => {
    const result = resolveExperience(ADMIN_PROFILE)
    expect(result).toEqual({
      status: "needs_selection",
      available: ["admin", "buyer"],
    })
  })

  it("resolves to admin only when explicitly requested", () => {
    const result = resolveExperience(ADMIN_PROFILE, {
      requestedExperience: "admin",
    })
    expect(result).toEqual({ status: "resolved", experience: "admin" })
  })

  it("resolves to admin only when it is the last active", () => {
    const adminLastActive: ExperienceProfile = {
      ...ADMIN_PROFILE,
      lastActiveExperience: "admin",
    }
    const result = resolveExperience(adminLastActive)
    expect(result).toEqual({ status: "resolved", experience: "admin" })
  })
})
