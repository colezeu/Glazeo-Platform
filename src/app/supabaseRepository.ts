// ══════════════════════════════════════════════
// GLAZEO — SupabaseProjectRepository
// Domain operations over Supabase (not CRUD)
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
      supabase.from("orders").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
      supabase.from("activity_events").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(20),
    ]);

    return {
      id: project.id,
      name: project.name,
      productType: project.product_type ?? "",
      status: project.status,
      progress: project.progress ?? 0,
      address: project.address ?? "",
      participants: [], // loaded separately
      configurations: (cfgs.data ?? []).map(c => ({
        id: c.id, name: c.name, version: c.current_version,
        status: c.status, lastEdited: c.last_edited ?? "", productType: c.product_type,
      })),
      quotes: (qts.data ?? []).map(q => ({
        id: q.id, number: q.number, configId: q.configuration_id,
        configVersion: 0, // loaded from config version
        total: Number(q.total), currency: q.currency,
        status: q.status, validUntil: q.valid_until, createdAt: q.created_at,
      })),
      orders: (ords.data ?? []).map(o => ({
        id: o.id, number: o.number,
        quoteId: o.quote_id, quoteNumber: "",
        configId: o.configuration_id, configVersion: 0,
        configName: "", total: Number(o.total), currency: o.currency,
        productName: o.product_name, status: o.status,
        estimatedDelivery: o.estimated_delivery, createdAt: o.created_at,
      })),
      activity: (acts.data ?? []).map(a => ({
        id: a.id, date: new Date(a.created_at).toLocaleDateString("ro-RO", { day: "numeric", month: "short" }),
        text: a.text, type: a.type,
      })),
    };
  }

  async saveProject(state: ProjectState): Promise<void> {
    await supabase.from("projects").update({
      status: state.status,
      progress: state.progress,
    }).eq("id", state.id);
  }

  async listProjects(_userId: string): Promise<ProjectSummary[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get user's organizations
    const { data: memberships } = await supabase
      .from("organization_members").select("organization_id").eq("user_id", user.id);
    if (!memberships?.length) return [];

    const orgIds = memberships.map(m => m.organization_id);
    const { data: projects } = await supabase
      .from("projects").select("*").in("organization_id", orgIds)
      .order("created_at", { ascending: false });

    return (projects ?? []).map(p => ({
      id: p.id, name: p.name,
      productType: p.product_type ?? "",
      status: p.status, progress: p.progress ?? 0,
      nextStep: p.status === "draft" ? "Configurează" : "Revizuiește",
    }));
  }

  // ── Domain Operations (atomic) ────────────────────

  async requestQuote(configId: string): Promise<void> {
    const { data: cfg } = await supabase.from("configurations").select("*").eq("id", configId).single();
    if (!cfg || cfg.status !== "draft") throw new Error("Config not in draft status");

    // Check for existing sent quote for same config version
    const { data: existing } = await supabase.from("quotes")
      .select("id").eq("configuration_id", configId).eq("status", "sent").limit(1);
    if (existing?.length) throw new Error("Quote already requested for this config version");

    const quoteNum = `OF-2026-${String(40 + Math.floor(Math.random() * 100)).padStart(4, "0")}`;
    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Create config version
    const { data: version } = await supabase.from("configuration_versions").insert({
      configuration_id: configId, version: cfg.current_version,
      config_data: {}, status: "quoted",
    }).select("id").single();

    // Insert quote
    await supabase.from("quotes").insert({
      project_id: cfg.project_id, configuration_id: configId,
      configuration_version_id: version?.id,
      number: quoteNum, total: 2847, currency: "EUR",
      status: "sent", valid_until: validUntil,
    });

    // Update config status
    await supabase.from("configurations").update({ status: "quoted" }).eq("id", configId);

    // Activity
    await supabase.from("activity_events").insert({
      project_id: cfg.project_id, type: "quote",
      text: `Ofertă ${quoteNum} generată din ${cfg.name} v${cfg.current_version}`,
    });
  }

  async acceptQuote(quoteId: string): Promise<void> {
    const { data: quote } = await supabase.from("quotes").select("*").eq("id", quoteId).single();
    if (!quote) throw new Error("Quote not found");
    if (quote.status !== "sent") throw new Error("Quote cannot be accepted — not in 'sent' status");

    // Check for existing order (idempotency)
    const { data: existingOrder } = await supabase.from("orders").select("id").eq("quote_id", quoteId).limit(1);
    if (existingOrder?.length) throw new Error("Order already exists for this quote");

    const cfg = await supabase.from("configurations").select("*").eq("id", quote.configuration_id).single();
    const orderNum = `CMD-2026-${String(30 + Math.floor(Math.random() * 100)).padStart(4, "0")}`;

    // Atomic: all or nothing
    const { error: txErr } = await supabase.rpc("accept_quote_atomic", {
      p_quote_id: quoteId,
      p_order_number: orderNum,
      p_config_id: quote.configuration_id,
      p_project_id: quote.project_id,
      p_product_name: cfg.data?.name ?? "Comandă nouă",
      p_total: quote.total,
      p_currency: quote.currency,
      p_config_version_id: quote.configuration_version_id,
    });

    if (txErr) throw txErr;
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

  async duplicateConfiguration(configId: string): Promise<void> {
    const { data: cfg } = await supabase.from("configurations").select("*").eq("id", configId).single();
    if (!cfg) throw new Error("Config not found");

    const newVersion = cfg.current_version + 1;
    const newName = cfg.name.replace(/ v\d+$/, "") + ` v${newVersion}`;

    const { data: newCfg } = await supabase.from("configurations").insert({
      project_id: cfg.project_id, name: newName,
      product_type: cfg.product_type, status: "draft",
      current_version: newVersion, last_edited: "chiar acum",
    }).select("id").single();

    if (newCfg) {
      await supabase.from("configuration_versions").insert({
        configuration_id: newCfg.id, version: newVersion,
        config_data: {}, status: "draft",
      });
    }

    await supabase.from("activity_events").insert({
      project_id: cfg.project_id, type: "config",
      text: `Configurație nouă ${newName} creată (v${newVersion})`,
    });
  }
}
