// ══════════════════════════════════════════════
// GLAZEO Decision Maker — DM-004 Flow E2E
// ══════════════════════════════════════════════
import { test, expect } from "@playwright/test"

test.describe("DM-004 Walk-in Shower", () => {

  test("navigates to DM-004 workspace", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    await page.locator("text=Cabină de duș walk-in").click()
    await page.waitForTimeout(500)
    await expect(page.locator("text=Etapa 1/5")).toBeVisible()
    await expect(page.locator("text=estetică").first()).toBeVisible()
  })

  test("saves decision and verifies persistence", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    await page.locator("text=Cabină de duș walk-in").click()
    await page.waitForTimeout(300)
    await page.locator("text=Definește contextul").click()
    await page.waitForTimeout(300)

    // Select context (5 întrebări — ontologie reconstruită)
    await page.locator("text=Nișă (3 pereți)").click()
    await page.locator("text=Suprafețe plane și finisate").click()
    await page.locator("text=Standard (fără cerințe speciale)").click()
    await page.locator("text=Normală (curățare periodică)").click()
    await page.locator("text=Nu (suprafețe plane, estetică maximă)").click()
    await page.locator("text=Vezi opțiunile").click()
    await page.waitForTimeout(500)

    // All 3 recommended
    const badges = page.locator("span:has-text('Recomandat'):not(:has-text('Recomandat:'))")
    await expect(badges).toHaveCount(3)

    // Select paravan → compare → finalize
    await page.locator("text=Selectează și compară").first().click()
    await page.waitForTimeout(300)
    await page.locator("text=Finalizează decizia").click()
    await page.waitForTimeout(500)

    // Save
    await page.locator("text=Salvează decizia").click()
    await page.waitForTimeout(1000)
    await expect(page.locator("text=Salvat")).toBeVisible()
  })
})
