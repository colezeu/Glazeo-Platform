# DM-002 Contract: Balustradă din sticlă

> **Status:** Contract for implementation
> **ID intern:** `glass_balustrade`

---

## 1. Intenție

**Denumire UI:** „Balustradă din sticlă"

**Întrebarea inițială:**
> „Ai nevoie de o balustradă din sticlă pentru un proiect?"

**Context necesar (Layer 2 — Diagnostic Questions):**

| # | Întrebare | De ce contează | Tip răspuns |
|---|---|---|---|
| Q1 | „Interior sau exterior?" | Determină cerințele de wind load, dilatație termică și coroziune | Alegere: „Interior" / „Exterior" |
| Q2 | „Care este înălțimea față de sol?" | Normativ: peste 1m înălțime de cădere → laminat obligatoriu. Peste 3m → cerințe suplimentare de prindere. | Alegere: „Sub 1m (parapet jos)" / „1-3m (balcon)" / „Peste 3m (terase înalte)" |
| Q3 | „Pe ce tip de suprafață se montează?" | Determină sistemul de prindere și toleranțele | Alegere: „Beton / planșeu" / „Structură metalică" / „Lemn / compozit" / „Necunoscut" |
| Q4 | „Este obligatorie mâna curentă?" | Poate fi integrată în sistem (profil superior) sau adăugată separat. | Alegere: „Da, obligatorie" / „Nu, opțională" / „Da, dar vreau integrată în profil" |

**Problemă reală (nu cea declarată):**
Arhitecții intră cu „balustradă transparentă, fără profil." Problema reală este adesea **siguranța fără compromis estetic** — balustrada trebuie să oprească o cădere, să reziste la vânt și să fie aproape invizibilă, simultan.

---

## 2. Cele trei opțiuni

### Opțiunea A — Frameless cu puncte de fixare (minimal)

| Atribut | Valoare |
|---|---|
| **Nume** | „Frameless — sticlă aparent liberă, puncte discrete" |
| **Descriere** | Panouri de sticlă securizată (laminat unde normativul o cere) fixate prin puncte de prindere din inox. Fără profil inferior continuu. Mână curentă separată (dacă e obligatorie). |
| **Avantaje** | Transparență maximă. Fără profil vizibil. Aspect "plutitor". Ideal pentru terase cu vedere. |
| **Limite** | Necesită suprafață de montaj perfect plană. Punctele de prindere concentrează tensiunea. Dilatația termică la exterior poate cauza fisuri. |
| **Cel mai potrivit când** | Interior, înălțime sub 3m, suprafață beton. Prioritatea #1 este estetica. |
| **Compromisuri** | La exterior: wind load mare poate necesita sticlă mai groasă → cost suplimentar. Denivelări ale suprafeței → compensare dificilă. |

### Opțiunea B — Profil U continuu (robust)

| Atribut | Valoare |
|---|---|
| **Nume** | „Profil U — bază continuă, sticlă încastrată" |
| **Descriere** | Profil aluminiu în formă de U montat continuu pe suprafață. Sticla este încastrată în profil pe toată lungimea. Compatibil cu mână curentă integrată. |
| **Avantaje** | Distribuție uniformă a sarcinii. Iertător cu denivelările. Foarte bun pentru exterior. Compatibil cu mână curentă integrată. |
| **Limite** | Profilul inferior este vizibil (3-5 cm). Mai puțin transparent decât frameless. Look mai "tehnic". |
| **Cel mai potrivit când** | Exterior, înălțimi mari, suprafețe cu denivelări. Siguranța e prioritară. |
| **Compromisuri** | Profilul inferior rupe senzația de "sticlă care plutește". Cost ușor mai mare (material + manoperă). |

### Opțiunea C — Mână curentă structurală (integrat)

| Atribut | Valoare |
|---|---|
| **Nume** | „Mână curentă integrată — profil superior structural" |
| **Descriere** | Profil superior din aluminiu sau inox care servește drept mână curentă ȘI element structural. Panourile de sticlă sunt prinse între profilul inferior și cel superior. |
| **Avantaje** | Mâna curentă obligatorie e integrată elegant. Structură foarte rigidă. Bun pentru trafic intens (spații publice). |
| **Limite** | Profilul superior e vizibil (4-6 cm). Mai puțin potrivit pentru vederea panoramică. Cost mai mare decât profilul U simplu. |
| **Cel mai potrivit când** | Mâna curentă e obligatorie. Trafic intens (clădiri publice, mall-uri). Vizibilitatea nu e prioritatea #1. |
| **Compromisuri** | Bara superioară blochează parțial vederea. Estetică mai "grea" decât frameless. |

---

## 3. Criterii de comparație

| Criteriu | Opțiunea A | Opțiunea B | Opțiunea C |
|---|---|---|---|
| **Transparență** | ⬤⬤⬤ Maximă | ⬤⬤ Medie | ⬤ Redusă |
| **Siguranță structurală** | ⬤⬤ Bună | ⬤⬤⬤ Foarte bună | ⬤⬤⬤ Maximă |
| **Toleranță denivelări** | ⬤ Redusă | ⬤⬤⬤ Ridicată | ⬤⬤ Moderată |
| **Rezistență la exterior** | ⬤⬤ Moderată | ⬤⬤⬤ Bună | ⬤⬤⬤ Foarte bună |
| **Cost relativ** | ⬤⬤⬤ Ridicat (sticlă groasă) | ⬤⬤ Mediu | ⬤⬤ Mediu |
| **Estetică** | ⬤⬤⬤ Minimalistă | ⬤⬤ Tehnică | ⬤⬤ Industrială |

---

## 4. Reguli de recomandare / respingere

### Opțiunea A — Recomandată când:
- Q1 = „Interior"
- Q2 ≠ „Peste 3m"
- Q3 ≠ „Lemn / compozit"
- **Respinsă când:** Q1 = „Exterior" + Q2 = „Peste 3m" (wind load + dilatație → risc de fisurare) **SAU** Q3 = „Lemn / compozit" (punctele nu ancorează sigur)

### Opțiunea B — Recomandată când:
- Q1 = „Exterior"
- Q2 = „Peste 3m" (profilul distribuie sarcina)
- Q3 = „Lemn / compozit" sau „Necunoscut" (profilul compensează)
- **Respinsă când:** Q4 = „Da, dar vreau integrată în profil" + fără mână curentă (incompatibilitate — profilul U nu are mână curentă integrată; aici merge C)

### Opțiunea C — Recomandată când:
- Q4 = „Da, obligatorie" sau „Da, dar vreau integrată"
- Q2 = „1-3m" sau „Peste 3m"
- **Respinsă când:** Q1 = „Interior" și Q4 = „Nu, opțională" (bara superioară e inutilă vizual)

---

## 5. Structura Decision Record

```typescript
interface DecisionRecord {
  id: string
  decidedAt: string
  intent: {
    type: "glass_balustrade"
    label: "Balustradă din sticlă"
  }
  context: {
    location: "interior" | "exterior"
    heightCategory: "sub_1m" | "1_3m" | "peste_3m"
    surfaceType: "concrete" | "steel" | "wood_composite" | "unknown"
    handrailRequired: "yes_mandatory" | "no_optional" | "yes_integrated"
  }
  options: { ... }[]  // same shape as DM-001
  selectedOptionId: string
  acceptedTradeoffs: { description: string; whyAccepted: string }[]
  lessons: string[]
  nextSteps: string[]
}
```

---

## 6. Ce NU intră

- Preț, ofertă, comandă, configurator tehnic
- Oblio, BIM, CAD
- Supabase, persistență
- Alte intenții
- Selector de rol sau bypass runtime
