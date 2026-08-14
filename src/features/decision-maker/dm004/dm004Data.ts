// ══════════════════════════════════════════════
// GLAZEO — DM-004 Data (Cabină de duș) v2
// Reconstruit pe catalog.json. stabilized → parametru.
// Sursă canonică: ~/hermes-workspace/Glazeo/public/catalog.json
// ══════════════════════════════════════════════

export type Geometry = "niche" | "corner" | "island"
export type SurfaceCondition = "flat" | "uneven" | "unknown"
export type Accessibility = "standard" | "accessible"
export type Maintenance = "minimal" | "normal" | "no_preference"
export type StabilizationBar = "yes" | "no"

export interface DM004Context {
  geometry: Geometry
  surfaceCondition: SurfaceCondition
  accessibility: Accessibility
  maintenance: Maintenance
  stabilizationBar: StabilizationBar
}

// ── Întrebări de context ───────────────────────────

export const CONTEXT_QUESTIONS = [
  {
    id: "geometry" as const,
    question: "Care este geometria spațiului?",
    whyItMatters: "Determină ce tipuri de închidere sunt posibile: nișa permite orice, insula necesită ușă glisantă.",
    options: [
      { value: "niche" as const, label: "Nișă (3 pereți)" },
      { value: "corner" as const, label: "Colț (2 pereți)" },
      { value: "island" as const, label: "Insulă (1 perete)" },
    ],
  },
  {
    id: "surfaceCondition" as const,
    question: "Care sunt condițiile pereților și pardoselii?",
    whyItMatters: "Denivelările necesită profil de compensare. Suprafețele imperfecte pot necesita bară de stabilizare la paravanul fix.",
    options: [
      { value: "flat" as const, label: "Suprafețe plane și finisate" },
      { value: "uneven" as const, label: "Denivelări sau neregularități" },
      { value: "unknown" as const, label: "Necunoscut" },
    ],
  },
  {
    id: "accessibility" as const,
    question: "Cât de importantă este accesibilitatea?",
    whyItMatters: "Paravanul fix (walk-in) e cel mai accesibil. Ușa batantă necesită spațiu de manevră. Ușa glisantă e un compromis bun.",
    options: [
      { value: "standard" as const, label: "Standard (fără cerințe speciale)" },
      { value: "accessible" as const, label: "Accesibil (mobilitate redusă)" },
    ],
  },
  {
    id: "maintenance" as const,
    question: "Ce nivel de întreținere accepți?",
    whyItMatters: "Paravanul fix necesită tratament anti-calcificare. Ușile au garnituri și ghidaje care necesită întreținere periodică.",
    options: [
      { value: "minimal" as const, label: "Minimă (tratament hidrofob recomandat)" },
      { value: "normal" as const, label: "Normală (curățare periodică)" },
      { value: "no_preference" as const, label: "Nicio preferință" },
    ],
  },
  {
    id: "stabilizationBar" as const,
    question: "Ai nevoie de bară de stabilizare la paravanul fix?",
    whyItMatters: "Bara de stabilizare reduce vibrațiile și compensează denivelări minore. Este un accesoriu, nu un sistem separat. Relevant doar pentru paravanul fix.",
    options: [
      { value: "no" as const, label: "Nu (suprafețe plane, estetică maximă)" },
      { value: "yes" as const, label: "Da (denivelări minore, robustețe suplimentară)" },
    ],
  },
]

// ── Criterii de comparație ─────────────────────────

export const COMPARISON_CRITERIA = [
  { id: "aesthetics", label: "Estetică", description: "Cât de curat și minimalist arată." },
  { id: "waterControl", label: "Control apă", description: "Cât de bine previne stropirea în afara dușului." },
  { id: "spaceEfficiency", label: "Eficiență spațiu", description: "Cât de mult spațiu necesită pentru funcționare." },
  { id: "accessibility", label: "Accesibilitate", description: "Cât de ușor se intră și se iese." },
  { id: "maintenance", label: "Întreținere", description: "Frecvența și dificultatea curățării." },
  { id: "cost", label: "Cost relativ", description: "Cost estimativ." },
  { id: "robustness", label: "Robustețe", description: "Rezistența structurală și stabilitatea în timp." },
]

// ── Opțiuni: 3 sisteme reale din catalog.json ──────
// Sursă: catalog.json > products.cabine-dus

export const OPTIONS_BASE = [
  {
    id: "paravan",
    name: "Paravan Fix — deschis, minimalist, fără ușă",
    description:
      "Panou de sticlă securizată 8-10mm, fixat pe perete. Fără ușă, fără profil inferior. " +
      "Intrare walk-in complet deschisă. Opțional: bară de stabilizare orizontală pentru robustețe. " +
      "Catalog GA: paravan fix, cu/fără bară stabilizatoare.",
    pros: [
      "Estetică maximă — spațiu vizual neîntrerupt",
      "Accesibilitate maximă — fără ușă, fără prag",
      "Cel mai simplu de curățat (fără ghidaje sau garnituri)",
      "Costul cel mai redus (fără feronerie de ușă)",
    ],
    cons: [
      "Stropire parțială în afara zonei de duș",
      "Necesită suprafață plană pentru ancorare sigură",
      "Fără barieră termică — dușul poate fi mai rece",
      "Necesită spațiu suficient pentru ca stropii să nu ajungă în restul băii",
    ],
    criteria: {
      aesthetics: 3,
      waterControl: 1,
      spaceEfficiency: 3,
      accessibility: 3,
      maintenance: 3,
      cost: 1,
      robustness: 2,
    },
    bestWhen:
      "Geometrie nișă sau colț, suprafață plană, spațiu generos. Prioritate: estetică și accesibilitate.",
    notRecommendedWhen:
      "Geometrie insulă (stropii ajung peste tot). Spațiu foarte mic. Suprafețe cu denivelări mari.",
    tradeoffs: [
      "Stropirea apei nu este controlată — pardoseala din baie trebuie să fie rezistentă la apă",
      "Fără barieră termică — dușul pierde căldură mai repede",
    ],
  },
  {
    id: "batanta",
    name: "Fix + Ușă Batantă — control apă, acces facil",
    description:
      "Panou fix + ușă batantă 90° cu balamale perete. " +
      "Control complet al stropirii. Deschidere generoasă. " +
      "Catalog GA: fix-batant, balamale perete.",
    pros: [
      "Control maxim al stropirii",
      "Deschidere largă — acces facil",
      "Fără ghidaj inferior — mai ușor de curățat decât glisanta",
      "Compatibil cu nișă și colț",
    ],
    cons: [
      "Necesită spațiu de manevră în fața dușului (approx. 70cm)",
      "Nu funcționează în geometrie insulă (ușa are nevoie de perete)",
      "Balamalele sunt vizibile",
      "Cost moderat (feronerie balamale + mâner)",
    ],
    criteria: {
      aesthetics: 2,
      waterControl: 3,
      spaceEfficiency: 1,
      accessibility: 2,
      maintenance: 2,
      cost: 2,
      robustness: 3,
    },
    bestWhen:
      "Geometrie nișă sau colț, spațiu suficient în față. Prioritate: controlul apei.",
    notRecommendedWhen:
      "Geometrie insulă. Spațiu foarte îngust în fața dușului. Accesibilitate prioritară (ușa batantă necesită manevră).",
    tradeoffs: [
      "Necesită spațiu de manevră — nu merge în băi foarte mici",
      "Balamalele și mânerul adaugă elemente vizibile",
    ],
  },
  {
    id: "culisant",
    name: "Fix + Ușă Glisantă — economie de spațiu, versatilitate maximă",
    description:
      "Panou fix + ușă glisantă pe șină. Economisește spațiu (ușa nu se deschide în afară). " +
      "Disponibil cu cărucioare la vedere sau ascunse (soft-close). " +
      "Singura opțiune viabilă pentru geometrie insulă. " +
      "Catalog GA: culisant-vedere + culisant-sina.",
    pros: [
      "Economie maximă de spațiu — ușa alunecă, nu se deschide",
      "Singura opțiune pentru geometrie insulă",
      "Control bun al stropirii",
      "Variantă soft-close disponibilă (culisant-sina)",
    ],
    cons: [
      "Șina/ghidajul inferior este vizibil și acumulează depuneri",
      "Întreținere mai frecventă (ghidaje, garnituri, cărucioare)",
      "Costul cel mai ridicat (feronerie complexă)",
      "Deschiderea e mai îngustă decât la batantă (o parte e fixă)",
    ],
    criteria: {
      aesthetics: 1,
      waterControl: 3,
      spaceEfficiency: 3,
      accessibility: 2,
      maintenance: 1,
      cost: 3,
      robustness: 2,
    },
    bestWhen:
      "Geometrie insulă. Spațiu foarte îngust. Accesibilitate importantă dar fără spațiu de manevră.",
    notRecommendedWhen:
      "Buget redus (costul e cel mai mare). Întreținere minimă prioritară (ghidajele necesită curățare).",
    tradeoffs: [
      "Ghidajul inferior acumulează calcar și necesită curățare frecventă",
      "Cost mai ridicat decât batanta (feronerie glisantă complexă)",
    ],
  },
]

// ── Parametri secundari (NU aparțin Decision Model-ului) ──
// Aceștia se configurează în etapa următoare (Configurator Legacy / adapter):
//
//   Tip sticlă:        8mm / 10mm (44/65 RON/mp)
//   Finisaj sticlă:    clară / parsol gri / parsol bronze / satinată
//   Tratament:         ENDURO-Shield (64 RON/mp)
//   Finisaj feronerie: inox lucios / negru mat / inox satinat / auriu lucios / auriu satinat
//   Accesorii:         port prosop (26 RON), mâner scoică (13 RON), mâner rectangular (81 RON)
//   Bară stabilizare:  da / nu (doar pentru paravan fix)
//
// Sursă: catalog.json > products.cabine-dus
