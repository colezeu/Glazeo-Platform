// ══════════════════════════════════════════════
// GLAZEO Decision Maker — DM-001 Flow E2E (Phase 4B)
// ══════════════════════════════════════════════
import { test, expect } from "@playwright/test"

test.describe("DM-001 Decision Flow", () => {

  test("navigates from DecisionMakerHome → DecisionWorkspace", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")

    // Click pe intent-ul activ
    await page.locator("text=Compartimentare sală de ședințe").first().click()
    await page.waitForTimeout(500)

    // Etapa 1: Intenție
    await expect(page.locator("text=Etapa 1/5")).toBeVisible()
    await expect(page.locator("text=continuitatea spațială")).toBeVisible()

    // Navighează la context
    await page.locator("text=Definește contextul").click()
    await page.waitForTimeout(300)

    // Etapa 2: Context
    await expect(page.locator("text=Etapa 2/5")).toBeVisible()
    await expect(page.locator("text=Contextul proiectului")).toBeVisible()
  })

  test("frameless recommended: structural + visual_only → frameless accepted", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")

    // Navighează la DecisionWorkspace
    await page.locator("text=Compartimentare sală de ședințe").first().click()
    await page.waitForTimeout(300)
    await page.locator("text=Definește contextul").click()
    await page.waitForTimeout(300)

    // Setează context favorabil frameless
    await page.locator("text=Tavan structural").click()
    await page.locator("text=Moderat").first().click()
    await page.locator("text=Vizuală").click()
    await page.locator("text=Nu").last().click()

    // Navighează la opțiuni
    await page.locator("text=Vezi opțiunile").click()
    await page.waitForTimeout(500)

    // Etapa 3: Opțiuni — frameless recomandat
    await expect(page.locator("text=Etapa 3/5")).toBeVisible()
    await expect(page.locator("text=Recomandat").first()).toBeVisible()

    // Frameless are badge "Recomandat"
    const framelessCard = page.locator(".rounded-xl.border-2").filter({ hasText: "Minimal" })
    const badge = framelessCard.locator("text=Recomandat").first()
    await expect(badge).toBeVisible()

    // Selectează frameless → navighează la comparație
    await framelessCard.locator("text=Selectează și compară").click()
    await page.waitForTimeout(300)

    // Etapa 4: Comparație
    await expect(page.locator("text=Etapa 4/5")).toBeVisible()
    await expect(page.locator("text=Opțiunea ta")).toBeVisible()

    // Finalizează
    await page.locator("text=Finalizează decizia").click()
    await page.waitForTimeout(300)

    // Etapa 5: Decision Record
    await expect(page.locator("text=Decizie finalizată")).toBeVisible()
    await expect(page.locator("text=DM-")).toBeVisible()
    await expect(page.locator("text=Compromisuri acceptate")).toBeVisible()
    await expect(page.locator("text=Pașii următori")).toBeVisible()
  })

  test("frameless rejected: confidential acoustic → aluminum recommended", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")

    // Navighează la DecisionWorkspace
    await page.locator("text=Compartimentare sală de ședințe").first().click()
    await page.waitForTimeout(300)
    await page.locator("text=Definește contextul").click()
    await page.waitForTimeout(300)

    // Setează context care respinge frameless: acustică confidențială
    await page.locator("text=Tavan structural").click()
    await page.locator("text=Moderat").first().click()
    await page.locator("text=Confidențială").click()
    await page.locator("text=Da").last().click()

    // Navighează la opțiuni
    await page.locator("text=Vezi opțiunile").click()
    await page.waitForTimeout(500)

    // Frameless trebuie să fie NERECOMANDAT
    const framelessCard = page.locator(".rounded-xl.border-2").filter({ hasText: "Minimal" })
    await expect(framelessCard.locator("text=Nerecomandat")).toBeVisible()

    // Aluminum trebuie să fie RECOMANDAT (pentru confidențialitate)
    const aluminumCard = page.locator(".rounded-xl.border-2").filter({ hasText: "Structural — profile negre" })
    await expect(aluminumCard.locator("text=Recomandat")).toBeVisible()
    await expect(aluminumCard.locator("text=confidențialitate")).toBeVisible()
  })
})
