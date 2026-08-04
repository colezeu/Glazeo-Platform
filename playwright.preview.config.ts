// ══════════════════════════════════════════════
// GLAZEO — Playwright Preview Validation Config
// ══════════════════════════════════════════════
import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  testMatch: "preview-validation.spec.ts",
  timeout: 60000,
  expect: { timeout: 15000 },
  use: {
    baseURL: "https://glazeo-platform-3bstydjv8-colezeus-projects.vercel.app",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { viewport: { width: 1440, height: 900 } },
    },
  ],
  // NO webServer — testăm direct pe Preview
})
