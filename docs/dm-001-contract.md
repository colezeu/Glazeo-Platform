# DM-001 Contract: Compartimentare din sticlă pentru sală de ședințe

> **Status:** Contract for Phase 4B implementation
> **Source:** `GLAZEO — Decision Model 001 — Meeting Room Glass Partition.md`
> **ID intern:** `meeting_room_partition`

---

## 1. Intenție

**Denumire UI:** „Compartimentare din sticlă pentru sală de ședințe"

**Întrebarea inițială:**
> „Ai nevoie de un perete de sticlă pentru o sală de ședințe?"

**Context necesar (Layer 2 — Diagnostic Questions):**

| # | Întrebare | De ce contează | Tip răspuns |
|---|---|---|---|
| Q1 | „Ce tip de tavan există? Structura permite ancorare?" | Determină dacă sticla se sprijină pe tavan sau necesită sistem auto-portant | Alegere: „Tavan suspendat (ancorare posibilă)" / „Tavan structural (ancorare sigură)" / „Necunoscut" |
| Q2 | „Care este traficul estimat prin uși?" | Determină tipul de balamale și durabilitatea | Alegere: „Moderat (2-6 utilizări/zi)" / „Intens (6+ utilizări/zi)" / „Necunoscut" |
| Q3 | „Ce nivel de intimitate acustică ai nevoie?" | Factorul #1 subestimat — determină tipul de sticlă și etanșări | Alegere: „Vizuală (fără cerință acustică)" / „Conversațională (voci înfundate)" / „Confidențială (convorbiri inaudibile)" |
| Q4 | „Există surse de zgomot în apropiere?" | Dacă da, acustica devine prioritară | Da/Nu/Necunoscut |

**Problemă reală (nu cea declarată):**
Arhitecții intră cu „perete continuu de sticlă, fără profile vizibile." Problema reală este adesea **continuitatea spațială** — păstrarea luminii naturale și a senzației de deschidere.

---

## 2. Cele trei opțiuni

### Opțiunea A — Canal U perimetral minimal (frameless)

| Atribut | Valoare |
|---|---|
| **Nume** | „Minimal — profil subțire, îmbinări invizibile" |
| **Descriere** | Sticlă securizată 10mm low-iron în canale aluminiu minimale. Îmbinări cu bandă transparentă 3M. Uși cu pivot Dorma. |
| **Avantaje** | Transparență maximă, fără profile verticale, lumină naturală nestingherită |
| **Limite** | Necesită nivelare precisă (±5mm pe 4m). Capacitate portantă a planșeului. Acustică de bază (Rw ~33-35). |
| **Cel mai potrivit când** | Prioritatea #1 este lumina și estetica. Trafic moderat. Fără cerințe acustice stricte. |
| **Compromisuri** | Abatere >15mm → profil de compensare vizibil. Fără laminat → sticla cade la spargere. Acustică „suficientă", nu „excelentă". |

### Opțiunea B — Sistem point-fixed (spider)

| Atribut | Valoare |
|---|---|
| **Nume** | „Industrial — puncte de fixare aparente" |
| **Descriere** | Panouri de sticlă fixate prin puncte discrete din inox. Fără rame perimetrale. Look arhitectural distinctiv. |
| **Avantaje** | Estetică industrială distinctivă. Fără rame perimetrale. Libertate de design. |
| **Limite** | Zone greu de curățat în jurul punctelor de fixare. Etanșare acustică slabă. Acumulare de praf. |
| **NU se recomandă pentru** | Clădiri cu praf (patrimoniu, șantier activ). Spații care necesită acustică. |
| **Compromisuri** | Întreținere ridicată. Izolare fonică redusă. Punctele de fixare fragmentează vizual suprafața. |

### Opțiunea C — Profile aluminiu negru (industrial/loft)

| Atribut | Valoare |
|---|---|
| **Nume** | „Structural — profile negre, stil industrial" |
| **Descriere** | Profile verticale și orizontale din aluminiu negru mat. Sistem complet de închidere acustică. |
| **Avantaje** | Iertător cu suprafețe inegale. Opțiuni acustice bune. Instalare mai ușoară. |
| **Limite** | Profilele verticale fragmentează vizual spațiul. Mai puțină transparență. |
| **NU se recomandă pentru** | Spații mici (<20m²) unde profilele „fragmentează prea mult". Când transparența maximă e prioritatea #1. |
| **Compromisuri** | Pierderea senzației de „perete continuu de sticlă". Estetică industrială specifică — nu place tuturor arhitecților. |

---

## 3. Criterii de comparație

| Criteriu | Opțiunea A | Opțiunea B | Opțiunea C |
|---|---|---|---|
| **Transparență** | ⬤⬤⬤ Maximă | ⬤⬤ Medie | ⬤ Redusă |
| **Acustică** | ⬤ De bază (Rw 33-35) | ⬤ Redusă (etanșare slabă) | ⬤⬤⬤ Bună (profile + etanșări) |
| **Întreținere** | ⬤⬤⬤ Ușoară | ⬤ Dificilă (praf în puncte) | ⬤⬤ Moderată |
| **Toleranță denivelări** | ⬤ Redusă (±5mm) | ⬤⬤ Moderată | ⬤⬤⬤ Ridicată |
| **Cost relativ** | ⬤⬤ Mediu | ⬤⬤⬤ Ridicat | ⬤⬤ Mediu |
| **Estetică** | Minimalistă, invizibilă | Industrială, statement | Loft, structurală |

---

## 4. Reguli de recomandare / respingere

Fiecare opțiune are o regulă explicită care determină dacă este **recomandată** sau **respinsă** pe baza răspunsurilor la Q1-Q4.

### Opțiunea A — Recomandată când:
- Q1 = „Tavan structural" sau „Necunoscut"
- Q3 ≠ „Confidențială"
- **Respinsă când:** Q1 = „Tavan suspendat" (necesită auto-portant, cost suplimentar semnificativ) **SAU** Q3 = „Confidențială" (Rw insuficient)

### Opțiunea B — Recomandată când:
- Niciuna din celelalte opțiuni nu satisface estetica dorită
- Q2 ≠ „Intens" (punctele de fixare nu rezistă la trafic intens)
- **Aproape întotdeauna respinsă** în clădiri de patrimoniu (praf) sau când Q4 = „Da" (zgomot)

### Opțiunea C — Recomandată când:
- Q1 = „Tavan suspendat" (iertător cu denivelări)
- Q3 = „Confidențială" (acustică bună)
- **Respinsă când:** spațiul < 20m² (profilele fragmentează vizual)

---

## 5. Structura Decision Record

```typescript
interface DecisionRecord {
  /** ID-ul deciziei. */
  id: string

  /** Data și ora la care s-a luat decizia. */
  decidedAt: string

  /** Intenția originală. */
  intent: {
    type: "meeting_room_partition"
    label: "Compartimentare din sticlă pentru sală de ședințe"
  }

  /** Răspunsurile la întrebările de context. */
  context: {
    ceilingType: "suspended" | "structural" | "unknown"
    doorTraffic: "moderate" | "intense" | "unknown"
    acousticNeed: "visual_only" | "conversational" | "confidential"
    noiseNearby: boolean | null
  }

  /** Opțiunile considerate. */
  options: {
    id: string
    name: string
    recommended: boolean
    reason: string
    pros: string[]
    cons: string[]
  }[]

  /** Opțiunea aleasă de utilizator. */
  selectedOptionId: string

  /** Compromisurile acceptate explicit. */
  acceptedTradeoffs: {
    description: string
    whyAccepted: string
  }[]

  /** Lecții și recomandări. */
  lessons: string[]

  /** Întrebări rămase / next steps. */
  nextSteps: string[]
}
```

---

## 6. Ce NU intră în 4B

- Preț, ofertă, comandă, configurator tehnic (grosime, tratament, feronerie)
- Oblio, BIM, CAD
- Supabase, persistență, autentificare
- Celelalte șapte intenții
- Selector de rol sau bypass runtime
