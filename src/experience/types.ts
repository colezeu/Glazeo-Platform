// ══════════════════════════════════════════════
// GLAZEO — Experience Types (Phase 1)
// ADR-001: Experience Resolution
// ══════════════════════════════════════════════

/** Cele patru experiențe GLAZEO. Separat de BuyerLevel. */
export type ExperienceType = "decision_maker" | "buyer" | "builder" | "admin"

/** Profilul de experiență al unui utilizator. Încărcat de ExperienceGateway. */
export interface ExperienceProfile {
  /** Toate experiențele disponibile pentru acest utilizator. */
  availableExperiences: ExperienceType[]

  /** Experiența implicită sugerată de sistem. */
  defaultExperience: ExperienceType

  /** Ultima experiență activă (persisted cross-session). null = prima utilizare. */
  lastActiveExperience: ExperienceType | null

  /** Per organizație: experiențele disponibile în fiecare org. */
  organizationRoles: Record<string, ExperienceType[]>
}

/** Contextul curent pentru rezoluția experienței. */
export interface ExperienceContext {
  /** Experiența solicitată explicit (query param, session storage). */
  requestedExperience?: ExperienceType

  /** ID-ul organizației active (dacă există). */
  activeOrganizationId?: string
}

/**
 * Rezultatul rezoluției experienței.
 * Discriminated union — fiecare stare e tratată explicit.
 * Zero fallback silențios.
 */
export type ExperienceResolution =
  | { status: "unauthenticated" }
  | { status: "needs_onboarding"; reason: string }
  | { status: "needs_selection"; available: ExperienceType[] }
  | { status: "resolved"; experience: ExperienceType }

/**
 * Gateway pentru încărcarea ExperienceProfile.
 * Pattern identic cu AuthGateway — dependency injection la composition root.
 */
export interface ExperienceGateway {
  getProfile(userId: string): Promise<ExperienceProfile>
}
