// ══════════════════════════════════════════════
// GLAZEO — Runtime Test Auth Gateway (isolated local verification)
// NU se folosește în producție. Selectat doar la build --mode runtime-test.
// Scenariul e controlat din URL: ?scenario=missing-success | missing-fail | altele
// ══════════════════════════════════════════════
import type { AuthGateway, AuthUser } from "./types"

export const RUNTIME_USER: AuthUser = {
  id: "rt-user",
  email: "rt@glass.associates",
}

function scenario(): string {
  if (typeof window === "undefined") return ""
  return new URLSearchParams(window.location.search).get("scenario") ?? ""
}

class RuntimeScenarioAuthGateway implements AuthGateway {
  async getCurrentUser(): Promise<AuthUser | null> {
    return RUNTIME_USER
  }

  async signUp(_email: string, _password: string): Promise<AuthUser> {
    return RUNTIME_USER
  }

  async signIn(_email: string, _password: string): Promise<AuthUser> {
    return RUNTIME_USER
  }

  async signOut(): Promise<void> {
    // no-op
  }

  async registerAccount(_userId: string, _email: string): Promise<{ defaultExperience: string | null } | null> {
    const s = scenario()
    if (s === "missing-fail") throw new Error("RPC failure (runtime test)")
    if (s === "missing-success") return { defaultExperience: "decision_maker" }
    return null
  }
}

export const authGateway = new RuntimeScenarioAuthGateway()
