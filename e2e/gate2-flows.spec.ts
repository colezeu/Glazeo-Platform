// ══════════════════════════════════════════════
// GLAZEO Gate 2 — E2E Tests (Playwright)
// ══════════════════════════════════════════════
import { test, expect } from "@playwright/test";

const REVIEW_DIR = "e2e/review";

test.describe("Gate 2 — Critical Business Flows", () => {

  // ════════════════════════════════════════════
  // Flow 1: Home → Project Workspace
  // ════════════════════════════════════════════
  test("Home → Project Workspace", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Home Workspace loaded — verify UI is visible
    await expect(page.locator("text=Proiecte recente")).toBeVisible();
    await expect(page.locator("text=Recommended Action")).toBeVisible();

    // Click first project (heading in clickable card)
    await page.getByRole("heading", { name: "Vila Popescu" }).first().click();
    await page.waitForLoadState("networkidle");

    // Project Workspace loaded
    await expect(page.locator("h1")).toContainText("Vila Popescu");
    await expect(page.locator("text=Overview")).toBeVisible();
    await expect(page.locator("text=Configurări")).toBeVisible();

    await page.screenshot({ path: `${REVIEW_DIR}/01-home-project.png`, fullPage: true });
  });

  // ════════════════════════════════════════════
  // Flow 2: Configuration → Request Quote
  // ════════════════════════════════════════════
  test("Configuration → Request Quote", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Navigate to project
    await page.getByRole("heading", { name: "Vila Popescu" }).first().click();
    await page.waitForLoadState("networkidle");

    // Switch to Configurări tab
    await page.locator("button:has-text('Configurări')").click();
    await page.waitForTimeout(500);

    // Click "Solicită ofertă" on first draft config
    const requestBtn = page.locator("button:has-text('Solicită ofertă')").first();
    await expect(requestBtn).toBeVisible();
    await requestBtn.click();
    await page.waitForTimeout(300);

    // Config should now show "Read-only"
    await expect(page.locator("text=Read-only")).toBeVisible();

    // Switch to Oferte tab — new quote should exist
    await page.locator("button:has-text('Oferte')").click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=OF-2026-").first()).toBeVisible();

    await page.screenshot({ path: `${REVIEW_DIR}/02-config-request-quote.png`, fullPage: true });
  });

  // ════════════════════════════════════════════
  // Flow 3: Quote → Accept → Order
  // ════════════════════════════════════════════
  test("Quote → Accept → Order", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Navigate to project
    await page.getByRole("heading", { name: "Vila Popescu" }).first().click();
    await page.waitForLoadState("networkidle");

    // Switch to Oferte tab
    await page.locator("button:has-text('Oferte')").click();
    await page.waitForTimeout(500);

    // Click Accept on OF-2026-0042 (initial sent quote)
    const acceptBtn = page.locator("button:has-text('Acceptă')").first();
    await expect(acceptBtn).toBeVisible();
    await acceptBtn.click();
    await page.waitForTimeout(300);

    // Confirm dialog should appear
    await expect(page.locator("text=Confirmă acceptarea ofertei")).toBeVisible();
    await expect(page.locator("text=Se va crea o comandă")).toBeVisible();

    // Click confirm
    await page.locator("button:has-text('Acceptă oferta')").click();
    await page.waitForTimeout(500);

    // Should switch to Comenzi tab
    await expect(page.locator("text=Comenzi").first()).toBeVisible();
    // Order should exist
    await expect(page.locator("text=CMD-2026-").first()).toBeVisible();
    // Timeline should show snapshot info
    await expect(page.locator("text=Ofertă:")).toBeVisible();

    await page.screenshot({ path: `${REVIEW_DIR}/03-quote-accept-order.png`, fullPage: true });
  });

  // ════════════════════════════════════════════
  // Flow 4: Duplicate Configuration
  // ════════════════════════════════════════════
  test("Duplicate Configuration creates new version", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.getByRole("heading", { name: "Vila Popescu" }).first().click();
    await page.waitForLoadState("networkidle");

    // Configurări tab
    await page.locator("button:has-text('Configurări')").click();
    await page.waitForTimeout(500);

    // Click Duplică on first config
    const dupBtn = page.locator("button:has-text('Duplică')").first();
    await expect(dupBtn).toBeVisible();
    await dupBtn.click();
    await page.waitForTimeout(300);

    // Should see v4 in the list
    await expect(page.locator("text=v4").first()).toBeVisible();

    await page.screenshot({ path: `${REVIEW_DIR}/04-duplicate-config.png`, fullPage: true });
  });

  // ════════════════════════════════════════════
  // Flow 5: Tab navigation + state consistency
  // ════════════════════════════════════════════
  test("Tab navigation maintains state consistency", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.getByRole("heading", { name: "Vila Popescu" }).first().click();
    await page.waitForLoadState("networkidle");

    // Cycle through all tabs
    const tabs = ["Overview", "Configurări", "Oferte", "Comenzi"];
    for (const tab of tabs) {
      await page.locator(`button:has-text("${tab}")`).click();
      await page.waitForTimeout(300);
      // Each tab should have its section visible
      await expect(page.locator(`text=${tab}`).first()).toBeVisible();
    }

    // Activity timeline should be visible
    await expect(page.locator("text=Activitate recentă")).toBeVisible();

    // Back to Home
    await page.locator("text=← Workspace").click();
    await expect(page.locator("text=Proiecte recente")).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: `${REVIEW_DIR}/05-tab-navigation.png`, fullPage: true });
  });
});
