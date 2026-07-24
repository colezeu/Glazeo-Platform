// ══════════════════════════════════════════════
// GLAZEO — Experience Gateway Entry (E2E)
// Pre-built mock gateway with BUYER_PROFILE.
// ══════════════════════════════════════════════
import { createMockExperienceGateway } from "./MockExperienceGateway"
import { LEGACY_BUYER_PROFILE_RESULT } from "./fixtures"

export const experienceGateway = createMockExperienceGateway(LEGACY_BUYER_PROFILE_RESULT)
