# ADR-001: Experience Resolution

> **Status:** Proposed (v2 — revised 2026-07-24)
> **Date:** 2026-07-24
> **Author:** Cornel Lezeu + Hermes (Glass Associates Operations)
> **Scope:** GLAZEO Platform — auth, routing, RBAC

---

## Context

GLAZEO definește patru experiențe distincte (Decision Maker, Buyer, Builder, Admin), fiecare cu propriul homepage, navigație, limbaj și permisiuni. În prezent, toți utilizatorii autentificați primesc aceeași experiență: `BuyerHome`. Nu există niciun mecanism care să determine ce experiență i se cuvine unui utilizator.

Acest ADR definește modul în care platforma determină experiența — numit **Experience Resolution** — ca frontieră arhitecturală. Nu este o simplă funcție utilitară; este punctul de intrare pentru auth, onboarding, routing și RLS.

---

## Decision

### 1. Cele patru straturi și responsabilitatea fiecăruia

| Strat | Componentă | Responsabilitate |
|---|---|---|
| **Identity** | `AuthGateway` + `AuthUser` (`auth/types.ts`) | Cine e utilizatorul? (`id`, `email`). **Nu** ce rol are. |
| **Experience Profile** | `ExperienceGateway` (nou) | Ce experiențe sunt disponibile pentru acest utilizator? Încarcă `ExperienceProfile` din auth claims sau user_roles. |
| **Experience Resolution** | `resolveExperience(profile, context)` | Care experiență se aplică acum? Funcție pură, sincronă, testabilă. |
| **Authorization** | Supabase RLS (politici per rol) | Ce date poate accesa? **Rămâne autoritatea absolută.** |

**Regulă constituțională:** Routingul UI nu acordă permisiuni. Supabase/RLS este singura autoritate pentru accesul la date. Până când politicile RLS sunt auditate per rol, ADR-ul nu pretinde că RLS protejează deja toate cele patru experiențe — `is_org_member()` verifică apartenența, nu rolul.

**Comportament la acces neautorizat:** Dacă un utilizator forțează un URL de Decision Maker fără a avea experiența corespunzătoare, nu primește un shell gol. Routerul afișează o stare explicită: **"Access Denied — this experience is not available for your account"** cu opțiunea de a reveni la experiența validă.

### 2. Tipurile și semnăturile exacte

#### ExperienceType

```typescript
type ExperienceType = "decision_maker" | "buyer" | "builder" | "admin"
```

Separat de `BuyerLevel` (`"public"` | `"verified"` | `"contracted"`), care există **doar** în interiorul experienței `"buyer"`.

#### ExperienceProfile (nou, separat de AuthUser)

```typescript
interface ExperienceProfile {
  /** Toate experiențele disponibile pentru acest utilizator (cross-org). */
  availableExperiences: ExperienceType[]

  /** Experiența implicită sugerată de sistem. */
  defaultExperience: ExperienceType

  /** Ultima experiență activă (persisted per user, cross-session). */
  lastActiveExperience: ExperienceType | null

  /** Per organizație: experiențele disponibile în fiecare org. */
  organizationRoles: Record<string, ExperienceType[]>
}
```

`AuthUser` rămâne neschimbat: `{ id: string; email: string | null }`. Rolul nu aparține identității — aparține profilului de experiență.

#### ExperienceResolution (discriminated union)

```typescript
type ExperienceResolution =
  | { status: "unauthenticated" }
  | { status: "needs_onboarding"; reason: string }
  | { status: "needs_selection"; available: ExperienceType[] }
  | { status: "resolved"; experience: ExperienceType }
```

**Zero fallback silențios.** Un utilizator neautentificat produce `"unauthenticated"`, nu `"buyer"`. Un utilizator fără experiență disponibilă produce `"needs_onboarding"`. Mai multe experiențe fără selecție produc `"needs_selection"`.

#### Rezoluția în contextul curent

```typescript
interface ExperienceContext {
  /** Experiența solicitată explicit (query param, session storage). */
  requestedExperience?: ExperienceType

  /** ID-ul organizației active (dacă există). */
  activeOrganizationId?: string
}

function resolveExperience(
  profile: ExperienceProfile,
  context: ExperienceContext
): ExperienceResolution
```

**Ce NU are:** Parametru `overrides`. Nu există portiță pentru codul de producție să ceară `"admin"`. E2E-ul injectează un `ExperienceGateway` mock la composition root, nu un override în resolver.

### 3. Sursa și încărcarea ExperienceProfile

| Fază | Sursă | Mecanism |
|---|---|---|
| **Acum (mock)** | `MockExperienceGateway` | Returnează profil static. Default: `availableExperiences: ["buyer"]`. |
| **Phase 2 (auth claims)** | JWT `app_metadata.experiences` | Populat de SupabaseAuthGateway din claims. |
| **Phase 3 (multi-org)** | `organization_roles` table | Un utilizator poate avea roluri diferite per organizație. `organizationRoles` din profil se populează din această tabelă. |

**Principiu:** `resolveExperience()` nu face I/O. Nu citește din Supabase. Nu apelează `auth.getCurrentUser()`. Primește datele deja încărcate de `ExperienceGateway`, similar cu modul în care `App` primește `AuthGateway` prin DI.

### 4. Diferența obligatorie dintre `ExperienceType` și `BuyerLevel`

| Concept | Ce reprezintă | Exemple | Unde se aplică |
|---|---|---|---|
| **ExperienceType** | Rolul profesional al utilizatorului în platformă | `decision_maker`, `buyer`, `builder`, `admin` | Routing, homepage, navigație, limbaj, permisiuni RLS |
| **BuyerLevel** | Tierul comercial al unui Buyer | `public`, `verified`, `contracted` | Prețuri, discounturi, oferte automate |

**Relația:** `BuyerLevel` există **doar** în interiorul experienței `"buyer"`. Un Decision Maker nu are `BuyerLevel`. Un Admin nu are `BuyerLevel`. Sunt concepte ortogonale: unul determină **ce fel de muncă** face utilizatorul, celălalt determină **ce preț vede** când cumpără.

### 5. Ordinea de precedență când un utilizator are mai multe roluri

Un utilizator poate fi simultan Decision Maker și Buyer. Precedența:

1. **Experiența solicitată explicit** — utilizatorul a selectat "Intră ca Arhitect" în selectorul de experiență → validată contra `availableExperiences`. Dacă nu e disponibilă → `"needs_selection"`.

2. **Ultima experiență activă validă** — `lastActiveExperience` persistată cross-session. Dacă experiența respectivă mai e în `availableExperiences`, se reia.

3. **Singura experiență disponibilă** — dacă `availableExperiences.length === 1`, se rezolvă automat.

4. **`needs_selection`** — utilizatorul trebuie să aleagă. Nu se face fallback automat.

**Ce NU se întâmplă:** Admin nu câștigă automat. Admin este o capabilitate, nu neapărat munca implicită. Un utilizator care este și Admin și Buyer va vedea `"needs_selection"` dacă nu a ales explicit.

Pentru MVP (Phase 1): `availableExperiences` conține exact un element → regula 3 se aplică → `"resolved"`. Nu apare `"needs_selection"` decât când introducem al doilea rol.

### 6. Comportamentul pentru conturile fără profil

Toate conturile create înainte de implementarea Experience Resolution nu au `ExperienceProfile`.

**Regulă:** Un utilizator autentificat fără profil produce `"needs_onboarding"`, nu `"buyer"`.

Routerul afișează un ecran de onboarding: "Your account needs to be configured. Contact Glass Associates to set up your experience."

**Fallback de compatibilitate legacy:** Pentru faza de tranziție (primele zile după deploy), `MockExperienceGateway` returnează `availableExperiences: ["buyer"]` pentru TOATE conturile. Acesta este un **comportament explicit al gateway-ului mock**, nu al resolver-ului. Când trecem la Phase 2 (auth claims reale), conturile fără claims vor primi `"needs_onboarding"`, forțând migrarea.

### 7. Regula: routingul UI nu acordă permisiuni

```
ExperienceGateway       → încarcă ExperienceProfile (ce experiențe sunt disponibile?)
resolveExperience()      → decide experiența curentă (funcție pură)
App.tsx                  → randează componenta corectă (routing UI)
Supabase RLS             → autorizează accesul la date (singura autoritate)
```

**Ce înseamnă în practică:**

- Un utilizator cu `experience = "buyer"` nu poate accesa datele Decision Maker — RLS refuză query-urile.
- Un utilizator cu `experience = "decision_maker"` care forțează URL-ul de Buyer primește `Access Denied`, nu un shell gol.
- **Nicio permisiune nu e codată în `if (experience === "admin")` în componentele de UI.**

**Limitare curentă:** `is_org_member()` verifică apartenența la organizație, nu rolul. Un audit RLS per experiență este necesar înainte de Phase 2 pentru a confirma că politicile protejează corect fiecare rol. ADR-ul nu pretinde contrariul.

### 8. Cum primește MockExperienceGateway date deterministe pentru E2E

Patternul urmează `MockAuthGateway`: dependency injection la composition root.

```typescript
// src/auth/types.ts — neschimbat
interface AuthUser { id: string; email: string | null }

// src/experience/types.ts — NOU
interface ExperienceGateway {
  getProfile(user: AuthUser): Promise<ExperienceProfile>
}

// src/experience/MockExperienceGateway.ts — NOU
class MockExperienceGateway implements ExperienceGateway {
  constructor(private profile: ExperienceProfile) {}

  async getProfile(_user: AuthUser): Promise<ExperienceProfile> {
    return this.profile
  }
}

// src/experience/buyerProfile.ts — pentru E2E-urile Buyer existente
export const BUYER_PROFILE: ExperienceProfile = {
  availableExperiences: ["buyer"],
  defaultExperience: "buyer",
  lastActiveExperience: "buyer",
  organizationRoles: {}
}

// src/experience/decisionMakerProfile.ts — pentru E2E-urile Decision Maker
export const DECISION_MAKER_PROFILE: ExperienceProfile = {
  availableExperiences: ["decision_maker"],
  defaultExperience: "decision_maker",
  lastActiveExperience: null,
  organizationRoles: {}
}
```

**Composition root în teste:**

```typescript
// E2E Buyer (rămâne neschimbat)
const buyerGateway = new MockExperienceGateway(BUYER_PROFILE)

// E2E Decision Maker (nou, suită separată)
const dmGateway = new MockExperienceGateway(DECISION_MAKER_PROFILE)
```

Nicio modificare la `resolveExperience()`. Niciun parametru `overrides`. Gateway-ul mock injectează datele, resolver-ul le procesează.

### 9. Pașii de implementare, testele și rollback-ul

| Pas | Ce se implementează | Teste | Rollback |
|---|---|---|---|
| **1** | `ExperienceType` + `ExperienceProfile` + `ExperienceResolution` (tipuri, fără funcții) | Unit: type assertions (verifică că tipurile compilează) | Ștergi fișierele de tipuri. Zero impact. |
| **2** | `resolveExperience()` — funcție pură + unit tests | Unit: 8-10 cazuri (unauthenticated, needs_onboarding, needs_selection, resolved, precedence rules) | Ștergi funcția și testele. |
| **3** | `ExperienceGateway` interface + `MockExperienceGateway` (default: BUYER_PROFILE) | Unit: gateway returns expected profile | Ștergi gateway-ul. |
| **4** | `App.tsx`: routing per `ExperienceResolution` (doar branch-ul `"resolved"` cu `"buyer"`; restul → placeholder) | E2E: 10/10 Buyer trebuie să rămână neschimbate | Reverși `App.tsx` la routingul curent. |
| **5** | `DecisionMakerHome` — shell + "Ce proiectezi?" | Unit: component renders. E2E: navigation test separat cu `DECISION_MAKER_PROFILE`. | Ștergi folderul `src/features/decision-maker/`. |
| **6** | `DecisionWorkspace` — Context → Opțiuni → Comparație → Decision Record (date DM-001) | Unit: state machine tests. E2E: vertical slice complet. | Ștergi `DecisionWorkspace.tsx`. |

După Pasul 4, un utilizator autentificat cu `BUYER_PROFILE` vede exact aceeași experiență ca înainte. După Pasul 5, un test E2E separat cu `DECISION_MAKER_PROFILE` vede noua experiență. Cele două nu se intersectează.

---

## Consequences

### Pozitive
- Separă identitatea (`AuthUser`) de profilul de experiență (`ExperienceProfile`) — evoluează independent
- `resolveExperience()` este funcție pură, fără I/O, fără overrides, testabilă izolat
- Discriminated union forțează tratarea explicită a fiecărui caz în router
- E2E-urile Buyer existente nu sunt atinse
- Patternul de DI (Gateway → Resolver → Router) este identic cu `AuthGateway`, păstrând coerența arhitecturală

### Negative
- Adaugă un strat de indirecție în `App.tsx` și un gateway nou (`ExperienceGateway`)
- Până la Phase 2, toți utilizatorii rămân pe `"buyer"` — dar asta e realitatea curentă, nu o regresie
- `"needs_onboarding"` și `"needs_selection"` necesită ecrane UI care nu există încă (placeholdere în Pasul 4)

### Riscuri
- Dacă `BUYER_PROFILE` din mock nu e înlocuit cu profiluri reale la Phase 2, toate conturile rămân permanent Buyer
- `is_org_member()` nu verifică rolul — un audit RLS per experiență e necesar înainte de a expune Datele Decision Maker prin API
- Confuzia `ExperienceType` vs `BuyerLevel` poate reapărea dacă cineva le unifică într-un singur câmp

---

## Related
- `GLAZEO Platform Architecture v1.0.md` — Constitutional Principles P1-P10
- `GLAZEO Role-Based Experience v1.0.md` — Cele 4 experiențe
- `GLAZEO Domain Model v1.0.md` — Permissions matrix
- `src/auth/types.ts` — `AuthUser`, `AuthGateway`
- `src/auth/MockAuthGateway.ts` — `E2E_USER`
