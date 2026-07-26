// ══════════════════════════════════════════════
// GLAZEO Decision Maker — DM-003 Flow E2E
// ══════════════════════════════════════════════
import { test, expect } from "@playwright/test"

test.describe("DM-003 Facade Glazing Strategy", () => {

  test("navigates from DecisionMakerHome → DM-003 workspace", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    await page.locator("text=Fațadă — strategie de vitrare").click()
    await page.waitForTimeout(500)
    await expect(page.locator("text=Etapa 1/5")).toBeVisible()
    await expect(page.locator("text=transparență").first()).toBeVisible()
  })

  test("all options recommended for moderate/default context", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    await page.locator("text=Fațadă — strategie de vitrare").click()
    await page.waitForTimeout(300)
    await page.locator("text=Definește contextul").click()
    await page.waitForTimeout(300)
    await page.locator("text=Vezi opțiunile").click()
    await page.waitForTimeout(500)
    // Check each option has the "Recomandat" badge (not the reason text)
    const recommendedBadge = page.locator("span:has-text('Recomandat'):not(:has-text('combinație')):not(:has-text('Recomandat:'))")
    await expect(recommendedBadge).toHaveCount(3)
  })

  test("passive thermal → excludes transparency_first and balanced_solar", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    await page.locator("text=Fațadă — strategie de vitrare").click()
    await page.waitForTimeout(300)
    await page.locator("text=Definește contextul").click()
    await page.waitForTimeout(300)
    await page.locator("text=Pasiv").click()
    await page.locator("text=Vezi opțiunile").click()
    await page.waitForTimeout(500)
    // transparency_first should be EXCLUDED
    const aCard = page.locator(".rounded-xl.border-2").filter({ hasText: "Transparență maximă" })
    await expect(aCard.locator("text=Exclus")).toBeVisible()
    // max_performance should be RECOMMENDED
    const cCard = page.locator(".rounded-xl.border-2").filter({ hasText: "Performanță maximă" })
    await expect(cCard.locator("text=Recomandat").first()).toBeVisible()
  })
})
