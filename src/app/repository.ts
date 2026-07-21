// ══════════════════════════════════════════════
// GLAZEO — Repository Interface
// Separă UI de sursa de date. Azi: mock. Mâine: Supabase.
// ══════════════════════════════════════════════

import type { ProjectState } from "../features/buyer/projectState";

// ── Repository Interface ────────────────────────────
// Orice implementare trebuie să respecte acest contract.
// Componentele din features/ nu știu dacă datele vin din
// mock, Supabase sau API — ele consumă doar această interfață.

export interface ProjectRepository {
  /** Încarcă starea inițială a unui proiect */
  getProject(projectId: string): Promise<ProjectState>;

  /** Salvează starea completă a proiectului (după fiecare acțiune) */
  saveProject(state: ProjectState): Promise<void>;

  /** Listează proiectele unui utilizator (sumar) */
  listProjects(userId: string): Promise<ProjectSummary[]>;
}

export type ProjectSummary = {
  id: string;
  name: string;
  productType: string;
  status: string;
  progress: number;
  nextStep: string;
};

// ── Mock Repository (Gate 1-2) ──────────────────────
// Folosește date hardcodate + păstrează starea în memorie

let memoryStore: Record<string, ProjectState> = {};

export class MockProjectRepository implements ProjectRepository {
  async getProject(projectId: string): Promise<ProjectState> {
    // Return stored state or initial mock
    if (memoryStore[projectId]) {
      return { ...memoryStore[projectId] };
    }
    // Dynamic import to avoid circular deps
    const { createInitialState } = await import("../features/buyer/projectState");
    const state = createInitialState();
    memoryStore[projectId] = state;
    return state;
  }

  async saveProject(state: ProjectState): Promise<void> {
    memoryStore[state.id] = { ...state };
  }

  async listProjects(): Promise<ProjectSummary[]> {
    // Mock — va fi înlocuit cu query Supabase
    return [
      { id: "p1", name: "Vila Popescu", productType: "Balustrade + Cabine Duș", status: "active", progress: 65, nextStep: "Generate Quote" },
      { id: "p2", name: "Office Building Cluj", productType: "Partiționări sticlă", status: "active", progress: 45, nextStep: "Waiting for Approval" },
      { id: "p3", name: "Hotel Budapest", productType: "Copertină + Balustrade", status: "draft", progress: 20, nextStep: "Select Hardware" },
    ];
  }
}

// ── Supabase Repository (Gate 3+) — TODO ─────────────
// Va implementa aceeași interfață ProjectRepository,
// dar cu apeluri reale către Supabase:
//
// export class SupabaseProjectRepository implements ProjectRepository {
//   constructor(private supabase: SupabaseClient) {}
//   async getProject(id: string): Promise<ProjectState> { ... }
//   async saveProject(state: ProjectState): Promise<void> { ... }
//   async listProjects(userId: string): Promise<ProjectSummary[]> { ... }
// }

// ── Singleton (temporar, va fi înlocuit cu DI/context) ──
let instance: ProjectRepository;

export function getProjectRepository(): ProjectRepository {
  if (!instance) {
    instance = new MockProjectRepository();
  }
  return instance;
}

export function setProjectRepository(repo: ProjectRepository): void {
  instance = repo;
}
