// ══════════════════════════════════════════════
// GLAZEO — Experience Resolver (Phase 1)
// ADR-001: Pure function, no I/O, no side effects
// ══════════════════════════════════════════════
import type {
  ExperienceType,
  ExperienceProfile,
  ExperienceContext,
  ExperienceResolution,
} from "./types"

/**
 * Determină experiența curentă pe baza profilului și contextului.
 *
 * Precedență:
 *   1. Experiența solicitată explicit (validată contra availableExperiences)
 *   2. Ultima experiență activă validă
 *   3. Singura experiență disponibilă
 *   4. needs_selection (utilizatorul trebuie să aleagă)
 *
 * NU conține fallback la buyer, admin sau orice altă experiență.
 * NU face I/O. Este o funcție pură, sincronă, testabilă.
 */
export function resolveExperience(
  profile: ExperienceProfile | null,
  context: ExperienceContext = {},
): ExperienceResolution {
  // ── Caz: utilizator neautentificat ──
  if (profile === null) {
    return { status: "unauthenticated" }
  }

  const { availableExperiences, lastActiveExperience } = profile
  const { requestedExperience, activeOrganizationId } = context

  // ── Restrânge la experiențele disponibile în org-ul activ ──
  const orgExperiences = activeOrganizationId
    ? (profile.organizationRoles[activeOrganizationId] ?? availableExperiences)
    : availableExperiences

  // ── Caz: nicio experiență disponibilă ──
  if (orgExperiences.length === 0) {
    return { status: "needs_onboarding", reason: "No experiences available for this account." }
  }

  // ── 1. Experiența solicitată explicit ──
  if (requestedExperience) {
    if (isValidExperience(requestedExperience, orgExperiences)) {
      return { status: "resolved", experience: requestedExperience }
    }
    // Requested experience is not available — fall through to selection
    return {
      status: "needs_selection",
      available: orgExperiences,
    }
  }

  // ── 2. Ultima experiență activă validă ──
  if (lastActiveExperience && isValidExperience(lastActiveExperience, orgExperiences)) {
    return { status: "resolved", experience: lastActiveExperience }
  }

  // ── 3. Singura experiență disponibilă ──
  if (orgExperiences.length === 1) {
    return { status: "resolved", experience: orgExperiences[0] }
  }

  // ── 4. Utilizatorul trebuie să aleagă ──
  return { status: "needs_selection", available: orgExperiences }
}

/** Verifică dacă o experiență face parte din lista de experiențe disponibile. */
function isValidExperience(
  experience: ExperienceType,
  available: ExperienceType[],
): boolean {
  return available.includes(experience)
}
