// ══════════════════════════════════════════════
// GLAZEO — Vite config. Aliasurile de gateway sunt per-mode:
//   e2e / e2e-dm      → mocks Playwright (build:e2e / build:e2e-dm)
//   runtime-test      → mocks pentru verificare locală cu scenarii controlate
//                       (build:runtime-test, apoi `npm run preview` și deschide
//                        `/?scenario=decision_maker|buyer|missing-success|missing-fail|missing-none`).
//                       NU are impact asupra bundle-ului de producție (mode-scoped).
//   orice alt mode    → gateways Supabase (producție)
// ══════════════════════════════════════════════
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath } from "node:url"

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "auth-gateway": fileURLToPath(
        new URL(
          mode === "e2e" || mode === "e2e-dm"
            ? "./src/auth/MockAuthGateway.ts"
            : mode === "runtime-test"
              ? "./src/auth/RuntimeScenarioAuthGateway.ts"
              : "./src/auth/SupabaseAuthGateway.ts",
          import.meta.url,
        ),
      ),
      "experience-gateway": fileURLToPath(
        new URL(
          mode === "e2e-dm"
            ? "./src/experience/MockDecisionMakerExperienceGateway.entry.ts"
            : mode === "e2e"
              ? "./src/experience/MockExperienceGateway.entry.ts"
              : mode === "runtime-test"
                ? "./src/experience/RuntimeScenarioExperienceGateway.entry.ts"
                : "./src/experience/SupabaseExperienceGateway.entry.ts",
          import.meta.url,
        ),
      ),
      "decision-record-repo": fileURLToPath(
        new URL(
          mode === "e2e" || mode === "e2e-dm" || mode === "runtime-test"
            ? "./src/persistence/MockDecisionRecordRepository.entry.ts"
            : "./src/persistence/SupabaseDecisionRecordRepository.entry.ts",
          import.meta.url,
        ),
      ),
    },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
  },
}))
