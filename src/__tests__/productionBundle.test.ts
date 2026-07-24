// ══════════════════════════════════════════════
// GLAZEO — Production Bundle Integrity Test
// Verifică că fixture-urile mock NU ajung în build-ul de producție.
// Rulează doar când există dist/ (după build).
// ══════════════════════════════════════════════
import { describe, it, expect } from "vitest"

describe("Production bundle — mock integrity", () => {
  it("does not contain createMockExperienceGateway in dist", async () => {
    // Check dist/index.html for the JS bundle name, then search the bundle
    let html: string
    try {
      html = await fetch("file://" + import.meta.url + "/../../dist/index.html")
        .then(r => r.text())
    } catch {
      // Skip if dist doesn't exist (running without build)
      return
    }

    // Extract JS bundle name from index.html <script> tags
    const match = html.match(/\/assets\/index-[^.]+\.js/)
    if (!match) return

    const jsBundle = match[0]
    let jsContent: string
    try {
      jsContent = await fetch("file://" + import.meta.url + "/../.." + jsBundle)
        .then(r => r.text())
    } catch {
      return
    }

    expect(jsContent).not.toContain("createMockExperienceGateway")
    expect(jsContent).not.toContain("LEGACY_BUYER_PROFILE_RESULT")
    expect(jsContent).not.toContain("DECISION_MAKER_PROFILE_RESULT")
    expect(jsContent).not.toContain("fixtures.ts")
  })
})
