// ══════════════════════════════════════════════
// GLAZEO — Experience Fixtures (Phase 2)
// Profile results predefinite pentru teste și dev.
// ══════════════════════════════════════════════
import type { ExperienceProfile, ExperienceProfileResult } from "./types"

// ── Profile-uri ────────────────────────────────────

/** Profil Buyer — compatibilitate legacy pentru conturile existente. */
export const BUYER_PROFILE: ExperienceProfile = {
  availableExperiences: ["buyer"],
  lastActiveExperience: null,
  organizationRoles: {},
}

/** Profil Decision Maker — arhitect / designer. */
export const DECISION_MAKER_PROFILE: ExperienceProfile = {
  availableExperiences: ["decision_maker"],
  lastActiveExperience: null,
  organizationRoles: {},
}

/** Profil multi-rol — utilizator cu ambele experiențe disponibile. */
export const MULTI_ROLE_PROFILE: ExperienceProfile = {
  availableExperiences: ["decision_maker", "buyer"],
  lastActiveExperience: null,
  organizationRoles: {},
}

/** Profil Admin + Buyer. */
export const ADMIN_BUYER_PROFILE: ExperienceProfile = {
  availableExperiences: ["admin", "buyer"],
  lastActiveExperience: null,
  organizationRoles: {},
}

// ── Rezultate pre-construite ───────────────────────

/** Rezultat legacy: Buyer. Folosit pentru compatibilitatea E2E existentă. */
export const LEGACY_BUYER_PROFILE_RESULT: ExperienceProfileResult = {
  status: "found",
  profile: BUYER_PROFILE,
}

/** Rezultat Decision Maker. */
export const DECISION_MAKER_PROFILE_RESULT: ExperienceProfileResult = {
  status: "found",
  profile: DECISION_MAKER_PROFILE,
}

/** Rezultat: profil inexistent (cont nou, neconfigurat). */
export const MISSING_PROFILE_RESULT: ExperienceProfileResult = {
  status: "missing",
}
