// ══════════════════════════════════════════════
// GLAZEO — DM-001 Data (Phase 4B)
// Date deterministe, separate de componente.
// ══════════════════════════════════════════════

// ── Tipuri ──────────────────────────────────────────

export type CeilingType = "suspended" | "structural" | "unknown"
export type DoorTraffic = "moderate" | "intense" | "unknown"
export type AcousticNeed = "visual_only" | "conversational" | "confidential"

export interface DM001Context {
  ceilingType: CeilingType
  doorTraffic: DoorTraffic
  acousticNeed: AcousticNeed
  noiseNearby: boolean | null
}

export interface DM001Option {
  id: string
  name: string
  description: string
  pros: string[]
  cons: string[]
  recommended: boolean
  reason: string
  criteria: Record<string, number> // 1-3 dots
  bestWhen: string
  notRecommendedWhen: string
  tradeoffs: string[]
}

export interface DecisionRecord {
  id: string
  decidedAt: string
  context: DM001Context
  options: DM001Option[]
  selectedOptionId: string | null
  acceptedTradeoffs: { description: string; whyAccepted: string }[]
  lessons: string[]
  nextSteps: string[]
}

// ── Întrebări de context ───────────────────────────

export const CONTEXT_QUESTIONS = [
  {
    id: "ceilingType" as const,
    question: "Ce tip de tavan există? Structura permite ancorare?",
    whyItMatters: "Determină dacă sticla se sprijină pe tavan sau necesită sistem auto-portant.",
    options: [
      { value: "suspended" as const, label: "Tavan suspendat (ancorare posibilă)" },
      { value: "structural" as const, label: "Tavan structural (ancorare sigură)" },
      { value: "unknown" as const, label: "Necunoscut" },
    ],
  },
  {
    id: "doorTraffic" as const,
    question: "Care este traficul estimat prin uși?",
    whyItMatters: "Determină tipul de balamale și durabilitatea necesară.",
    options: [
      { value: "moderate" as const, label: "Moderat (2-6 utilizări/zi)" },
      { value: "intense" as const, label: "Intens (6+ utilizări/zi)" },
      { value: "unknown" as const, label: "Necunoscut" },
    ],
  },
  {
    id: "acousticNeed" as const,
    question: "Ce nivel de intimitate acustică ai nevoie?",
    whyItMatters: "Factorul cel mai subestimat — determină tipul de sticlă și etanșările.",
    options: [
      { value: "visual_only" as const, label: "Vizuală (fără cerință acustică)" },
      { value: "conversational" as const, label: "Conversațională (voci înfundate)" },
      { value: "confidential" as const, label: "Confidențială (convorbiri inaudibile)" },
    ],
  },
  {
    id: "noiseNearby" as const,
    question: "Există surse de zgomot în apropiere?",
    whyItMatters: "Dacă da, acustica devine prioritară.",
    options: [
      { value: true as const, label: "Da" },
      { value: false as const, label: "Nu" },
      { value: null, label: "Necunoscut" },
    ],
  },
]

// ── Criterii de comparație ─────────────────────────

export const COMPARISON_CRITERIA = [
  { id: "transparency", label: "Transparență", description: "Cât de multă lumină naturală lasă să treacă." },
  { id: "acoustics", label: "Acustică", description: "Cât de bine izolează fonic." },
  { id: "maintenance", label: "Întreținere", description: "Cât de ușor se curăță și se menține." },
  { id: "tolerance", label: "Toleranță denivelări", description: "Cât de bine gestionează suprafețele inegale." },
  { id: "cost", label: "Cost relativ", description: "Cost estimativ: redus, mediu sau ridicat. Fără prețuri exacte." },
  { id: "aesthetics", label: "Estetică", description: "Stilul arhitectural: minimalist, industrial sau structural." },
]

// ── Opțiuni (date brute, fără recomandare/respingere — aceea vine din motor) ──

export const OPTIONS_BASE = [
  {
    id: "frameless",
    name: "Minimal — profil subțire, îmbinări invizibile",
    description: "Sticlă securizată 10mm low-iron în canale aluminiu minimale. Îmbinări cu bandă transparentă 3M. Uși cu pivot Dorma.",
    pros: [
      "Transparență maximă — fără profile verticale",
      "Lumină naturală nestingherită",
      "Estetică curată, minimalistă",
      "Low-iron elimină tenta verzuie",
    ],
    cons: [
      "Necesită nivelare precisă (±5mm pe 4m)",
      "Capacitate portantă a planșeului trebuie verificată",
      "Acustică de bază (Rw ~33-35)",
      "Fără laminat → sticla cade la spargere",
    ],
    criteria: {
      transparency: 3,
      acoustics: 1,
      maintenance: 3,
      tolerance: 1,
      cost: 2,
      aesthetics: 3,
    },
    bestWhen: "Prioritatea #1 este lumina și estetica. Trafic moderat. Fără cerințe acustice stricte.",
    notRecommendedWhen: "Cerințe acustice confidențiale sau tavan suspendat fără structură de ancorare.",
    tradeoffs: [
      "Abatere >15mm → profil de compensare vizibil",
      "Tempered-only → sticla cade la spargere",
      "Acustică 'suficientă', nu 'excelentă'",
    ],
  },
  {
    id: "spider",
    name: "Industrial — puncte de fixare aparente",
    description: "Panouri de sticlă fixate prin puncte discrete din inox. Fără rame perimetrale. Look arhitectural distinctiv.",
    pros: [
      "Estetică industrială distinctivă",
      "Fără rame perimetrale",
      "Libertate de design",
    ],
    cons: [
      "Zone greu de curățat în jurul punctelor de fixare",
      "Etanșare acustică slabă",
      "Acumulare de praf în punctele de prindere",
    ],
    criteria: {
      transparency: 2,
      acoustics: 1,
      maintenance: 1,
      tolerance: 2,
      cost: 3,
      aesthetics: 2,
    },
    bestWhen: "Se dorește un statement arhitectural industrial. Niciuna din celelalte opțiuni nu satisface estetic.",
    notRecommendedWhen: "Clădiri cu praf (patrimoniu). Zgomot ambiental semnificativ. Trafic intens.",
    tradeoffs: [
      "Întreținere ridicată",
      "Izolare fonică redusă",
      "Punctele de fixare fragmentează vizual",
    ],
  },
  {
    id: "aluminum",
    name: "Structural — profile negre, stil industrial",
    description: "Profile verticale și orizontale din aluminiu negru mat. Sistem complet de închidere acustică.",
    pros: [
      "Iertător cu suprafețe inegale",
      "Opțiuni acustice bune",
      "Instalare mai ușoară",
      "Rezistență structurală ridicată",
    ],
    cons: [
      "Profilele verticale fragmentează vizual spațiul",
      "Mai puțină transparență",
      "Estetică industrială specifică — nu place tuturor",
    ],
    criteria: {
      transparency: 1,
      acoustics: 3,
      maintenance: 2,
      tolerance: 3,
      cost: 2,
      aesthetics: 1,
    },
    bestWhen: "Tavan suspendat fără ancorare sigură. Cerințe acustice confidențiale. Spații mari.",
    notRecommendedWhen: "Spații mici (<20m²) unde profilele fragmentează vizual. Când transparența maximă e prioritatea #1.",
    tradeoffs: [
      "Pierderea senzației de 'perete continuu'",
      "Estetică loft/industrială, nu universală",
    ],
  },
]
