# GLAZEO Platform

Platformă Role-Based Experience pentru industria sticlei arhitecturale. Construită de [Glass Associates](https://glass.associates).

## Arhitectură

```
main.tsx → App Shell
  ├─ Experience Resolution (Phase 1)
  │   └─ resolveExperience() — funcție pură, testabilă
  ├─ AuthGateway (Supabase — Production / Mock — E2E)
  └─ Role Routing
      ├─ decision_maker → DecisionMakerHome → DecisionWorkspace
      ├─ buyer          → BuyerHome → ProjectWorkspace
      ├─ builder        → (în construcție)
      └─ admin          → (în construcție)
```

## Decision Models (DM)

| Model | Domeniu | Fișier |
|---|---|---|
| DM-001 | Compartimentare sală ședințe | `dm001/` |
| DM-002 | Balustradă sticlă | `dm002/` |
| DM-003 | Fațadă — strategie vitrare | `dm003/` |
| DM-004 | Cabină duș walk-in | `dm004/` |

Fiecare DM conține: `Data` (tipuri + contexte), `Definition` (întrebări + opțiuni + criterii), `Engine` (logică pură de evaluare).

Arhitectura completă: `docs/architecture-review-v1.md`

## Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Backend:** Supabase (Auth, RLS, PostgreSQL)
- **Testing:** Vitest (unit) + Playwright (E2E)
- **CI/CD:** GitHub Actions + Vercel
- **Persistență:** Decision Records → JSONB, RLS-enforced per user

## Experiențe

### Decision Maker (arhitect/designer)

Homepage cu Decision Tools orientate pe context ("Ce proiectezi?"), nu pe listă de produse. Decision Workspace cu engine de recomandări per model. Decision Memory — istoricul deciziilor persistat.

### Buyer (client)

Workspace cu Projects, Quotes, Orders. Configuratoare per produs. Role-based pricing (public/verified/contracted).

## Development

```bash
npm install
npm run dev          # Dev server
npm run typecheck    # TypeScript
npm run test:unit    # Vitest (70 de teste)
npm run test:e2e     # Playwright Buyer E2E
npm run test:e2e:dm  # Playwright Decision Maker E2E
npm run build        # Production build
```

## Environment

Copiază `.env.example` → `.env`:

```
VITE_SUPABASE_URL=https://vxtpkbckdvrmgudvkqwx.supabase.co
VITE_SUPABASE_ANON_KEY=<din Supabase dashboard>
```

## Docs

- `docs/architecture-review-v1.md` — arhitectură completă, inventar modele
- `docs/adr/001-experience-resolution.md` — ADR: Experience Resolution
- `docs/dm-00X-contract.md` — contract per Decision Model
- `docs/supabase/001-decision-records.sql` — schema + RLS
