// ══════════════════════════════════════════════
// GLAZEO — Preview Validation Tests
// Rulează: npx playwright test --config=playwright.preview.config.ts
// ══════════════════════════════════════════════
import { test, expect, type Page, type BrowserContext } from "@playwright/test"

const PREVIEW = "https://glazeo-platform-3bstydjv8-colezeus-projects.vercel.app"
const SUPABASE_URL = "https://vxtpkbckdvrmgudvkqwx.supabase.co"
const TS = Date.now()

// ── State partajat între teste ──────────────────
let SUPABASE_ANON_KEY = ""
let DECISION_MAKER_CREDS = { email: "", password: "" }
let BUYER_CREDS = { email: "", password: "" }
let NO_PROFILE_CREDS = { email: "", password: "" }

// ── Helpers ──────────────────────────────────────

async function captureAnonKey(page: Page) {
  // Interceptează requesturile Supabase și extrage apikey
  await page.route("**/*.supabase.co/**", (route) => {
    const headers = route.request().headers()
    if (headers["apikey"] && !SUPABASE_ANON_KEY) {
      SUPABASE_ANON_KEY = headers["apikey"]
      console.log("KEY CAPTURED:", SUPABASE_ANON_KEY.slice(0, 15) + "...")
    }
    route.continue()
  })
}

async function signupViaUI(page: Page, email: string, password: string) {
  await page.goto(PREVIEW, { waitUntil: "domcontentloaded" })
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button:has-text("Începe")')
  // Așteaptă să se rezolve experiența
  await page.waitForTimeout(3000)
}

async function updateProfileExperience(
  page: Page,
  accessToken: string,
  userId: string,
  experience: string,
) {
  const res = await page.evaluate(
    async ({ k, u, t, uid, exp }) => {
      const r = await fetch(u + "/rest/v1/profiles?user_id=eq." + uid, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ["apikey"]: k,
          ["Authorization"]: "Bearer " + t,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ default_experience: exp }),
      })
      return { ok: r.ok, status: r.status }
    },
    { k: SUPABASE_ANON_KEY, u: SUPABASE_URL, t: accessToken, uid: userId, exp: experience },
  )
  return res
}

async function deleteProfile(page: Page, accessToken: string, userId: string) {
  const res = await page.evaluate(
    async ({ k, u, t, uid }) => {
      const r = await fetch(u + "/rest/v1/profiles?user_id=eq." + uid, {
        method: "DELETE",
        headers: {
          ["apikey"]: k,
          ["Authorization"]: "Bearer " + t,
        },
      })
      return { ok: r.ok, status: r.status }
    },
    { k: SUPABASE_ANON_KEY, u: SUPABASE_URL, t: accessToken, uid: userId },
  )
  return res
}

// ── Setup global ─────────────────────────────────

test.describe("Setup: capture key + create users", () => {
  test("capture Supabase anon key from app requests", async ({ page }) => {
    await captureAnonKey(page)
    await page.goto(PREVIEW, { waitUntil: "networkidle", timeout: 15000 })

    // Declanșează un request Supabase (signup factice)
    try {
      await page.fill('input[type="email"]', `probe-${TS}@test.dev`)
      await page.fill('input[type="password"]', `Probe${TS}!`)
      await page.click('button:has-text("Începe")')
      await page.waitForTimeout(3000)
    } catch {
      // Ignorăm eroarea — important e că requestul a fost făcut
    }

    expect(SUPABASE_ANON_KEY).toBeTruthy()
    expect(SUPABASE_ANON_KEY).toMatch(/^eyJ/)
    console.log("✅ Anon key captured")
  })

  test("create decision_maker user", async ({ page }) => {
    DECISION_MAKER_CREDS = {
      email: `test-dm-${TS}@glass-associates.dev`,
      password: `Dm${TS}!Aa`,
    }

    await captureAnonKey(page)

    // 1. Sign up
    await page.goto(PREVIEW, { waitUntil: "domcontentloaded" })
    await page.fill('input[type="email"]', DECISION_MAKER_CREDS.email)
    await page.fill(
      'input[type="password"]',
      DECISION_MAKER_CREDS.password,
    )
    await page.click('button:has-text("Începe")')
    await page.waitForTimeout(4000)

    // 2. Get access token from localStorage
    const session = await page.evaluate(() => {
      const stored = localStorage.getItem("sb-vxtpkbckdvrmgudvkqwx-auth-token")
      return stored ? JSON.parse(stored) : null
    })
    expect(session).toBeTruthy()
    expect(session.user).toBeTruthy()
    console.log("User created:", session.user.id)

    // 3. Update profile to decision_maker
    const result = await updateProfileExperience(
      page,
      session.access_token,
      session.user.id,
      "decision_maker",
    )
    expect(result.ok).toBe(true)
    console.log("✅ Profile updated to decision_maker")

    // 4. Logout
    await page.evaluate(() => localStorage.clear())
  })

  test("create buyer user", async ({ page }) => {
    BUYER_CREDS = {
      email: `test-buyer-${TS}@glass-associates.dev`,
      password: `Buy${TS}!Aa`,
    }

    await captureAnonKey(page)

    await page.goto(PREVIEW, { waitUntil: "domcontentloaded" })
    await page.fill('input[type="email"]', BUYER_CREDS.email)
    await page.fill('input[type="password"]', BUYER_CREDS.password)
    await page.click('button:has-text("Începe")')
    await page.waitForTimeout(4000)

    // profile default = 'buyer' (setat de rpc_initialize_account)
    console.log("✅ Buyer user created")
    await page.evaluate(() => localStorage.clear())
  })

  test("create no-profile user", async ({ page }) => {
    NO_PROFILE_CREDS = {
      email: `test-noprofile-${TS}@glass-associates.dev`,
      password: `NoP${TS}!Aa`,
    }

    await captureAnonKey(page)

    await page.goto(PREVIEW, { waitUntil: "domcontentloaded" })
    await page.fill('input[type="email"]', NO_PROFILE_CREDS.email)
    await page.fill('input[type="password"]', NO_PROFILE_CREDS.password)
    await page.click('button:has-text("Începe")')
    await page.waitForTimeout(4000)

    // Get session and delete profile
    const session = await page.evaluate(() => {
      const stored = localStorage.getItem("sb-vxtpkbckdvrmgudvkqwx-auth-token")
      return stored ? JSON.parse(stored) : null
    })

    if (session) {
      const del = await deleteProfile(page, session.access_token, session.user.id)
      console.log("Profile deleted:", del.ok)
    }

    await page.evaluate(() => localStorage.clear())
    console.log("✅ No-profile user ready")
  })
})

// ══════════════════════════════════════════════
// Scenariul 1: Decision Maker
// ══════════════════════════════════════════════
test.describe("Decision Maker Experience", () => {
  test("renders DecisionMakerHome with Decision Tools", async ({ page }) => {
    await captureAnonKey(page)
    await page.goto(PREVIEW, { waitUntil: "domcontentloaded" })

    // Login
    await page.fill('input[type="email"]', DECISION_MAKER_CREDS.email)
    await page.fill('input[type="password"]', DECISION_MAKER_CREDS.password)
    await page.click('button:has-text("Conectează-te")')
    await page.waitForTimeout(4000)

    // Verify: DecisionMakerHome
    await expect(page.locator("text=Ce proiectezi?")).toBeVisible({
      timeout: 8000,
    })
    await expect(page.locator("text=Decision Tools")).toBeVisible()
    await expect(
      page.locator("text=Compartimentare sală de ședințe"),
    ).toBeVisible()
    await expect(page.locator("text=Balustradă din sticlă")).toBeVisible()

    // Should NOT have Buyer elements
    await expect(page.locator("text=Proiecte recente")).not.toBeVisible()
    await expect(page.locator("text=Configurează un produs")).not.toBeVisible()

    console.log("✅ DecisionMakerHome OK")
  })

  test("navigate to DecisionWorkspace + persist + reload", async ({
    page,
  }) => {
    await captureAnonKey(page)
    await page.goto(PREVIEW, { waitUntil: "domcontentloaded" })

    // Login
    await page.fill('input[type="email"]', DECISION_MAKER_CREDS.email)
    await page.fill('input[type="password"]', DECISION_MAKER_CREDS.password)
    await page.click('button:has-text("Conectează-te")')
    await page.waitForTimeout(4000)

    // Navigate to meeting room decision
    await page.click("text=Compartimentare sală de ședințe")
    await page.waitForTimeout(2000)

    // Should show decision workspace
    await expect(page.locator("text=Tip tavan")).toBeVisible({
      timeout: 5000,
    })

    // Answer first question
    await page.click("text=Beton")
    await page.waitForTimeout(300)
    await page.click("text=Continuă")
    await page.waitForTimeout(300)

    // Answer second question (door traffic)
    await page.click("text=Trafic redus")
    await page.waitForTimeout(300)
    await page.click("text=Continuă")
    await page.waitForTimeout(300)

    // Answer third question (acoustic need)
    await page.click("text=Delimitare vizuală")
    await page.waitForTimeout(300)
    await page.click("text=Finalizează decizia")
    await page.waitForTimeout(1000)

    // Should be back on home with Decision Memory updated
    await page.goto(PREVIEW, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(2000)

    // Verify Decision Memory section exists
    await expect(page.locator("text=Decision Memory")).toBeVisible({
      timeout: 5000,
    })

    // Refresh — experience persists
    await page.reload({ waitUntil: "domcontentloaded" })
    await page.waitForTimeout(3000)
    await expect(page.locator("text=Ce proiectezi?")).toBeVisible({
      timeout: 8000,
    })

    console.log("✅ DecisionWorkspace + persist + reload OK")
  })

  test("logout → login preserves Decision Maker experience", async ({
    page,
  }) => {
    await captureAnonKey(page)
    await page.goto(PREVIEW, { waitUntil: "domcontentloaded" })

    // Login
    await page.fill('input[type="email"]', DECISION_MAKER_CREDS.email)
    await page.fill('input[type="password"]', DECISION_MAKER_CREDS.password)
    await page.click('button:has-text("Conectează-te")')
    await page.waitForTimeout(4000)

    // Confirm DecisionMakerHome
    await expect(page.locator("text=Ce proiectezi?")).toBeVisible({
      timeout: 8000,
    })

    // Logout
    await page.click("text=Logout")
    await page.waitForTimeout(1500)

    // Login again
    await page.fill('input[type="email"]', DECISION_MAKER_CREDS.email)
    await page.fill('input[type="password"]', DECISION_MAKER_CREDS.password)
    await page.click('button:has-text("Conectează-te")')
    await page.waitForTimeout(4000)

    // Still DecisionMakerHome
    await expect(page.locator("text=Ce proiectezi?")).toBeVisible({
      timeout: 8000,
    })

    console.log("✅ Logout → login preserves experience")
  })
})

// ══════════════════════════════════════════════
// Scenariul 2: Buyer
// ══════════════════════════════════════════════
test.describe("Buyer Experience", () => {
  test("renders BuyerHome with Projects, Quotes, Orders", async ({ page }) => {
    await captureAnonKey(page)
    await page.goto(PREVIEW, { waitUntil: "domcontentloaded" })

    // Login
    await page.fill('input[type="email"]', BUYER_CREDS.email)
    await page.fill('input[type="password"]', BUYER_CREDS.password)
    await page.click('button:has-text("Conectează-te")')

    // Should show BuyerHome
    await expect(page.locator("text=Proiecte recente")).toBeVisible({
      timeout: 10000,
    })
    await expect(page.locator("text=Configurează")).toBeVisible()

    // Should NOT show Decision Maker elements
    await expect(page.locator("text=Decision Tools")).not.toBeVisible()

    console.log("✅ BuyerHome OK")
  })

  test("buyer cannot see Decision Maker data", async ({ page }) => {
    await captureAnonKey(page)
    await page.goto(PREVIEW, { waitUntil: "domcontentloaded" })

    // Login as buyer
    await page.fill('input[type="email"]', BUYER_CREDS.email)
    await page.fill('input[type="password"]', BUYER_CREDS.password)
    await page.click('button:has-text("Conectează-te")')
    await page.waitForTimeout(4000)

    // No Decision Memory visible
    await expect(page.locator("text=Decision Memory")).not.toBeVisible()
    await expect(page.locator("text=Ce proiectezi?")).not.toBeVisible()

    console.log("✅ Buyer isolation OK")
  })
})

// ══════════════════════════════════════════════
// Scenariul 3: Fără profil
// ══════════════════════════════════════════════
test.describe("No Profile", () => {
  test("shows needs_onboarding, no silent fallback to buyer", async ({
    page,
  }) => {
    await captureAnonKey(page)
    await page.goto(PREVIEW, { waitUntil: "domcontentloaded" })

    // Login as no-profile user
    await page.fill('input[type="email"]', NO_PROFILE_CREDS.email)
    await page.fill('input[type="password"]', NO_PROFILE_CREDS.password)
    await page.click('button:has-text("Conectează-te")')
    await page.waitForTimeout(5000)

    // Should show onboarding/error, NOT buyer
    await expect(page.locator("text=Contul tău nu este configurat")).toBeVisible({
      timeout: 8000,
    })

    // Should NOT fallback to buyer
    await expect(page.locator("text=Proiecte recente")).not.toBeVisible()
    await expect(page.locator("text=Ce proiectezi?")).not.toBeVisible()

    console.log("✅ No-profile → needs_onboarding OK")
  })
})
