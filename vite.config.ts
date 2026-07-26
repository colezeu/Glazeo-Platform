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
              : "./src/experience/LegacyBuyerExperienceGateway.entry.ts",
          import.meta.url,
        ),
      ),
      "decision-record-repo": fileURLToPath(
        new URL(
          mode === "e2e" || mode === "e2e-dm"
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
