// ══════════════════════════════════════════════
// GLAZEO Decision Maker — E2E Tests (Phase 4A)
// ══════════════════════════════════════════════
import { test, expect } from "@playwright/test"

test.describe("Decision Maker Home", () => {

  test("renders Decision Maker greeting, not Buyer dashboard", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")

    // DM-specific content
    await expect(page.locator("text=Ce proiectezi?")).toBeVisible()
    await expect(page.locator("text=Decision Tools")).toBeVisible()
    await expect(page.locator("text=Decision Memory")).toBeVisible()

    // Buyer content MUST NOT appear
    await expect(page.locator("text=Configurează un produs")).not.toBeVisible()
    await expect(page.locator("text=Proiecte recente")).not.toBeVisible()
    await expect(page.locator("text=Oferte care necesită acțiune")).not.toBeVisible()
  })

  test("shows intents with correct availability", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")

    // Meeting Room Partition — exists but not available (În curând)
    const partition = page.locator("text=Compartimentare sală de ședințe").first()
    await expect(partition).toBeVisible()

    // "În curând" badge should be 0 — all intents now available
    const badges = page.locator("text=În curând")
    await expect(badges).toHaveCount(0)
  })

  test("does not show pricing, offers, or orders", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")

    // No commercial language
    await expect(page.locator("text=Preț")).not.toBeVisible()
    await expect(page.locator("text=Ofertă")).not.toBeVisible()
    await expect(page.locator("text=Comandă")).not.toBeVisible()
    await expect(page.locator("text=Configurator")).not.toBeVisible()

    // Decision-oriented language IS present
    await expect(page.locator("text=Definește contextul")).toBeVisible()
    await expect(page.locator("text=opțiuni comparabile")).toBeVisible()
  })

  test("shows Knowledge card with DM-001 reference", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")

    await expect(page.locator("text=Decision Memory")).toBeVisible()
    await expect(page.locator("text=Compartimentare sală de ședințe — clădire de patrimoniu")).toBeVisible()
    await expect(page.locator("text=continuitate spațială")).toBeVisible()
  })
})
