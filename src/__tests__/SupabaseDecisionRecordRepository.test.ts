// ══════════════════════════════════════════════
// GLAZEO — Supabase Decision Record Repository Tests
// ══════════════════════════════════════════════
import { describe, it, expect, vi } from "vitest"
import { SupabaseDecisionRecordRepository } from "../persistence/SupabaseDecisionRecordRepository"
import type { DecisionRecord } from "../features/decision-maker/shared/decisionModelTypes"

function mockSupabaseClient(authResult: { user: { id: string } | null }) {
  const getUser = vi.fn().mockResolvedValue({ data: { user: authResult.user } })
  const insert = vi.fn().mockReturnValue({ select: vi.fn() })
  const from = vi.fn().mockReturnValue({ insert })
  return {
    auth: { getUser },
    from,
    _insert: insert, // expose for assertions
  } as any
}

function sampleRecord(overrides: Partial<DecisionRecord> = {}): DecisionRecord {
  const rec = {
    id: "rec-001",
    decidedAt: "2026-07-26T10:00:00Z",
    selectedOptionId: "opt-frameless",
    context: { ceilingType: "concrete", doorTraffic: "low", acousticNeed: "visual_only", noiseNearby: null },
    options: [
      {
        id: "opt-frameless",
        name: "Fără ramă (frameless)",
        description: "Estetic maxim",
        pros: ["Estetic curat"],
        cons: ["Cost mai mare"],
        criteria: { estetic: 10, acustic: 2 },
        bestWhen: "Zgomot redus",
        notRecommendedWhen: "Zgomot ridicat",
        tradeoffs: ["Izolare fonică redusă"],
        status: "recommended" as const,
        reason: "Estetic maxim, zgomot redus.",
      },
    ],
    acceptedTradeoffs: [],
    lessons: [],
    nextSteps: [],
    evaluationResult: {
      modelId: "meeting_room_partition",
      evaluatedAt: "2026-07-26T10:00:00Z",
      context: { ceilingType: "concrete", doorTraffic: "low", acousticNeed: "visual_only", noiseNearby: null },
      options: [],
    },
    ...overrides,
  }
  // Cast: intention este un câmp extra folosit de repository (nu face parte din DecisionRecord<TContext>)
  ;(rec as any).intention = (overrides as any)?.intention ?? { type: "meeting_room_partition", label: "Compartimentare sală" }
  return rec as DecisionRecord
}

describe("SupabaseDecisionRecordRepository.save()", () => {
  it("insert receives a valid userId string (not a Promise)", async () => {
    const supabase = mockSupabaseClient({ user: { id: "auth-user-123" } })
    const repo = new SupabaseDecisionRecordRepository(supabase)
    supabase._insert.mockResolvedValue({ error: null })

    await repo.save(sampleRecord())

    const insertArg = supabase._insert.mock.calls[0][0]
    expect(typeof insertArg.user_id).toBe("string")
    expect(insertArg.user_id).toBe("auth-user-123")
    expect(insertArg.user_id).not.toBe("[object Promise]")
    expect(insertArg.id).toBe("rec-001")
  })

  it("throws controlled error when no authenticated user", async () => {
    const supabase = mockSupabaseClient({ user: null })
    const repo = new SupabaseDecisionRecordRepository(supabase)

    await expect(repo.save(sampleRecord())).rejects.toThrow(
      "Cannot save decision record: no authenticated user",
    )
  })

  it("throws on Supabase insert error", async () => {
    const supabase = mockSupabaseClient({ user: { id: "auth-user-123" } })
    supabase._insert.mockResolvedValue({ error: { message: "RLS violation" } })
    const repo = new SupabaseDecisionRecordRepository(supabase)

    await expect(repo.save(sampleRecord())).rejects.toThrow("Failed to save decision record")
  })
})

describe("SupabaseDecisionRecordRepository.listByUser()", () => {
  it("returns mapped summaries", async () => {
    const supabase = mockSupabaseClient({ user: { id: "auth-user-123" } })
    const select = vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) })
    supabase.from.mockReturnValue({ select })

    const repo = new SupabaseDecisionRecordRepository(supabase)
    const result = await repo.listByUser()
    expect(Array.isArray(result)).toBe(true)
  })
})

describe("SupabaseDecisionRecordRepository.getById()", () => {
  it("returns null for PGRST116 (not found)", async () => {
    const supabase = mockSupabaseClient({ user: { id: "auth-user-123" } })
    const single = vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } })
    const eq = vi.fn().mockReturnValue({ single })
    supabase.from.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) })

    const repo = new SupabaseDecisionRecordRepository(supabase)
    const result = await repo.getById("rec-missing")
    expect(result).toBeNull()
  })

  it("returns the snapshot for a found record", async () => {
    const snap = sampleRecord({ id: "rec-found" })
    const supabase = mockSupabaseClient({ user: { id: "auth-user-123" } })
    const single = vi.fn().mockResolvedValue({ data: { snapshot: snap }, error: null })
    const eq = vi.fn().mockReturnValue({ single })
    supabase.from.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) })

    const repo = new SupabaseDecisionRecordRepository(supabase)
    const result = await repo.getById("rec-found")
    expect(result).not.toBeNull()
    expect(result?.id).toBe("rec-found")
  })
})
