// ══════════════════════════════════════════════
// GLAZEO — Routing fix: onboarding + default experience (regression)
// Teste deterministe. Zero rețea, zero DOM, zero credențiale.
// Pre-fix: eșuează (alias LegacyBuyer, fără onboarding, fără gateway).
// Post-fix: trec toate.
// ══════════════════════════════════════════════
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { ensureProfileInitialized } from "../experience/onboarding"
import { createSupabaseExperienceGateway, toExperienceType } from "../experience/SupabaseExperienceGateway"
import { resolveExperience } from "../experience/resolveExperience"
import type { ExperienceProfileResult } from "../experience/types"

const viteConfig = readFileSync(new URL("../../vite.config.ts", import.meta.url), "utf8")
const aliasSection = viteConfig.slice(
  viteConfig.indexOf("experience-gateway"),
  viteConfig.indexOf("decision-record-repo"),
)

function memSession() {
  const marker = new Map<string, boolean>()
  return {
    getMarker: (k: string) => marker.get(k) ?? false,
    setMarker: (k: string) => void marker.set(k, true),
    size: () => marker.size,
  }
}

describe("Routing fix — production alias", () => {
  it("1. production alias uses SupabaseExperienceGateway", () => {
    expect(aliasSection).toContain("SupabaseExperienceGateway.entry.ts")
  })

  it("9. LegacyBuyerGateway is not the implicit production gateway", () => {
    expect(aliasSection).not.toContain("LegacyBuyerExperienceGateway.entry.ts")
  })
})

describe("Routing fix — onboarding (owner unic)", () => {
  it("2. new account initialization resolves to decision_maker", async () => {
    const result = await ensureProfileInitialized({ status: "missing" }, {
      currentUser: { id: "u1", email: "new@glass.associates" },
      registerAccount: async () => ({ defaultExperience: "decision_maker" }),
      session: memSession(),
    })
    expect(result.status).toBe("found")
    if (result.status === "found") {
      expect(result.profile.availableExperiences).toEqual(["decision_maker"])
      const resolution = resolveExperience(result)
      expect(resolution.status).toBe("resolved")
      if (resolution.status === "resolved") expect(resolution.experience).toBe("decision_maker")
    }
  })

  it("3. existing explicit buyer remains buyer", async () => {
    const existingBuyer: ExperienceProfileResult = {
      status: "found",
      profile: { availableExperiences: ["buyer"], lastActiveExperience: "buyer", organizationRoles: {} },
    }
    const resolution = resolveExperience(existingBuyer)
    expect(resolution.status).toBe("resolved")
    if (resolution.status === "resolved") expect(resolution.experience).toBe("buyer")
  })

  it("4. missing profile triggers exactly one initialization attempt", async () => {
    let attempts = 0
    const session = memSession()
    const run = () => ensureProfileInitialized({ status: "missing" }, {
      currentUser: { id: "u1", email: "a@b.c" },
      registerAccount: async () => { attempts += 1; return { defaultExperience: "decision_maker" } },
      session,
    })
    await run()
    await run() // marker setat după succes → a doua rulare NU mai inițializează
    expect(attempts).toBe(1)
  })

  it("5. successful RPC response is used directly (no re-read)", async () => {
    const result = await ensureProfileInitialized({ status: "missing" }, {
      currentUser: { id: "u1", email: "a@b.c" },
      registerAccount: async () => ({ defaultExperience: "buyer" }),
      session: memSession(),
    })
    // Rezultatul vine din răspunsul RPC — funcția nu are acces la getProfile (structural, nu poate re-citi).
    expect(result.status).toBe("found")
    if (result.status === "found") expect(result.profile.availableExperiences).toEqual(["buyer"])
  })

  it("6. failed initialization does not set a success marker", async () => {
    const session = memSession()
    const result = await ensureProfileInitialized({ status: "missing" }, {
      currentUser: { id: "u1", email: "a@b.c" },
      registerAccount: async () => { throw new Error("rpc down") },
      session,
    })
    expect(result.status).toBe("missing")
    expect(session.size()).toBe(0)
  })

  it("7. first login and relogin both resolve to DecisionMakerHome", async () => {
    const session = memSession()
    const first = await ensureProfileInitialized({ status: "missing" }, {
      currentUser: { id: "u1", email: "a@b.c" },
      registerAccount: async () => ({ defaultExperience: "decision_maker" }),
      session,
    })
    const r1 = resolveExperience(first)
    expect(r1.status).toBe("resolved")
    if (r1.status === "resolved") expect(r1.experience).toBe("decision_maker")

    // relogin: profilul există acum în DB → gateway returnează found decision_maker
    const second: ExperienceProfileResult = {
      status: "found",
      profile: { availableExperiences: ["decision_maker"], lastActiveExperience: "decision_maker", organizationRoles: {} },
    }
    const r2 = resolveExperience(second)
    expect(r2.status).toBe("resolved")
    if (r2.status === "resolved") expect(r2.experience).toBe("decision_maker")
  })

  it("8. initialization failure → needs_onboarding, no silent Buyer fallback", async () => {
    const result = await ensureProfileInitialized({ status: "missing" }, {
      currentUser: { id: "u1", email: "a@b.c" },
      registerAccount: async () => { throw new Error("rpc down") },
      session: memSession(),
    })
    expect(result.status).toBe("missing")
    const resolution = resolveExperience(result)
    expect(resolution.status).toBe("needs_onboarding")
  })
})

describe("Routing fix — gateway data-driven", () => {
  it("gateway maps PGRST116 (missing profile) to missing — no fallback", async () => {
    const fakeClient = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: { code: "PGRST116", message: "no rows" } }),
          }),
        }),
      }),
    } as unknown as Parameters<typeof createSupabaseExperienceGateway>[0]
    const gateway = createSupabaseExperienceGateway(fakeClient)
    const result = await gateway.getProfile("u1")
    expect(result.status).toBe("missing")
  })

  it("gateway returns buyer only when the profile says buyer", async () => {
    const fakeClient = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: { default_experience: "buyer" }, error: null }),
          }),
        }),
      }),
    } as unknown as Parameters<typeof createSupabaseExperienceGateway>[0]
    const gateway = createSupabaseExperienceGateway(fakeClient)
    const result = await gateway.getProfile("u1")
    expect(result.status).toBe("found")
    if (result.status === "found") expect(result.profile.availableExperiences).toEqual(["buyer"])
  })

  it("unknown experience maps to null (no silent fallback)", () => {
    expect(toExperienceType("unknown_role")).toBeNull()
    expect(toExperienceType("")).toBeNull()
    expect(toExperienceType("decision_maker")).toBe("decision_maker")
  })
})
