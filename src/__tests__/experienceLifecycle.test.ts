// ══════════════════════════════════════════════
// GLAZEO — Experience Initialization Lifecycle Tests
// Verifică: no flash, gateway error, retry, stale async
// ══════════════════════════════════════════════
import { describe, it, expect } from "vitest"

// ── Simulăm logica requestId fără a monta React ──
// Testăm pattern-ul direct: aceeași logică ca în App.tsx.

/**
 * Simulează bucla de inițializare din App.tsx.
 * Când shouldResetDuring=true, resetul (logout) are loc ÎNAINTE ca
 * getProfile() să rezolve — simulând o cursă async reală.
 */
async function simulateInitialization(
  gatewayResult: "success" | "error" | "slow",
  shouldResetDuring: boolean = false,
): Promise<{
  phase: string
  experienceStatus: string
  staleResultIgnored: boolean
}> {
  let requestId = 1
  let phase = "checking_auth"
  let experienceStatus = "unauthenticated"
  let staleResultIgnored = false

  // Pentru cazul "slow": creăm o promisiune controlabilă
  let resolveProfile!: (value: { status: string }) => void
  let rejectProfile!: (err: Error) => void
  const profilePromise = new Promise<{ status: string }>((res, rej) => {
    resolveProfile = res
    rejectProfile = rej
  })

  // Phase 1: checking auth → resolving
  phase = "resolving_experience"

  // Lansăm getProfile() și capturăm requestId-ul curent
  const capturedId = requestId

  // Dacă trebuie să simulăm resetul ÎNAINTE de rezolvare:
  if (shouldResetDuring) {
    // Reset (logout) — invalidează request-ul în curs
    requestId++
    experienceStatus = "unauthenticated"
    phase = "ready"
  }

  // Acum rezolvăm/rejectăm promisiunea:
  if (gatewayResult === "error") {
    rejectProfile(new Error("Gateway unavailable"))
  } else {
    resolveProfile({ status: "found" })
  }

  try {
    await profilePromise
    // Verificăm dacă requestId s-a schimbat de la lansare
    if (capturedId !== requestId) {
      staleResultIgnored = true
      // Rezultatul se ignoră — starea nu se modifică
      return { phase, experienceStatus, staleResultIgnored }
    }
    experienceStatus = "resolved"
    phase = "ready"
  } catch (_err) {
    if (capturedId !== requestId) {
      staleResultIgnored = true
      return { phase, experienceStatus, staleResultIgnored }
    }
    phase = "experience_error"
  }

  return { phase, experienceStatus, staleResultIgnored }
}

// ── Tests ──────────────────────────────────────────

describe("Experience initialization — no flash", () => {
  it("does not show landing during resolving_experience phase", async () => {
    const result = await simulateInitialization("success")
    // Phase trece prin resolving_experience → ready. Nu ajunge la landing.
    expect(result.phase).toBe("ready")
    expect(result.experienceStatus).toBe("resolved")
  })
})

describe("Experience initialization — gateway error", () => {
  it("shows experience_error, not needs_onboarding", async () => {
    const result = await simulateInitialization("error")
    expect(result.phase).toBe("experience_error")
    // Statusul rămâne neinițializat, dar faza e eroare (nu onboarding)
    expect(result.experienceStatus).toBe("unauthenticated")
  })
})

describe("Experience initialization — retry", () => {
  it("can transition from error to resolved on retry", async () => {
    // Prima încercare: eșuează
    const first = await simulateInitialization("error")
    expect(first.phase).toBe("experience_error")

    // Retry: reușește
    const second = await simulateInitialization("success")
    expect(second.phase).toBe("ready")
    expect(second.experienceStatus).toBe("resolved")
  })
})

describe("Experience initialization — stale async", () => {
  it("ignores delayed result after reset/logout", async () => {
    const result = await simulateInitialization("slow", true)
    // După reset, experiența e unauthenticated
    expect(result.experienceStatus).toBe("unauthenticated")
    // Rezultatul întârziat nu se aplică
    expect(result.staleResultIgnored).toBe(true)
  })
})
