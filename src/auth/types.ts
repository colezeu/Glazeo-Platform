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
  registerAccount(userId: string, email: string): Promise<void>
}
