// ══════════════════════════════════════════════
// GLAZEO — Decision Record Repository Entry (Production)
// ══════════════════════════════════════════════
import { supabase } from "../app/supabase"
import { SupabaseDecisionRecordRepository } from "./SupabaseDecisionRecordRepository"

export const decisionRecordRepo = new SupabaseDecisionRecordRepository(supabase)
