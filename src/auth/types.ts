// ══════════════════════════════════════════════
// GLAZEO — Auth Gateway Interface
// Zero dependencies. Types only.
// ══════════════════════════════════════════════

export type AuthUser = {
  id: string
  email: string | null
}

export interface AuthGateway {
  getCurrentUser(): Promise<AuthUser | null>
  signUp(email: string, password: string): Promise<AuthUser>
  signIn(email: string, password: string): Promise<AuthUser>
  signOut(): Promise<void>
  /** Inițializează contul; returnează experiența implicită din răspunsul RPC (null dacă RPC nu returnează profil). */
  registerAccount(userId: string, email: string): Promise<{ defaultExperience: string | null } | null>
}
