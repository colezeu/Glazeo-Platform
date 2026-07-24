// ══════════════════════════════════════════════
// GLAZEO — Legacy Buyer Experience Gateway
// Adapter temporar pentru producție.
// Returnează întotdeauna BUYER_PROFILE (compatibilitate).
// Va fi înlocuit când auth claims conțin roluri reale.
// ══════════════════════════════════════════════
import type { ExperienceGateway, ExperienceProfileResult } from "./types"

/**
 * Gateway de producție temporar.
 *
 * Toate conturile primesc experiența Buyer până când
 * Phase 2 introduce roluri reale din auth claims.
 *
 * NU importă fixture-uri din fixtures.ts (acestea sunt pentru teste/E2E).
 */
export function createLegacyBuyerExperienceGateway(): ExperienceGateway {
  return {
    async getProfile(_userId: string): Promise<ExperienceProfileResult> {
      return {
        status: "found",
        profile: {
          availableExperiences: ["buyer"],
          lastActiveExperience: null,
          organizationRoles: {},
        },
      }
    },
  }
}
