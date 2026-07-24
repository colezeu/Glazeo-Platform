// ══════════════════════════════════════════════
// GLAZEO — Mock Experience Gateway (Phase 2)
// ADR-001: Deterministic gateway for E2E and dev.
// ══════════════════════════════════════════════
import type { ExperienceGateway, ExperienceProfileResult } from "./types"

/**
 * Creează un ExperienceGateway mock care returnează un rezultat fix.
 *
 * Parametrul `result` este OBLIGATORIU și explicit.
 * Nu există fallback implicit la Buyer — composition root-ul decide.
 */
export function createMockExperienceGateway(
  result: ExperienceProfileResult,
): ExperienceGateway {
  return {
    async getProfile(_userId: string): Promise<ExperienceProfileResult> {
      // Returnează o copie pentru a preveni mutațiile accidentale
      if (result.status === "found") {
        return {
          status: "found",
          profile: {
            availableExperiences: [...result.profile.availableExperiences],
            lastActiveExperience: result.profile.lastActiveExperience,
            organizationRoles: { ...result.profile.organizationRoles },
          },
        }
      }
      return { status: "missing" }
    },
  }
}
