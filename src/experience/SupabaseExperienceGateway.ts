// ══════════════════════════════════════════════
// GLAZEO — Supabase Experience Gateway (Production)
// Rezolvă experiența din public.profiles.default_experience.
// Înlocuiește LegacyBuyerExperienceGateway.
// ══════════════════════════════════════════════
import type { ExperienceGateway, ExperienceProfileResult, ExperienceType } from "./types"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Mapează valoarea din DB la ExperienceType.
 * Orice valoare necunoscută → null (nu fallback silențios).
 */
export function toExperienceType(value: string | null): ExperienceType | null {
  if (!value) return null
  const valid: ExperienceType[] = ["decision_maker", "buyer", "builder", "admin"]
  return valid.includes(value as ExperienceType) ? (value as ExperienceType) : null
}

/**
 * Gateway de producție care interoghează public.profiles.
 *
 * - Profil găsit cu default_experience valid → returnează experiența
 * - Profil găsit cu default_experience invalid → availableExperiences = [] (needs_onboarding)
 * - Profil lipsă → status: "missing" (needs_onboarding)
 */
export function createSupabaseExperienceGateway(supabase: SupabaseClient): ExperienceGateway {
  return {
    async getProfile(userId: string): Promise<ExperienceProfileResult> {
      const { data, error } = await supabase
        .from("profiles")
        .select("default_experience")
        .eq("user_id", userId)
        .single()

      if (error) {
        // PGRST116 = no rows returned
        if (error.code === "PGRST116") {
          return { status: "missing" }
        }
        throw new Error(`Failed to load experience profile: ${error.message}`)
      }

      const exp = toExperienceType(data?.default_experience ?? null)

      return {
        status: "found",
        profile: {
          availableExperiences: exp ? [exp] : [],
          lastActiveExperience: exp,
          organizationRoles: {},
        },
      }
    },
  }
}
