// ══════════════════════════════════════════════
// GLAZEO — SupabaseAuthGateway.registerAccount: contract RPC minim (regression)
// Migrarea 006 returnează doar { default_experience } (jsonb minimizat).
// Gateway-ul trebuie să accepte JSON minim, să trateze null/malformed ca
// neinițializat (onboarding retryable) și să propage eroarea RPC (NICIODATĂ Buyer).
// ══════════════════════════════════════════════
import { describe, it, expect, vi } from "vitest"
// supabase.ts face fail-fast la import fără env vars; testele injectează un client fake explicit.
vi.mock("../app/supabase", () => ({ supabase: {} }))
import { SupabaseAuthGateway } from "../auth/SupabaseAuthGateway"

type RpcResult = { data: unknown; error: { message: string } | null }

function fakeClient(rpcImpl: (name: string, args: Record<string, unknown>) => Promise<RpcResult>) {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signUp: async () => ({ data: { user: null }, error: null }),
      signIn: async () => ({ data: { user: null }, error: null }),
      signOut: async () => {},
    },
    rpc: rpcImpl,
  } as unknown as ConstructorParameters<typeof SupabaseAuthGateway>[0]
}

describe("SupabaseAuthGateway.registerAccount — contract RPC minim (006)", () => {
  it("acceptă JSON-ul minimizat { default_experience }", async () => {
    const g = new SupabaseAuthGateway(
      fakeClient(async (name, args) => {
        expect(name).toBe("rpc_initialize_account")
        expect(args).toMatchObject({ p_user_id: "u1", p_email: "a@b.c" })
        return { data: { default_experience: "decision_maker" }, error: null }
      }),
    )
    await expect(g.registerAccount("u1", "a@b.c")).resolves.toEqual({ defaultExperience: "decision_maker" })
  })

  it("data null → null (onboarding rămâne retryable, NU Buyer)", async () => {
    const g = new SupabaseAuthGateway(fakeClient(async () => ({ data: null, error: null })))
    await expect(g.registerAccount("u1", "a@b.c")).resolves.toBeNull()
  })

  it("data malformed {} → defaultExperience null", async () => {
    const g = new SupabaseAuthGateway(fakeClient(async () => ({ data: {}, error: null })))
    await expect(g.registerAccount("u1", "a@b.c")).resolves.toEqual({ defaultExperience: null })
  })

  it("eroare RPC → throw (propagată la onboarding → needs_onboarding, NICIODATĂ BuyerHome)", async () => {
    const g = new SupabaseAuthGateway(fakeClient(async () => ({ data: null, error: { message: "insufficient_privilege" } })))
    await expect(g.registerAccount("u1", "a@b.c")).rejects.toThrow("insufficient_privilege")
  })
})
