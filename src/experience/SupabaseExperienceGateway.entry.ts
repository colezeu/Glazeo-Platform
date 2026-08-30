// ══════════════════════════════════════════════
// GLAZEO — Experience Gateway Entry (Production)
// SupabaseExperienceGateway — interoghează public.profiles.
// ══════════════════════════════════════════════
import { createSupabaseExperienceGateway } from "./SupabaseExperienceGateway"
import { supabase } from "../app/supabase"

export const experienceGateway = createSupabaseExperienceGateway(supabase)
