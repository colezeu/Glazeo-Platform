// ══════════════════════════════════════════════
// GLAZEO — Supabase Experience Gateway Tests
// ══════════════════════════════════════════════
import { describe, it, expect, vi } from "vitest"
import { createSupabaseExperienceGateway } from "../experience/SupabaseExperienceGateway"

// Mock Supabase client cu chainable .single()
function mockSupabase(result: { data: any; error: any } | null) {
  const single = vi.fn().mockResolvedValue(result)
  const eq = vi.fn().mockReturnValue({ single })
  const select = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ select })
  return { from } as any
}

describe("SupabaseExperienceGateway", () => {
  it("returns decision_maker when profile has that role", async () => {
    const client = mockSupabase({ data: { default_experience: "decision_maker" }, error: null })
    const gw = createSupabaseExperienceGateway(client)
    const result = await gw.getProfile("user-1")
    expect(result.status).toBe("found")
    if (result.status === "found") {
      expect(result.profile.availableExperiences).toEqual(["decision_maker"])
      expect(result.profile.lastActiveExperience).toBe("decision_maker")
    }
  })

  it("returns buyer when profile has buyer role", async () => {
    const client = mockSupabase({ data: { default_experience: "buyer" }, error: null })
    const gw = createSupabaseExperienceGateway(client)
    const result = await gw.getProfile("user-2")
    expect(result.status).toBe("found")
    if (result.status === "found") {
      expect(result.profile.availableExperiences).toEqual(["buyer"])
    }
  })

  it("returns builder when profile has builder role", async () => {
    const client = mockSupabase({ data: { default_experience: "builder" }, error: null })
    const gw = createSupabaseExperienceGateway(client)
    const result = await gw.getProfile("user-3")
    expect(result.status).toBe("found")
    if (result.status === "found") {
      expect(result.profile.availableExperiences).toEqual(["builder"])
    }
  })

  it("returns admin when profile has admin role", async () => {
    const client = mockSupabase({ data: { default_experience: "admin" }, error: null })
    const gw = createSupabaseExperienceGateway(client)
    const result = await gw.getProfile("user-4")
    expect(result.status).toBe("found")
    if (result.status === "found") {
      expect(result.profile.availableExperiences).toEqual(["admin"])
    }
  })

  it("returns missing when profile not found (PGRST116)", async () => {
    const client = mockSupabase({ data: null, error: { code: "PGRST116" } })
    const gw = createSupabaseExperienceGateway(client)
    const result = await gw.getProfile("user-unknown")
    expect(result.status).toBe("missing")
  })

  it("returns empty availableExperiences for invalid default_experience value", async () => {
    const client = mockSupabase({ data: { default_experience: "superadmin" }, error: null })
    const gw = createSupabaseExperienceGateway(client)
    const result = await gw.getProfile("user-bad")
    expect(result.status).toBe("found")
    if (result.status === "found") {
      expect(result.profile.availableExperiences).toEqual([])
    }
  })

  it("returns empty availableExperiences for null default_experience", async () => {
    const client = mockSupabase({ data: { default_experience: null }, error: null })
    const gw = createSupabaseExperienceGateway(client)
    const result = await gw.getProfile("user-null")
    expect(result.status).toBe("found")
    if (result.status === "found") {
      expect(result.profile.availableExperiences).toEqual([])
    }
  })

  it("throws on unexpected DB errors", async () => {
    const client = mockSupabase({ data: null, error: { code: "42P01", message: "relation does not exist" } })
    const gw = createSupabaseExperienceGateway(client)
    await expect(gw.getProfile("user-err")).rejects.toThrow("Failed to load experience profile")
  })
})
