// ══════════════════════════════════════════════
// GLAZEO — DM-003 Data (Fațadă — strategie de vitrare)
// 5 questions, 7 criteria, solar rules with constraint/preference separation.
// ══════════════════════════════════════════════

export type Orientation = "south" | "east_west" | "north"
export type SurfaceArea = "under_100" | "100_500" | "over_500"
export type ThermalPerformance = "standard" | "high" | "passive"
export type SolarControl = "moderate" | "high" | "maximum"
export type FacadeSystem = "stick" | "unitized" | "semi_unitized" | "unknown"

export interface DM003Context {
  orientation: Orientation
  surfaceArea: SurfaceArea
  thermalPerformance: ThermalPerformance
  solarControl: SolarControl
  facadeSystem: FacadeSystem
}

export const CONTEXT_QUESTIONS = [
  {
    id: "orientation" as const,
    question: "Care este orientarea principală a fațadei?",
    whyItMatters: "Determină încărcarea solară și necesarul de control termic.",
    options: [
      { value: "south" as const, label: "Sud (cald, soare direct)" },
      { value: "east_west" as const, label: "Est-Vest (moderat)" },
      { value: "north" as const, label: "Nord (rece, puțin soare)" },
    ],
  },
  {
    id: "surfaceArea" as const,
    question: "Care este suprafața vitrată estimată?",
    whyItMatters: "Modulele mari limitează opțiunile de greutate și dimensiune.",
    options: [
      { value: "under_100" as const, label: "< 100 m² (clădire mică)" },
      { value: "100_500" as const, label: "100–500 m² (medie)" },
      { value: "over_500" as const, label: "> 500 m² (turn de birouri)" },
    ],
  },
  {
    id: "thermalPerformance" as const,
    question: "Ce nivel de performanță termică ai nevoie?",
    whyItMatters: "Determină tipul de sticlă (double/triple) și coating-ul.",
    options: [
      { value: "standard" as const, label: "Standard (Ug 1.1–1.4)" },
      { value: "high" as const, label: "Ridicat (Ug 0.7–1.0)" },
      { value: "passive" as const, label: "Pasiv (Ug < 0.7)" },
    ],
  },
  {
    id: "solarControl" as const,
    question: "Cât de mult control solar ai nevoie?",
    whyItMatters: "Determină g-value-ul și tipul de coating solar. Mai mic = mai multă protecție.",
    options: [
      { value: "moderate" as const, label: "Moderat (protecție de bază, g < 0.5)" },
      { value: "high" as const, label: "Ridicat (protecție semnificativă, g < 0.35)" },
      { value: "maximum" as const, label: "Maxim (protecție maximă, g < 0.25)" },
    ],
  },
  {
    id: "facadeSystem" as const,
    question: "Ce sistem de fațadă folosești?",
    whyItMatters: "Stick, unitized sau semi-unitized — fiecare are restricții de greutate și modul.",
    options: [
      { value: "stick" as const, label: "Stick (montat pe șantier)" },
      { value: "unitized" as const, label: "Unitized (module prefabricate)" },
      { value: "semi_unitized" as const, label: "Semi-unitized" },
      { value: "unknown" as const, label: "Necunoscut" },
    ],
  },
]

export const COMPARISON_CRITERIA = [
  { id: "transparency", label: "Transparență", description: "Câtă lumină naturală transmite." },
  { id: "solarControl", label: "Control solar", description: "Cât de bine blochează căldura solară (g-value)." },
  { id: "thermalPerformance", label: "Performanță termică", description: "Izolație termică (Ug)." },
  { id: "weight", label: "Greutate", description: "Impact asupra structurii și sistemului de fațadă." },
  { id: "cost", label: "Cost relativ", description: "Cost estimativ: redus, mediu sau ridicat." },
  { id: "compatibility", label: "Compatibilitate sistem", description: "Cât de ușor se integrează cu sistemele de fațadă." },
  { id: "colorNeutrality", label: "Neutralitate cromatică", description: "Cât de naturală e redarea culorilor." },
]

export const OPTIONS_BASE = [
  {
    id: "transparency_first",
    name: "Transparență maximă — vitraj clar, coating solar ușor",
    description: "Double glazing cu low-e coating, sticlă low-iron. Ideal pentru fațade unde lumina naturală și vederea sunt prioritare.",
    pros: ["Lumină naturală maximă", "Neutralitate cromatică", "Cost moderat", "Compatibil cu majoritatea sistemelor"],
    cons: ["Control solar limitat — nu blochează suficient pentru sud", "Performanță termică sub standardele passive"],
    criteria: { transparency: 3, solarControl: 1, thermalPerformance: 2, weight: 3, cost: 2, compatibility: 3, colorNeutrality: 3 },
    bestWhen: "Orientare nordică sau est-vest. Suprafețe < 500 m². Control solar moderat e suficient.",
    notRecommendedWhen: "Fațade sudice cu cerințe maxime de control solar. Standarde pasive (Ug > 0.7).",
    tradeoffs: ["Mai puțină izolare termică", "Încălzire solară semnificativă vara (sud)"],
  },
  {
    id: "balanced_solar",
    name: "Echilibru — double glazing solar-control, coating selectiv",
    description: "Double glazing cu coating solar-control selectiv (transmite lumină, reflectă căldură). Echilibru bun lumină/căldură.",
    pros: ["Echilibru bun lumină/căldură", "Confort termic ridicat vara", "Cost acceptabil"],
    cons: ["Ușor mai întunecat decât varianta A", "Nu atinge standardele passive"],
    criteria: { transparency: 2, solarControl: 3, thermalPerformance: 2, weight: 2, cost: 2, compatibility: 3, colorNeutrality: 2 },
    bestWhen: "Orientare sudică, suprafețe mari. Cerință solară semnificativă fără a sacrifica total transparența.",
    notRecommendedWhen: "Standarde pasive (Ug > 0.7). Control solar maxim necesar.",
    tradeoffs: ["Transparență ușor redusă (~60-70% vs 80%+ la A)"],
  },
  {
    id: "max_performance",
    name: "Performanță maximă — triple glazing, coating solar intens",
    description: "Triple glazing cu coating solar-control avansat. Ideal pentru clădiri pasive sau fațade sudice cu cerințe maxime.",
    pros: ["Performanță termică maximă", "Control solar superior", "Conformitate Passivhaus"],
    cons: ["Greutate mare — incompatibil cu stick ușor", "Transmisie luminoasă redusă (50-60%)", "Cost ridicat"],
    criteria: { transparency: 1, solarControl: 3, thermalPerformance: 3, weight: 1, cost: 3, compatibility: 2, colorNeutrality: 2 },
    bestWhen: "Clădiri pasive, fațade sudice, suprafețe > 500 m² unde performanța justifică costul.",
    notRecommendedWhen: "Sistem stick cu module mici (greutatea depășește capacitatea).",
    tradeoffs: ["Transparență semnificativ redusă", "Greutate ridicată (triple > double)", "Cost cu 30-40% peste A"],
  },
]
