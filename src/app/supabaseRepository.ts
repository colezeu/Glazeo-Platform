// ══════════════════════════════════════════════
// GLAZEO — SupabaseProjectRepository v2.0
// All business operations via RPC (server-side)
// ══════════════════════════════════════════════

import { supabase } from "./supabase";
import type { ProjectRepository, ProjectSummary } from "./repository";
import type { ProjectState } from "../features/buyer/projectState";

export class SupabaseProjectRepository implements ProjectRepository {

  // ── Read ──────────────────────────────────────────
  async getProject(projectId: string): Promise<ProjectState> {
    const { data: project, error: projErr } = await supabase
      .from("projects").select("*").eq("id", projectId).single();
    if (projErr || !project) throw new Error("Project not found");

    const [cfgs, qts, ords, acts] = await Promise.all([
      supabase.from("configurations").select("*").eq("project_id", projectId),
      supabase.from("quotes").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
      supabase.from("orders").select("*, order_snapshots(*)").eq("project_id", projectId).order("created_at", { ascending: false }),
      supabase.from("activity_events").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(20),
    ]);

    return {
      id: project.id, name: project.name,
      productType: project.product_type ?? "", status: project.status,
      progress: project.progress ?? 0, address: project.address ?? "",
      participants: [],
      configurations: (cfgs.data ?? []).map(c => ({
        id: c.id, name: c.name, version: c.current_version,
        status: c.status, lastEdited: c.last_edited ?? "", productType: c.product_type,
      })),
      quotes: (qts.data ?? []).map(q => ({
        id: q.id, number: q.number, configId: q.configuration_id,
        configVersion: 0, total: Number(q.total), currency: q.currency,
        status: q.status, validUntil: q.valid_until, createdAt: q.created_at,
      })),
      orders: (ords.data ?? []).map((o: any) => ({
        id: o.id, number: o.number, quoteId: o.quote_id, quoteNumber: "",
        configId: o.configuration_id, configVersion: 0,
        configName: "", total: Number(o.total), currency: o.currency,
        productName: o.product_name, status: o.status,
        estimatedDelivery: o.estimated_delivery, createdAt: o.created_at,
        hasSnapshot: !!o.order_snapshots?.length,
      })),
      activity: (acts.data ?? []).map(a => ({
        id: a.id, date: new Date(a.created_at).toLocaleDateString("ro-RO", { day: "numeric", month: "short" }),
        text: a.text, type: a.type,
      })),
    };
  }

  async saveProject(state: ProjectState): Promise<void> {
    await supabase.from("projects").update({
      status: state.status, progress: state.progress,
    }).eq("id", state.id);
  }

  async listProjects(_userId: string): Promise<ProjectSummary[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data: memberships } = await supabase.from("organization_members").select("organization_id").eq("user_id", user.id);
    if (!memberships?.length) return [];
    const orgIds = memberships.map(m => m.organization_id);
    const { data: projects } = await supabase.from("projects").select("*").in("organization_id", orgIds).order("created_at", { ascending: false });
    return (projects ?? []).map(p => ({
      id: p.id, name: p.name, productType: p.product_type ?? "",
      status: p.status, progress: p.progress ?? 0,
      nextStep: p.status === "draft" ? "Configurează" : "Revizuiește",
    }));
  }

  // ── Business Operations (all RPC-based) ───────────

  async initializeAccount(userId: string, email: string, fullName: string): Promise<void> {
    const { error } = await supabase.rpc("rpc_initialize_account", {
      p_user_id: userId, p_email: email, p_full_name: fullName,
    });
    if (error) throw error;
  }

  async requestQuote(configId: string): Promise<any> {
    const { data, error } = await supabase.rpc("rpc_request_quote", { p_config_id: configId });
    if (error) throw error;
    return data;
  }

  async acceptQuote(quoteId: string): Promise<any> {
    const quote = await supabase.from("quotes").select("*").eq("id", quoteId).single();
    if (!quote.data) throw new Error("Quote not found");

    const q = quote.data;
    const orderNum = `CMD-2026-${String(30 + Math.floor(Math.random() * 100)).padStart(4, "0")}`;
    const cfg = await supabase.from("configurations").select("*").eq("id", q.configuration_id).single();

    const { data, error } = await supabase.rpc("accept_quote_atomic", {
      p_quote_id: quoteId, p_order_number: orderNum,
      p_config_id: q.configuration_id, p_project_id: q.project_id,
      p_product_name: cfg.data?.name ?? "Comandă nouă",
      p_total: q.total, p_currency: q.currency,
      p_config_version_id: q.configuration_version_id,
    });
    if (error) throw error;
    return data;
  }

  async rejectQuote(quoteId: string): Promise<void> {
    const { data: quote } = await supabase.from("quotes").select("*").eq("id", quoteId).single();
    if (!quote || quote.status !== "sent") return;
    await supabase.from("quotes").update({ status: "rejected" }).eq("id", quoteId);
    await supabase.from("activity_events").insert({
      project_id: quote.project_id, type: "quote",
      text: `Ofertă ${quote.number} respinsă`,
    });
  }

  async duplicateConfiguration(configId: string): Promise<any> {
    const { data, error } = await supabase.rpc("rpc_duplicate_configuration", { p_config_id: configId });
    if (error) throw error;
    return data;
  }
}
