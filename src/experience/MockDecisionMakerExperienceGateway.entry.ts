// ══════════════════════════════════════════════
// GLAZEO — Decision Maker Experience Gateway Entry (E2E)
// Injectat la build E2E când VITE_EXPERIENCE=decision_maker.
// ══════════════════════════════════════════════
import { createMockExperienceGateway } from "./MockExperienceGateway"
import { DECISION_MAKER_PROFILE_RESULT } from "./fixtures"

export const experienceGateway = createMockExperienceGateway(DECISION_MAKER_PROFILE_RESULT)
