import { defineConfig, devices } from "@playwright/test"

// Decision Maker E2E: folosește mode=e2e-dm (vite) + MockDecisionMakerExperienceGateway

export default defineConfig({
  testDir: "./e2e",
  testMatch: "decision-maker*.spec.ts",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:4174",
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: [
    {
      command: "npm run build:e2e-dm && npx vite preview --port 4174 --host 0.0.0.0",
      url: "http://localhost:4174",
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
})
