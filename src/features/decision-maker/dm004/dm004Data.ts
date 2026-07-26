// ══════════════════════════════════════════════
// GLAZEO — DM-004 Data (Cabină de duș walk-in)
// ══════════════════════════════════════════════

export type Geometry = "niche" | "corner" | "island"
export type AccessType = "walk_in" | "hinged_door" | "sliding_door"
export type SurfaceCondition = "flat" | "uneven" | "unknown"
export type Accessibility = "standard" | "accessible"
export type Maintenance = "minimal" | "normal" | "no_preference"

export interface DM004Context {
  geometry: Geometry
  accessType: AccessType
  surfaceCondition: SurfaceCondition
  accessibility: Accessibility
  maintenance: Maintenance
}

export const CONTEXT_QUESTIONS = [
  {
    id: "geometry" as const,
    question: "Care este geometria spațiului?",
    whyItMatters: "Determină tipul de închidere și dimensiunea minimă.",
    options: [
      { value: "niche" as const, label: "Nișă (3 pereți)" },
      { value: "corner" as const, label: "Colț (2 pereți)" },
      { value: "island" as const, label: "Insulă (1 perete)" },
    ],
  },
  {
    id: "accessType" as const,
    question: "Ce tip de acces preferi?",
    whyItMatters: "Walk-in total (fără ușă) vs. ușă pentru controlul apei.",
    options: [
      { value: "walk_in" as const, label: "Walk-in complet (fără ușă)" },
      { value: "hinged_door" as const, label: "Cu ușă batantă" },
      { value: "sliding_door" as const, label: "Cu ușă glisantă" },
    ],
  },
  {
    id: "surfaceCondition" as const,
    question: "Care sunt condițiile pereților și pardoselii?",
    whyItMatters: "Denivelările necesită profil de compensare sau stabilizator.",
    options: [
      { value: "flat" as const, label: "Suprafețe plane și finisate" },
      { value: "uneven" as const, label: "Denivelări sau neregularități" },
      { value: "unknown" as const, label: "Necunoscut" },
    ],
  },
  {
    id: "accessibility" as const,
    question: "Cât de importantă este accesibilitatea?",
    whyItMatters: "Soluțiile frameless pot necesita prag sau spațiu minim de manevră.",
    options: [
      { value: "standard" as const, label: "Standard (fără cerințe speciale)" },
      { value: "accessible" as const, label: "Accesibil (mobilitate redusă)" },
    ],
  },
  {
    id: "maintenance" as const,
    question: "Ce nivel de întreținere accepți?",
    whyItMatters: "Sticla frameless necesită tratament anti-calcificare și curățare frecventă.",
    options: [
      { value: "minimal" as const, label: "Minimă (tratament hidrofob inclus)" },
      { value: "normal" as const, label: "Normală (curățare periodică)" },
      { value: "no_preference" as const, label: "Nicio preferință" },
    ],
  },
]

export const COMPARISON_CRITERIA = [
  { id: "aesthetics", label: "Estetică", description: "Cât de curat și minimalist arată." },
  { id: "waterControl", label: "Control apă", description: "Cât de bine previne stropirea în afara dușului." },
  { id: "robustness", label: "Robustețe", description: "Rezistența structurală și la vibrații." },
  { id: "accessibility", label: "Accesibilitate", description: "Cât de ușor se intră și se iese." },
  { id: "maintenance", label: "Întreținere", description: "Frecvența și dificultatea curățării." },
  { id: "cost", label: "Cost relativ", description: "Cost estimativ." },
  { id: "tolerance", label: "Toleranță denivelări", description: "Cât de bine gestionează suprafețele inegale." },
]

export const OPTIONS_BASE = [
  {
    id: "frameless",
    name: "Frameless — panou fix, sticlă aparent liberă",
    description: "Panou de sticlă securizată 10mm, fixat prin puncte discrete. Fără profil inferior vizibil.",
    pros: ["Estetică maximă, spațiu vizual neîntrerupt", "Ușor de integrat în orice design"],
    cons: ["Stropire parțială în afara zonei de duș", "Necesită suprafețe perfect plane", "Întreținere frecventă"],
    criteria: { aesthetics: 3, waterControl: 1, robustness: 2, accessibility: 2, maintenance: 1, cost: 2, tolerance: 1 },
    bestWhen: "Geometrie nișă, suprafețe plane, walk-in complet, prioritate estetică.",
    notRecommendedWhen: "Ușă glisantă necesară. Denivelări prezente.",
    tradeoffs: ["Stropirea apei nu este complet controlată", "Necesită tratament anti-calcificare"],
  },
  {
    id: "stabilized",
    name: "Stabilizat — panou fix cu bară de susținere",
    description: "Panou de sticlă + bară orizontală de stabilizare între pereți. Reduce vibrațiile.",
    pros: ["Mai robust decât frameless pur", "Compensează denivelări minore", "Bara poate servi drept suport"],
    cons: ["Bara de stabilizare este vizibilă", "Mai puțin minimalist", "Necesită 2 pereți opuși"],
    criteria: { aesthetics: 2, waterControl: 1, robustness: 3, accessibility: 2, maintenance: 2, cost: 2, tolerance: 3 },
    bestWhen: "Geometrie nișă sau colț, denivelări prezente, trafic frecvent.",
    notRecommendedWhen: "Geometrie insulă (nu există 2 pereți opuși).",
    tradeoffs: ["Estetică ușor compromisă de bara vizibilă", "Nu rezolvă complet problema stropirii"],
  },
  {
    id: "enclosed",
    name: "Funcțional — panou fix + ușă glisantă sau batantă",
    description: "Panou fix + ușă din sticlă. Control complet al apei. Profil minim pentru ghidaj.",
    pros: ["Control maxim al stropirii", "Potrivit pentru toate geometriile", "Accesibilitate bună (ușă glisantă)"],
    cons: ["Profil vizibil pentru ghidaj", "Cost mai mare", "Întreținere moderată (ghidaje, garnituri)"],
    criteria: { aesthetics: 1, waterControl: 3, robustness: 3, accessibility: 3, maintenance: 2, cost: 3, tolerance: 2 },
    bestWhen: "Geometrie insulă, accesibilitate necesară, control maxim al apei.",
    notRecommendedWhen: "Buget redus (cost mai mare).",
    tradeoffs: ["Profilul de ghidaj rupe estetica frameless", "Garniturile necesită înlocuire periodică"],
  },
]
