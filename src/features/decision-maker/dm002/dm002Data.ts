// ══════════════════════════════════════════════
// GLAZEO — DM-002 Data (Balustradă din sticlă) v3
// Reconstruit pe catalog.json — 4 sisteme reale.
// Sursă canonică: ~/hermes-workspace/Glazeo/public/catalog.json
// ══════════════════════════════════════════════

export type Location = "interior" | "exterior"
export type HeightCategory = "sub_1m" | "1_3m" | "peste_3m"
export type SurfaceType = "concrete" | "steel" | "wood_composite" | "unknown"
export type HandrailNeed = "no" | "yes_mandatory" | "yes_optional"
export type SurfaceCondition = "flat" | "minor_uneven" | "severely_uneven" | "unknown"

export interface DM002Context {
  location: Location
  heightCategory: HeightCategory
  surfaceType: SurfaceType
  surfaceCondition: SurfaceCondition
  handrailNeed: HandrailNeed
  budgetPriority: "aesthetics" | "balanced" | "cost"
}

// ── Întrebări de context ───────────────────────────

export const CONTEXT_QUESTIONS = [
  {
    id: "location" as const,
    question: "Interior sau exterior?",
    whyItMatters: "Determină cerințele de wind load, dilatație termică și rezistență la coroziune.",
    options: [
      { value: "interior" as const, label: "Interior" },
      { value: "exterior" as const, label: "Exterior" },
    ],
  },
  {
    id: "heightCategory" as const,
    question: "Care este înălțimea față de sol?",
    whyItMatters: "Normativ: peste 1m → laminat obligatoriu. Peste 3m → cerințe suplimentare de prindere și wind load.",
    options: [
      { value: "sub_1m" as const, label: "Sub 1m (parapet jos)" },
      { value: "1_3m" as const, label: "1–3m (balcon)" },
      { value: "peste_3m" as const, label: "Peste 3m (terase înalte)" },
    ],
  },
  {
    id: "surfaceType" as const,
    question: "Pe ce tip de suprafață se montează?",
    whyItMatters: "Determină sistemul de prindere compatibil și toleranțele admise.",
    options: [
      { value: "concrete" as const, label: "Beton / planșeu" },
      { value: "steel" as const, label: "Structură metalică" },
      { value: "wood_composite" as const, label: "Lemn / compozit" },
      { value: "unknown" as const, label: "Necunoscut" },
    ],
  },
  {
    id: "surfaceCondition" as const,
    question: "Care este planeitatea suprafeței de montaj?",
    whyItMatters: "Sistemele frameless necesită planeitate aproape perfectă. Reglajul mecanic compensează denivelări mari dar costă 3x mai mult.",
    options: [
      { value: "flat" as const, label: "Plană (abatere < 3mm)" },
      { value: "minor_uneven" as const, label: "Ușoare denivelări (3–10mm)" },
      { value: "severely_uneven" as const, label: "Denivelări semnificative (>10mm)" },
      { value: "unknown" as const, label: "Necunoscut" },
    ],
  },
  {
    id: "handrailNeed" as const,
    question: "Este necesară mâna curentă?",
    whyItMatters: "Parametru pentru etapa de configurare. Nu determină sistemul de prindere — orice sistem poate primi mână curentă. Dar influențează costul total.",
    options: [
      { value: "no" as const, label: "Nu" },
      { value: "yes_mandatory" as const, label: "Da, obligatorie (normativ)" },
      { value: "yes_optional" as const, label: "Da, opțională (preferință estetică)" },
    ],
  },
  {
    id: "budgetPriority" as const,
    question: "Care este prioritatea principală?",
    whyItMatters: "Ajută la alegerea între sisteme cu costuri foarte diferite (35 RON/m → 215 RON/m).",
    options: [
      { value: "aesthetics" as const, label: "Estetică — vreau cel mai curat aspect posibil" },
      { value: "balanced" as const, label: "Echilibrat — bun și ca preț, și ca aspect" },
      { value: "cost" as const, label: "Cost — bugetul e prioritar" },
    ],
  },
]

// ── Criterii de comparație ─────────────────────────

export const COMPARISON_CRITERIA = [
  { id: "transparency", label: "Transparență", description: "Cât de puțin vizibil este sistemul de prindere." },
  { id: "structuralSafety", label: "Siguranță structurală", description: "Rezistența la impact, wind load și conformitate normative." },
  { id: "surfaceTolerance", label: "Toleranță denivelări", description: "Cât de bine gestionează suprafețele inegale." },
  { id: "exteriorSuitability", label: "Adecvare exterior", description: "Dilatație termică, coroziune, rezistență la intemperii." },
  { id: "installComplexity", label: "Complexitate montaj", description: "Timp și manoperă necesară. 1 = cel mai complex, 3 = cel mai simplu." },
  { id: "cost", label: "Cost relativ", description: "Cost estimativ: redus (1), mediu (2) sau ridicat (3)." },
  { id: "aesthetics", label: "Estetică", description: "Impactul vizual al sistemului de prindere: minimalist, tehnic sau industrial." },
]

// ── Opțiuni: 4 sisteme reale din catalog.json ──────
// Sursă: preturi reale Qualmont/Logli

export const OPTIONS_BASE = [
  {
    id: "butoni",
    name: "Butoni Inox — puncte discrete, design minimalist",
    description:
      "Panouri de sticlă fixate prin puncte discrete din inox. Fără profil inferior continuu. " +
      "Cel mai transparent sistem disponibil — sticla pare că plutește. " +
      "Preț sistem: 35 RON/m (catalog GA).",
    pros: [
      "Transparență maximă — fără profil inferior vizibil",
      "Estetică premium, minimalistă",
      "Look 'plutitor' — ideal pentru terase cu vedere",
      "Cel mai accesibil sistem ca preț de bază (35 RON/m)",
    ],
    cons: [
      "Necesită suprafață aproape perfect plană (±3mm)",
      "Punctele de prindere concentrează tensiunea",
      "Dilatația termică la exterior poate cauza fisuri",
      "Ancorare nesigură în lemn/compozit",
    ],
    criteria: {
      transparency: 3,
      structuralSafety: 2,
      surfaceTolerance: 1,
      exteriorSuitability: 1,
      installComplexity: 2,
      cost: 1,
      aesthetics: 3,
    },
    bestWhen:
      "Interior, suprafață plană, înălțime sub 3m, prioritate estetică. Beton sau structură metalică.",
    notRecommendedWhen:
      "Exterior + înălțime peste 3m. Lemn/compozit. Denivelări >3mm. Wind load semnificativ.",
    tradeoffs: [
      "Sticlă mai groasă necesară la exterior → cost suplimentar",
      "Denivelările necesită compensare (nu există reglaj integrat)",
      "Punctele de prindere sunt vizibile de aproape",
    ],
  },
  {
    id: "mini-montanti",
    name: "Mini-Montanți — montanți intermediari inox",
    description:
      "Montanți verticali intermediari din inox, plasați la intervale regulate. " +
      "Distribuie sarcina mai uniform decât butonii, păstrând o transparență ridicată. " +
      "Preț sistem: 50 RON/m (catalog GA).",
    pros: [
      "Distribuție mai uniformă a sarcinii decât butonii",
      "Mai iertător cu denivelările minore",
      "Transparență încă ridicată (montanții sunt discreți)",
      "Bun pentru trafic moderat-intens",
    ],
    cons: [
      "Montanții sunt vizibili (~la fiecare 1–1.2m)",
      "Mai puțin minimalist decât butonii",
      "Aceleași limitări de ancorare ca butonii pe lemn/compozit",
      "Cost moderat — mai scump decât butonii, mai ieftin decât profilul continuu",
    ],
    criteria: {
      transparency: 2,
      structuralSafety: 3,
      surfaceTolerance: 2,
      exteriorSuitability: 1,
      installComplexity: 2,
      cost: 2,
      aesthetics: 2,
    },
    bestWhen:
      "Interior sau exterior protejat, suprafață cu mici neregularități, înălțime sub 3m. Când butonii nu sunt suficienți dar nu vrei profil continuu.",
    notRecommendedWhen:
      "Exterior expus + înălțime peste 3m. Lemn/compozit. Denivelări mari.",
    tradeoffs: [
      "Montanții fragmentează ușor continuitatea vizuală",
      "Mai scump decât butonii, fără a oferi robustețea profilului continuu",
    ],
  },
  {
    id: "profil-cale",
    name: "Profil Pardoseală cu Cale — canal continuu, robust",
    description:
      "Profil aluminiu montat continuu pe pardoseală. Sticla încastrată pe toată lungimea. " +
      "Cel mai versatil sistem — bun pentru interior și exterior, plan și denivelat. " +
      "Preț sistem: 67 RON/m (catalog GA). Opțiuni de profil: U, Y, L.",
    pros: [
      "Distribuție uniformă a sarcinii — cel mai robust sistem",
      "Iertător cu denivelările (canalul absoarbe variațiile)",
      "Excelent pentru exterior și înălțimi mari",
      "Compatibil cu toate tipurile de mână curentă",
      "Raport calitate/preț foarte bun",
    ],
    cons: [
      "Profilul inferior este vizibil (3–5 cm)",
      "Mai puțin transparent decât butonii",
      "Look mai 'tehnic' decât frameless",
    ],
    criteria: {
      transparency: 1,
      structuralSafety: 3,
      surfaceTolerance: 3,
      exteriorSuitability: 3,
      installComplexity: 3,
      cost: 2,
      aesthetics: 1,
    },
    bestWhen:
      "Exterior, înălțimi mari, denivelări prezente. Când siguranța e prioritară. Când vrei un sistem dovedit, fără riscuri.",
    notRecommendedWhen:
      "Prioritatea absolută este estetica minimalistă și bugetul permite reglaj mecanic.",
    tradeoffs: [
      "Profilul inferior rupe senzația de plutire",
      "Look mai puțin premium decât frameless",
    ],
  },
  {
    id: "profil-reglaj",
    name: "Profil Pardoseală cu Reglaj Mecanic — precizie, montaj rapid",
    description:
      "Profil aluminiu cu sistem de reglaj mecanic de precizie. " +
      "Compensează denivelări mari fără improvizații. Cel mai rapid montaj, cea mai bună adaptare la teren. " +
      "Preț sistem: 215 RON/m (catalog GA) — de 3x ori profilul cu cale standard.",
    pros: [
      "Reglaj mecanic de precizie — compensează orice denivelare",
      "Cel mai rapid montaj (reglajul elimină ajustările manuale)",
      "Distribuție perfect uniformă a sarcinii",
      "Ideal pentru exterior și wind load semnificativ",
    ],
    cons: [
      "Cel mai scump sistem (215 RON/m — 3x profilul cu cale)",
      "Profilul inferior este vizibil (ca la profilul cu cale)",
      "Overkill pentru suprafețe plane — nu justifică costul",
    ],
    criteria: {
      transparency: 1,
      structuralSafety: 3,
      surfaceTolerance: 3,
      exteriorSuitability: 3,
      installComplexity: 1,
      cost: 3,
      aesthetics: 1,
    },
    bestWhen:
      "Denivelări semnificative (>10mm). Exterior cu wind load mare. Când timpul de montaj e critic. Când precizia e prioritară și bugetul permite.",
    notRecommendedWhen:
      "Suprafață plană (butonii sau profilul cu cale sunt suficiente). Buget redus.",
    tradeoffs: [
      "Cost semnificativ mai mare (justificat doar când condițiile o cer)",
      "Același look 'tehnic' ca profilul cu cale",
    ],
  },
]

// ── Parametri secundari (NU aparțin Decision Model-ului) ──
// Aceștia se configurează în etapa următoare (Configurator Legacy / adapter):
//
//   Tip sticlă:    662mm (13mm) / 882mm (17mm), clar / parsol ambele / parsol o foaie / mat
//   Formă profil:  U / Y / L (doar pentru sistemele cu profil)
//   Mână curentă:  fără / rotundă inox (18 RON/m) / pătrată inox (38 RON/m) /
//                  slim aluminiu (5 RON/m) / structurală aluminiu (78 RON/m)
//   LED:            da / nu (333 RON)
//   Formă sticlă:   dreaptă / pe rampă
//   Dimensiuni:     lungime, înălțime
//
// Sursă: catalog.json > products.balustrade
