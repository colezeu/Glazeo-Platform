// ══════════════════════════════════════════════
// GLAZEO — Runtime Test Experience Gateway Entry (isolated local verification)
// NU se folosește în producție. Selectat doar la build --mode runtime-test.
// Scenarii controlate din URL: ?scenario=decision_maker | buyer | missing-success | missing-fail | missing-none
// Colectează erorile de runtime în window.__GLAZEO_RUNTIME_ERRORS__ pentru evidență.
// ══════════════════════════════════════════════
import { createMockExperienceGateway } from "./MockExperienceGateway"
import {
  DECISION_MAKER_PROFILE_RESULT,
  LEGACY_BUYER_PROFILE_RESULT,
  MISSING_PROFILE_RESULT,
} from "./fixtures"
import type { ExperienceGateway } from "./types"

declare global {
  interface Window {
    __GLAZEO_RUNTIME_ERRORS__?: string[]
  }
}

function scenario(): string {
  return new URLSearchParams(window.location.search).get("scenario") ?? "missing-none"
}

function makeGateway(): ExperienceGateway {
  switch (scenario()) {
    case "decision_maker":
      return createMockExperienceGateway(DECISION_MAKER_PROFILE_RESULT)
    case "buyer":
      return createMockExperienceGateway(LEGACY_BUYER_PROFILE_RESULT)
    case "missing-success":
    case "missing-fail":
    case "missing-none":
      return createMockExperienceGateway(MISSING_PROFILE_RESULT)
    default:
      // Scenariu necunoscut → tratat ca profil lipsă, NU ca Buyer silențios.
      return createMockExperienceGateway(MISSING_PROFILE_RESULT)
  }
}

// Collector de erori runtime — doar în modul runtime-test (nu există în producție).
window.__GLAZEO_RUNTIME_ERRORS__ = []
window.addEventListener("error", (e) => window.__GLAZEO_RUNTIME_ERRORS__?.push(`error: ${e.message}`))
window.addEventListener("unhandledrejection", (e) =>
  window.__GLAZEO_RUNTIME_ERRORS__?.push(`unhandledrejection: ${String(e.reason)}`),
)

export const experienceGateway = makeGateway()
