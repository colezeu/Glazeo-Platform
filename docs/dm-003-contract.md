# DM-003 Contract: Fațadă — Strategie de vitrare

> **Status:** Contract for implementation
> **ID intern:** `facade_glazing_strategy`
> **Obiectiv:** Test de falsificare — poate arhitectura reprezenta o decizie cu variabile de performanță, praguri și incompatibilități?

---

## 1. Intenție

**Denumire UI:** „Fațadă — strategie de vitrare"

**Întrebarea inițială:**
> „Ce tip de vitraj se potrivește fațadei proiectului tău?"

**Context necesar (Layer 2 — Diagnostic Questions):**

| # | Întrebare | De ce contează | Tip răspuns |
|---|---|---|---|
| Q1 | „Care este orientarea principală a fațadei?" | Determină încărcarea solară și necesarul de control termic | Sud (cald, soare direct) / Est-Vest (moderat) / Nord (rece, puțin soare) |
| Q2 | „Care este suprafața vitrată estimată?" | Modulele mari (>6m²) limitează opțiunile de grosime și greutate | <100m² (clădire mică) / 100-500m² (medie) / >500m² (turn de birouri) |
| Q3 | „Ce nivel de performanță termică ai nevoie?" | Determină tipul de sticlă (double/triple glazing) și tipul de coating | Standard (Ug 1.1-1.4) / Ridicat (Ug 0.7-1.0) / Pasiv (Ug <0.7) |
| Q4 | „Cât de important este controlul solar?" | Determină g-value-ul și tipul de coating solar | Moderat (g > 0.4) / Ridicat (g 0.25-0.4) / Maxim (g < 0.25) |
| Q5 | „Ce sistem de fațadă folosești?" | Stick, unitized sau semi-unitized — fiecare are restricții diferite de greutate și modul | Stick (montat pe șantier) / Unitized (module prefabricate) / Semi-unitized / Necunoscut |

**Problemă reală (nu cea declarată):**
Arhitecții intră cu „fațadă transparentă, performantă termic." Cele două obiective sunt în tensiune directă. Fiecare creștere de transparență sacrifică control solar. Fiecare creștere de performanță termică adaugă greutate și grosime. Decizia reală este **unde se plasează compromisul** între aceste forțe opuse.

---

## 2. Cele trei opțiuni (strategii de vitrare, nu produse)

### Opțiunea A — Transparență ridicată / control solar moderat

| Atribut | Valoare |
|---|---|
| **Nume** | „Transparență maximă — vitraj clar, coating solar ușor" |
| **Descriere** | Double glazing cu low-e coating, sticlă low-iron. G-value ~0.4-0.5. Ug ~1.0-1.2. Ideal pentru fațade unde lumina naturală și vederea sunt prioritare. |
| **Avantaje** | Lumină naturală maximă. Neutralitate cromatică. Cost moderat. Compatibil cu majoritatea sistemelor. |
| **Limite** | Control solar limitat — nu blochează suficient pentru fațade sudice. Performanță termică sub standardele passive. |
| **Cel mai potrivit când** | Orientare nordică sau est-vest. Suprafețe <500m². Control solar moderat e suficient. |
| **Compromisuri** | Mai puțină izolare termică. Încălzire solară semnificativă vara (fațade sudice). |

### Opțiunea B — Performanță solară echilibrată

| Atribut | Valoare |
|---|---|
| **Nume** | „Echilibru — double glazing solar-control, coating selectiv" |
| **Descriere** | Double glazing cu coating solar-control selectiv (transmite lumină, reflectă căldură). G-value ~0.25-0.35. Ug ~0.9-1.1. Neutralitate cromatică bună. |
| **Avantaje** | Echilibru bun lumină/căldură. Confort termic ridicat vara. Cost acceptabil. |
| **Limite** | Ușor mai întunecat decât varianta A. Nu atinge standardele passive. |
| **Cel mai potrivit când** | Orientare sudică, suprafețe mari. Cerință solară semnificativă fără a sacrifica total transparența. |
| **Compromisuri** | Transparență ușor redusă (transmite ~60-70% din lumină vs 80%+ la A). |

### Opțiunea C — Performanță ridicată / transparență redusă

| Atribut | Valoare |
|---|---|
| **Nume** | „Performanță maximă — triple glazing, coating solar intens" |
| **Descriere** | Triple glazing cu coating solar-control avansat. G-value <0.25. Ug <0.7. Ideal pentru clădiri pasive sau fațade sudice cu cerințe maxime. |
| **Avantaje** | Performanță termică maximă. Control solar superior. Conformitate cu standarde passive (Passivhaus). |
| **Limite** | Greutate mare — incompatibil cu sisteme stick ușoare și module mici. Transmisie luminoasă redusă (50-60%). Cost ridicat. |
| **Cel mai potrivit când** | Clădiri pasive, fațade sudice, suprafețe >500m² unde performanța justifică costul. |
| **Compromisuri** | Transparență semnificativ redusă. Greutate ridicată (triple > double). Cost cu 30-40% peste A. |

---

## 3. Criterii de comparație

| Criteriu | Opțiunea A | Opțiunea B | Opțiunea C |
|---|---|---|---|
| **Transparență** | ⬤⬤⬤ Maximă | ⬤⬤ Medie | ⬤ Redusă |
| **Control solar** | ⬤ Moderat | ⬤⬤⬤ Selectiv | ⬤⬤⬤ Maxim |
| **Performanță termică** | ⬤⬤ Standard | ⬤⬤ Bună | ⬤⬤⬤ Maximă |
| **Greutate** | ⬤⬤⬤ Ușoară | ⬤⬤ Medie | ⬤ Grea |
| **Cost relativ** | ⬤⬤ Mediu | ⬤⬤ Mediu | ⬤⬤⬤ Ridicat |
| **Compatibilitate sistem** | ⬤⬤⬤ Universală | ⬤⬤⬤ Universală | ⬤⬤ Limitată (greutate) |
| **Neutralitate cromatică** | ⬤⬤⬤ Neutru | ⬤⬤ Bună | ⬤⬤ Variabilă |

---

## 4. Reguli de recomandare / respingere (cu praguri obligatorii)

### Opțiunea A — Recomandată când:
- Q1 ≠ „Sud" (soarele direct e prea intens pentru controlul moderat)
- Q3 ≠ „Pasiv" (Ug > 0.7 nu satisface standardele)
- **Respinsă când:** Q1 = „Sud" **ȘI** Q4 = „Maxim" (prag obligatoriu: control solar insuficient) **SAU** Q3 = „Pasiv" (prag obligatoriu: Ug minim 0.7 neatins)

### Opțiunea B — Recomandată când:
- Q1 = „Sud"
- Q4 ≠ „Maxim" (dacă solarul e acceptabil, B e echilibrul corect)
- Q2 ≠ „>500m²" (coating-ul selectiv scalează bine)
- **Respinsă când:** Q3 = „Pasiv" (prag obligatoriu: Ug 0.9 > 0.7, nu atinge standardul pasiv)

### Opțiunea C — Recomandată când:
- Q3 = „Pasiv" (singura opțiune compatibilă)
- Q1 = „Sud" **ȘI** Q4 = „Maxim" (caz extrem: soare + control maxim)
- **Respinsă când:** Q2 = „<100m²" **SAU** Q5 = „Stick" (incompatibilitate: greutatea triple glazing depășește capacitatea sistemelor stick ușoare pentru suprafețe mici)

---

## 5. Structura Decision Record

```typescript
interface DecisionRecord {
  id: string
  decidedAt: string
  intent: {
    type: "facade_glazing_strategy"
    label: "Fațadă — strategie de vitrare"
  }
  context: {
    orientation: "south" | "east_west" | "north"
    surfaceArea: "under_100" | "100_500" | "over_500"
    thermalPerformance: "standard" | "high" | "passive"
    solarControl: "moderate" | "high" | "maximum"
    facadeSystem: "stick" | "unitized" | "semi_unitized" | "unknown"
  }
  options: { ... }[]
  selectedOptionId: string
  acceptedTradeoffs: { description: string; whyAccepted: string }[]
  lessons: string[]
  nextSteps: string[]
}
```

---

## 6. Ce testează DM-003 față de DM-001 și DM-002

| Dimensiune | DM-001 | DM-002 | DM-003 |
|---|---|---|---|
| Întrebări de context | 4 | 4 | **5** |
| Criterii | 6 | 6 | **7** |
| Opțiuni | 3 | 3 | 3 |
| Praguri obligatorii | Nu | Nu | **Da** (Ug < 0.7, g > 0.4) |
| Incompatibilități | Nu | Nu | **Da** (greutate + sistem) |
| Valori numerice | Nu | Nu | **Da** (Ug, g-value) |
| Decision Record | Identic | Identic | **Identic** |

---

## 7. Ce NU intră

- Configurator de produs, compoziții de sticlă, producători
- Preț, ofertă, comandă
- Oblio, BIM, CAD
- Supabase, persistență
