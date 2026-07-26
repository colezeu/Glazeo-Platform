// ══════════════════════════════════════════════
// GLAZEO — DM-002 Data (Balustradă din sticlă)
// ══════════════════════════════════════════════

export type Location = "interior" | "exterior"
export type HeightCategory = "sub_1m" | "1_3m" | "peste_3m"
export type SurfaceType = "concrete" | "steel" | "wood_composite" | "unknown"
export type HandrailRequirement = "yes_mandatory" | "no_optional" | "yes_integrated"

export interface DM002Context {
  location: Location
  heightCategory: HeightCategory
  surfaceType: SurfaceType
  handrailRequired: HandrailRequirement
}

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
    whyItMatters: "Normativ: peste 1m → laminat obligatoriu. Peste 3m → cerințe suplimentare de prindere.",
    options: [
      { value: "sub_1m" as const, label: "Sub 1m (parapet jos)" },
      { value: "1_3m" as const, label: "1–3m (balcon)" },
      { value: "peste_3m" as const, label: "Peste 3m (terase înalte)" },
    ],
  },
  {
    id: "surfaceType" as const,
    question: "Pe ce tip de suprafață se montează?",
    whyItMatters: "Determină sistemul de prindere și toleranțele admise.",
    options: [
      { value: "concrete" as const, label: "Beton / planșeu" },
      { value: "steel" as const, label: "Structură metalică" },
      { value: "wood_composite" as const, label: "Lemn / compozit" },
      { value: "unknown" as const, label: "Necunoscut" },
    ],
  },
  {
    id: "handrailRequired" as const,
    question: "Este obligatorie mâna curentă?",
    whyItMatters: "Poate fi integrată în sistem sau adăugată separat.",
    options: [
      { value: "yes_mandatory" as const, label: "Da, obligatorie" },
      { value: "no_optional" as const, label: "Nu, opțională" },
      { value: "yes_integrated" as const, label: "Da, dar vreau integrată în profil" },
    ],
  },
]

export const COMPARISON_CRITERIA = [
  { id: "transparency", label: "Transparență", description: "Cât de mult se vede prin balustradă." },
  { id: "safety", label: "Siguranță structurală", description: "Rezistența la impact, wind load și norme." },
  { id: "tolerance", label: "Toleranță denivelări", description: "Cât de bine gestionează suprafețele inegale." },
  { id: "exterior", label: "Rezistență la exterior", description: "Dilatație termică, coroziune, intemperii." },
  { id: "cost", label: "Cost relativ", description: "Cost estimativ: redus, mediu sau ridicat." },
  { id: "aesthetics", label: "Estetică", description: "Stilul: minimalist, tehnic sau industrial." },
]

export const OPTIONS_BASE = [
  {
    id: "frameless",
    name: "Frameless — sticlă aparent liberă, puncte discrete",
    description: "Panouri de sticlă securizată fixate prin puncte de prindere din inox. Fără profil inferior continuu.",
    pros: [
      "Transparență maximă — fără profil vizibil",
      "Aspect 'plutitor', ideal pentru terase cu vedere",
      "Estetică minimalistă premium",
    ],
    cons: [
      "Necesită suprafață perfect plană",
      "Punctele de prindere concentrează tensiunea",
      "Dilatația termică la exterior poate cauza fisuri",
    ],
    criteria: { transparency: 3, safety: 2, tolerance: 1, exterior: 2, cost: 3, aesthetics: 3 },
    bestWhen: "Interior, înălțime sub 3m, beton. Prioritatea #1 este estetica.",
    notRecommendedWhen: "Exterior + înălțime mare. Lemn/compozit. Wind load semnificativ.",
    tradeoffs: [
      "Sticlă mai groasă la exterior → cost suplimentar",
      "Denivelări → compensare dificilă",
      "Punctele de prindere sunt vizibile de aproape",
    ],
  },
  {
    id: "u_channel",
    name: "Profil U — bază continuă, sticlă încastrată",
    description: "Profil aluminiu U montat continuu. Sticla încastrată pe toată lungimea. Compatibil cu mână curentă.",
    pros: [
      "Distribuție uniformă a sarcinii",
      "Iertător cu denivelările",
      "Foarte bun pentru exterior",
    ],
    cons: [
      "Profilul inferior este vizibil (3–5 cm)",
      "Mai puțin transparent decât frameless",
      "Look mai 'tehnic'",
    ],
    criteria: { transparency: 2, safety: 3, tolerance: 3, exterior: 3, cost: 2, aesthetics: 2 },
    bestWhen: "Exterior, înălțimi mari, suprafețe cu denivelări. Siguranța e prioritară.",
    notRecommendedWhen: "Mână curentă integrată obligatorie (profilul U nu o include).",
    tradeoffs: [
      "Profilul inferior rupe senzația de plutire",
      "Cost ușor mai mare (material + manoperă)",
    ],
  },
  {
    id: "integrated_handrail",
    name: "Mână curentă integrată — profil superior structural",
    description: "Profil superior din aluminiu/inox: mână curentă + element structural. Panouri prinse între profilul inferior și cel superior.",
    pros: [
      "Mâna curentă integrată elegant",
      "Structură foarte rigidă",
      "Bun pentru trafic intens (spații publice)",
    ],
    cons: [
      "Profilul superior e vizibil (4–6 cm)",
      "Mai puțin potrivit pentru vedere panoramică",
      "Cost mai mare decât profilul U simplu",
    ],
    criteria: { transparency: 1, safety: 3, tolerance: 2, exterior: 3, cost: 2, aesthetics: 1 },
    bestWhen: "Mâna curentă obligatorie. Trafic intens (mall-uri, clădiri publice).",
    notRecommendedWhen: "Interior + mână curentă opțională (bara superioară inutilă vizual).",
    tradeoffs: [
      "Bara superioară blochează parțial vederea",
      "Estetică mai 'grea' decât frameless",
    ],
  },
]
