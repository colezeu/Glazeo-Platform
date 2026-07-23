// ══════════════════════════════════════════════
// GLAZEO — Mock Auth Gateway (E2E only)
// Deterministic user. Zero network calls.
// Selected via vite build --mode e2e (alias swap).
// ══════════════════════════════════════════════
import type { AuthGateway, AuthUser } from "./types"

export const E2E_USER: AuthUser = {
  id: "e2e-user",
  email: "demo@glazeo.app",
}

class MockAuthGateway implements AuthGateway {
  async getCurrentUser(): Promise<AuthUser | null> {
    return E2E_USER
  }

  async signUp(_email: string, _password: string): Promise<AuthUser> {
    return E2E_USER
  }

  async signIn(_email: string, _password: string): Promise<AuthUser> {
    return E2E_USER
  }

  async signOut(): Promise<void> {
    // no-op
  }

  async registerAccount(_userId: string, _email: string): Promise<void> {
    // no-op — mock doesn't touch Supabase
  }
}

export const authGateway = new MockAuthGateway()
