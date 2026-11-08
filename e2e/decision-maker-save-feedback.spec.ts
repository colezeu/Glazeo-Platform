// ══════════════════════════════════════════════
// GLAZEO Decision Maker — feedback la salvare (C3)
//
// Acoperă exact ce nu putea fi testat unitar fără RTL:
//   · succes confirmat → mesaj de succes, fără alertă
//   · eroare de persistență → role="alert" vizibil, cu detaliul
//   · eșec → butonul devine „Reîncearcă salvarea"
//   · niciun succes afișat înainte de confirmarea INSERT-ului
//   · reîncercare reușită după un eșec
//
// Rulează pe build-ul e2e-dm (MockDecisionRecordRepository, zero Supabase).
// Eșecul/latența se injectează prin localStorage, hook-ul din mock-ul de test.
// ══════════════════════════════════════════════
import { test, expect, type Page } from "@playwright/test"

const FAIL_FLAG = "glazeo_e2e_fail_save"

async function withSaveMode(page: Page, mode: "1" | "once" | "slow") {
  await page.addInitScript(
    ([key, value]) => {
      try {
        window.localStorage.setItem(key, value)
      } catch {
        /* origine fără storage — nu se întâmplă pe http://localhost */
      }
    },
    [FAIL_FLAG, mode] as const,
  )
}

/** Parcurge DM-004 până la ecranul cu butonul de salvare. */
async function reachDecisionStage(page: Page) {
  await page.goto("/")
  await page.waitForLoadState("networkidle")
  await page.locator("text=Cabină de duș walk-in").click()
  await page.waitForTimeout(300)
  await page.locator("text=Definește contextul").click()
  await page.waitForTimeout(300)

  await page.locator("text=Nișă (3 pereți)").click()
  await page.locator("text=Suprafețe plane și finisate").click()
  await page.locator("text=Standard (fără cerințe speciale)").click()
  await page.locator("text=Normală (curățare periodică)").click()
  await page.locator("text=Nu (suprafețe plane, estetică maximă)").click()
  await page.locator("text=Vezi opțiunile").click()
  await page.waitForTimeout(400)

  await page.locator("text=Selectează și compară").first().click()
  await page.waitForTimeout(300)
  await page.locator("text=Finalizează decizia").click()
  await page.waitForTimeout(400)
}

test.describe("Salvare Decision Record — feedback utilizator", () => {
  test("succes confirmat: mesaj de succes, fără alertă", async ({ page }) => {
    await reachDecisionStage(page)

    await page.getByRole("button", { name: "Salvează decizia" }).click()

    await expect(page.locator("text=Salvat")).toBeVisible()
    await expect(page.locator("[role=alert]")).toHaveCount(0)
  })

  test("eroare de persistență: role=alert vizibil, fără succes", async ({ page }) => {
    await withSaveMode(page, "1")
    await reachDecisionStage(page)

    await page.getByRole("button", { name: "Salvează decizia" }).click()

    const alert = page.locator("[role=alert]")
    await expect(alert).toBeVisible()
    await expect(alert).toContainText("Salvarea a eșuat")
    await expect(alert).toContainText("persistența a eșuat")

    // Niciun succes nu apare când INSERT-ul a eșuat.
    await expect(page.locator("span:has-text('Salvat')")).toHaveCount(0)
  })

  test("eșec: butonul devine „Reîncearcă salvarea”", async ({ page }) => {
    await withSaveMode(page, "1")
    await reachDecisionStage(page)

    await page.getByRole("button", { name: "Salvează decizia" }).click()

    await expect(page.getByRole("button", { name: "Reîncearcă salvarea" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Salvează decizia" })).toHaveCount(0)
  })

  test("niciun succes fals înainte de confirmarea INSERT-ului", async ({ page }) => {
    await withSaveMode(page, "slow")
    await reachDecisionStage(page)

    await page.getByRole("button", { name: "Salvează decizia" }).click()

    // Cât timp persistența e în curs: stare de lucru, fără „Salvat", fără alertă.
    await expect(page.getByRole("button", { name: "Se salvează..." })).toBeVisible()
    await expect(page.locator("span:has-text('Salvat')")).toHaveCount(0)
    await expect(page.locator("[role=alert]")).toHaveCount(0)

    // Abia după confirmare apare succesul.
    await expect(page.locator("span:has-text('Salvat')")).toBeVisible({ timeout: 10_000 })
  })

  test("reîncercare reușită după un eșec", async ({ page }) => {
    await withSaveMode(page, "once")
    await reachDecisionStage(page)

    await page.getByRole("button", { name: "Salvează decizia" }).click()
    await expect(page.locator("[role=alert]")).toBeVisible()

    await page.getByRole("button", { name: "Reîncearcă salvarea" }).click()

    await expect(page.locator("span:has-text('Salvat')")).toBeVisible()
    await expect(page.locator("[role=alert]")).toHaveCount(0)
  })
})
