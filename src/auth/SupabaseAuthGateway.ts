// ══════════════════════════════════════════════
// GLAZEO — Supabase Auth Gateway
// Production implementation. Wraps supabase.ts.
// Fail-fast at import if env vars are missing.
// ══════════════════════════════════════════════
import type { AuthGateway, AuthUser } from "./types"
import { supabase } from "../app/supabase"
import type { User, SupabaseClient } from "@supabase/supabase-js"

function toAuthUser(user: User): AuthUser {
  return { id: user.id, email: user.email ?? null }
}

export class SupabaseAuthGateway implements AuthGateway {
  private readonly client: SupabaseClient

  constructor(client: SupabaseClient = supabase) {
    this.client = client
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const { data } = await this.client.auth.getUser()
    return data.user ? toAuthUser(data.user) : null
  }

  async signUp(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await this.client.auth.signUp({ email, password })
    if (error) throw error
    if (!data.user) throw new Error("Signup succeeded but no user returned")
    return toAuthUser(data.user)
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password })
    if (error) throw error
    return toAuthUser(data.user)
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut()
  }

  async registerAccount(userId: string, email: string): Promise<{ defaultExperience: string | null } | null> {
    const { data, error } = await this.client.rpc("rpc_initialize_account", {
      p_user_id: userId,
      p_email: email,
      p_full_name: email.split("@")[0],
    })
    if (error) throw error
    // RPC returnează JSON minim: { default_experience }. null/malformed → null (onboarding retryable, NU Buyer).
    if (!data) return null
    const row = data as { default_experience?: string | null }
    return { defaultExperience: row.default_experience ?? null }
  }
}

export const authGateway = new SupabaseAuthGateway()
