// ══════════════════════════════════════════════
// GLAZEO — Onboarding (owner unic al inițializării contului)
// Rutează utilizatorii fără profil către inițializare.
// Folosește DIRECT răspunsul RPC — fără re-read sensibil la timing.
// Marker de succes doar după confirmarea RPC; la eșec NU se marchează.
// ══════════════════════════════════════════════
import type { ExperienceProfileResult } from "./types"
import { toExperienceType } from "./SupabaseExperienceGateway"

export const PROFILE_MARKER_PREFIX = "profile_created_"

// ── Dedup in-flight: o singură inițializare RPC per utilizator, per context pagină ──
// Doi apelanți concurenți pentru ACELAȘI user primesc aceeași promisiune;
// entry-ul e eliberat la settle, deci un retry după eșec rămâne posibil.
const inFlight = new Map<string, Promise<ExperienceProfileResult>>()

/** Curăță registry-ul in-flight (folosit de teste pentru izolare). */
export function resetOnboardingInFlight(): void {
  inFlight.clear()
}

export interface OnboardingDeps {
  currentUser: { id: string; email: string | null } | null
  registerAccount: (userId: string, email: string) => Promise<{ defaultExperience: string | null } | null>
  session: {
    getMarker: (key: string) => boolean
    setMarker: (key: string) => void
  }
}

/**
 * Owner unic al auto-onboarding-ului (missing profile).
 *
 * - initializează EXACT O DATĂ (markerul există doar după succes RPC);
 * - profilul rezultat vine din răspunsul RPC, nu dintr-un re-read imediat;
 * - la eșec nu setează marker și returnează status missing (needs_onboarding);
 * - nu suprascrie niciodată un profil existent (RPC face ON CONFLICT DO NOTHING).
 */
export async function ensureProfileInitialized(
  missingResult: { status: "missing" },
  deps: OnboardingDeps,
): Promise<ExperienceProfileResult> {
  if (!deps.currentUser?.email) return missingResult

  const key = `${PROFILE_MARKER_PREFIX}${deps.currentUser.id}`
  if (deps.session.getMarker(key)) return missingResult

  const userId = deps.currentUser.id
  const userEmail = deps.currentUser.email

  // Un apel deja în curs pentru acest user → reutilizează aceeași promisiune.
  const existing = inFlight.get(key)
  if (existing) return existing

  const run: Promise<ExperienceProfileResult> = (async (): Promise<ExperienceProfileResult> => {
    let init: { defaultExperience: string | null } | null
    try {
      init = await deps.registerAccount(userId, userEmail)
    } catch {
      // Eșec de inițializare: fără marker, fără fallback silențios → needs_onboarding.
      return missingResult
    }
    if (!init?.defaultExperience) return missingResult

    const exp = toExperienceType(init.defaultExperience)
    if (!exp) return missingResult

    deps.session.setMarker(key)
    return {
      status: "found",
      profile: {
        availableExperiences: [exp],
        lastActiveExperience: exp,
        organizationRoles: {},
      },
    }
  })()

  // Entry-ul in-flight e eliberat la settle (succes SAU eșec) → retry-ul ulterior e posibil.
  const tracked = run.finally(() => {
    inFlight.delete(key)
  })
  inFlight.set(key, tracked)
  return tracked
}
