// ══════════════════════════════════════════════
// GLAZEO — Experience Resolver (Phase 1, v2)
// ADR-001: Pure function, no I/O, no side effects
// ══════════════════════════════════════════════
import type {
  ExperienceType,
  ExperienceContext,
  ExperienceResolution,
  ExperienceProfileResult,
} from "./types"

/**
 * Determină experiența curentă pe baza profilului și contextului.
 *
 * Precedență (când profile este "found"):
 *   1. Experiența solicitată explicit (validată contra availableExperiences)
 *   2. Ultima experiență activă validă
 *   3. Singura experiență disponibilă
 *   4. needs_selection (utilizatorul trebuie să aleagă)
 *
 * Cazul "unauthenticated" este gestionat de composition root înainte de a apela
 * resolverul (fără AuthUser → nu se ajunge aici).
 *
 * "missing" → needs_onboarding: utilizator autentificat dar fără profil.
 *
 * NU conține fallback la buyer, admin sau orice altă experiență.
 * NU face I/O. Este o funcție pură, sincronă, testabilă.
 */
export function resolveExperience(
  result: ExperienceProfileResult,
  context: ExperienceContext = {},
): ExperienceResolution {
  // ── Profil inexistent ──
  if (result.status === "missing") {
    return {
      status: "needs_onboarding",
      reason: "No experience profile found for this account.",
    }
  }

  const profile = result.profile
  const { availableExperiences, lastActiveExperience } = profile
  const { requestedExperience, activeOrganizationId } = context

  // ── Restrânge la experiențele din organizația activă ──
  // Organizație fără mapping → [] (nu fallback la availableExperiences).
  const orgExperiences = activeOrganizationId
    ? (profile.organizationRoles[activeOrganizationId] ?? [])
    : availableExperiences

  // ── Caz: nicio experiență disponibilă ──
  if (orgExperiences.length === 0) {
    const reason = activeOrganizationId
      ? `No roles configured for organization ${activeOrganizationId}.`
      : "No experiences available for this account."
    return { status: "needs_onboarding", reason }
  }

  // ── 1. Experiența solicitată explicit ──
  if (requestedExperience) {
    if (isValidExperience(requestedExperience, orgExperiences)) {
      return { status: "resolved", experience: requestedExperience }
    }
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
