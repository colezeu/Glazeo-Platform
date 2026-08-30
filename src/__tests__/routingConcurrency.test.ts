// ══════════════════════════════════════════════
// GLAZEO — Onboarding: dedup in-flight (regression)
// O singură inițializare RPC per utilizator, per context pagină.
// Ambele apelante concurente primesc același rezultat;
// la eșec entry-ul e eliberat → retry-ul rămâne posibil.
// ══════════════════════════════════════════════
import { describe, it, expect, beforeEach } from "vitest"
import { ensureProfileInitialized, resetOnboardingInFlight } from "../experience/onboarding"
import type { ExperienceProfileResult } from "../experience/types"

function memSession() {
  const marker = new Map<string, boolean>()
  return {
    getMarker: (k: string) => marker.get(k) ?? false,
    setMarker: (k: string) => void marker.set(k, true),
    size: () => marker.size,
  }
}

function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const missing = { status: "missing" } as const

const tick = () => new Promise((r) => setTimeout(r, 10))

beforeEach(() => {
  resetOnboardingInFlight()
})

describe("onboarding — dedup in-flight (o singură invocare RPC per user)", () => {
  it("1. concurrent success: RPC invocat EXACT O DATĂ, ambele apelante primesc același rezultat decision_maker", async () => {
    let calls = 0
    const rpc = deferred<{ defaultExperience: string }>()
    const session = memSession()
    const deps = {
      currentUser: { id: "u1", email: "a@b.c" },
      registerAccount: async (): Promise<{ defaultExperience: string }> => {
        calls += 1
        return rpc.promise
      },
      session,
    }

    // Ambele apeluri se lansează înainte ca RPC-ul să rezolve.
    const p1 = ensureProfileInitialized(missing, deps)
    const p2 = ensureProfileInitialized(missing, deps)
    await tick()
    expect(calls).toBe(1)

    rpc.resolve({ defaultExperience: "decision_maker" })
    const [r1, r2] = await Promise.all([p1, p2])
    expect(r1.status).toBe("found")
    expect(r2.status).toBe("found")
    if (r1.status === "found" && r2.status === "found") {
      expect(r1.profile.availableExperiences).toEqual(["decision_maker"])
      expect(r2.profile.availableExperiences).toEqual(["decision_maker"])
    }
    expect(session.size()).toBe(1) // marker setat o singură dată
  })

  it("2. concurrent failure: RPC invocat O DATĂ, ambele missing, entry-ul in-flight e eliberat → retry posibil", async () => {
    let calls = 0
    const rpc = deferred<never>()
    const session = memSession()
    const deps = {
      currentUser: { id: "u1", email: "a@b.c" },
      registerAccount: async (): Promise<{ defaultExperience: string } | null> => {
        calls += 1
        if (calls === 1) return rpc.promise
        return { defaultExperience: "decision_maker" }
      },
      session,
    }

    const p1 = ensureProfileInitialized(missing, deps)
    const p2 = ensureProfileInitialized(missing, deps)
    await tick()
    expect(calls).toBe(1)

    rpc.reject(new Error("rpc down"))
    const [r1, r2] = await Promise.all([p1, p2])
    expect(r1.status).toBe("missing")
    expect(r2.status).toBe("missing")
    expect(session.size()).toBe(0) // fără marker la eșec

    // Retry după eșec: entry-ul eliberat → a doua invocare RPC funcționează.
    const r3 = await ensureProfileInitialized(missing, deps)
    expect(calls).toBe(2)
    expect(r3.status).toBe("found")
  })

  it("3. retry after failure: a doua încercare succes → found decision_maker", async () => {
    let calls = 0
    const session = memSession()
    const deps = {
      currentUser: { id: "u1", email: "a@b.c" },
      registerAccount: async (): Promise<{ defaultExperience: string } | null> => {
        calls += 1
        if (calls === 1) throw new Error("rpc down")
        return { defaultExperience: "decision_maker" }
      },
      session,
    }

    const r1: ExperienceProfileResult = await ensureProfileInitialized(missing, deps)
    expect(r1.status).toBe("missing")

    const r2: ExperienceProfileResult = await ensureProfileInitialized(missing, deps)
    expect(r2.status).toBe("found")
    if (r2.status === "found") {
      expect(r2.profile.availableExperiences).toEqual(["decision_maker"])
      // rezolvarea nu rutează silențios la Buyer
      expect(r2.profile.availableExperiences).not.toContain("buyer")
    }
    expect(calls).toBe(2)
    expect(session.size()).toBe(1)
  })

  it("4. utilizatori diferiți NU sunt deduplicați împreună", async () => {
    let calls = 0
    const rpc1 = deferred<{ defaultExperience: string }>()
    const rpc2 = deferred<{ defaultExperience: string }>()
    const session = memSession()
    const deps = {
      currentUser: { id: "u1", email: "a@b.c" },
      registerAccount: async (): Promise<{ defaultExperience: string }> => {
        calls += 1
        return calls === 1 ? rpc1.promise : rpc2.promise
      },
      session,
    }

    const p1 = ensureProfileInitialized(missing, deps)
    const p2 = ensureProfileInitialized(missing, {
      ...deps,
      currentUser: { id: "u2", email: "c@d.e" },
    })
    await tick()
    expect(calls).toBe(2) // fiecare user → propria invocare RPC

    rpc1.resolve({ defaultExperience: "decision_maker" })
    rpc2.resolve({ defaultExperience: "buyer" })
    const [r1, r2] = await Promise.all([p1, p2])
    if (r1.status === "found") expect(r1.profile.availableExperiences).toEqual(["decision_maker"])
    if (r2.status === "found") expect(r2.profile.availableExperiences).toEqual(["buyer"])
    expect(session.size()).toBe(2)
  })
})
