// ══════════════════════════════════════════════
// GLAZEO — Supabase Auth Gateway
// Production implementation. Wraps supabase.ts.
// Fail-fast at import if env vars are missing.
// ══════════════════════════════════════════════
import type { AuthGateway, AuthUser } from "./types"
import { supabase } from "../app/supabase"
import type { User } from "@supabase/supabase-js"

function toAuthUser(user: User): AuthUser {
  return { id: user.id, email: user.email ?? null }
}

class SupabaseAuthGateway implements AuthGateway {
  async getCurrentUser(): Promise<AuthUser | null> {
    const { data } = await supabase.auth.getUser()
    return data.user ? toAuthUser(data.user) : null
  }

  async signUp(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (!data.user) throw new Error("Signup succeeded but no user returned")
    return toAuthUser(data.user)
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return toAuthUser(data.user)
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut()
  }

  async registerAccount(userId: string, email: string): Promise<void> {
    const { error } = await supabase.rpc("rpc_initialize_account", {
      p_user_id: userId,
      p_email: email,
      p_full_name: email.split("@")[0],
    })
    if (error) throw error
  }
}

export const authGateway = new SupabaseAuthGateway()
