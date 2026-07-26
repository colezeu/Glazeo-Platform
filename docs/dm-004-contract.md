# DM-004 Contract: Cabină de duș walk-in

> **Status:** Contract for implementation
> **ID intern:** `walk_in_shower`
> **Obiectiv:** Validare că extensibilitatea domeniului și persistența sunt independente.

---

## 1. Intenție

**Denumire UI:** „Cabină de duș walk-in"

**Întrebarea inițială:**
> „Ai nevoie de o cabină de duș din sticlă?"

**Context necesar:**

| # | Întrebare | De ce contează | Tip răspuns |
|---|---|---|---|
| Q1 | „Care este geometria spațiului?" | Determină tipul de închidere și dimensiunea minimă | „Nișă (3 pereți)" / „Colț (2 pereți)" / „Insulă (1 perete)" |
| Q2 | „Ce tip de acces preferi?" | Walk-in total (fără ușă) vs. ușă parțială pentru controlul apei | „Walk-in complet (fără ușă)" / „Cu ușă batantă" / „Cu ușă glisantă" |
| Q3 | „Care sunt condițiile pereților și pardoselii?" | Denivelări sau neregularități → profil de compensare sau stabilizator | „Suprafețe plane și finisate" / „Denivelări sau neregularități" / „Necunoscut" |
| Q4 | „Cât de importantă este accesibilitatea?" | Soluțiile frameless pot necesita prag sau spațiu minim de manevră | „Standard (fără cerințe speciale)" / „Accesibil (mobilitate redusă)" |
| Q5 | „Ce nivel de întreținere accepți?" | Sticla frameless necesită tratament anti-calcificare și curățare frecventă | „Minimă (tratament hidrofob inclus)" / „Normală (curățare periodică)" / „Nicio preferință" |

**Problemă reală:**
Arhitecții și proprietarii intră cu „duș walk-in, sticlă transparentă, fără profil." Problema reală este **echilibrul între estetică, funcționalitate și întreținere** — un duș trebuie să arate impecabil, să nu inunde baia și să fie ușor de păstrat curat, trei obiective adesea în tensiune.

---

## 2. Cele trei opțiuni

### Opțiunea A — Panou fix frameless (estetică pură)

| Atribut | Valoare |
|---|---|
| **Nume** | „Frameless — panou fix, sticlă aparent liberă" |
| **Descriere** | Panou de sticlă securizată 10mm, fixat prin puncte discrete în perete și pardoseală. Fără profil inferior vizibil. Tratament hidrofob opțional. |
| **Avantaje** | Estetică maximă, spațiu vizual neîntrerupt. Ușor de integrat în orice design. |
| **Limite** | Fără ușă → stropire parțială în afara zonei de duș. Necesită suprafețe perfect plane. Întreținere frecventă. |
| **Cel mai potrivit când** | Geometrie nișă, suprafețe plane, walk-in complet, prioritate estetică. |
| **Compromisuri** | Stropirea apei nu este complet controlată. Necesită tratament anti-calcificare. |

### Opțiunea B — Panou fix cu stabilizator (robustețe)

| Atribut | Valoare |
|---|---|
| **Nume** | „Stabilizat — panou fix cu bară de susținere" |
| **Descriere** | Panou de sticlă + bară orizontală de stabilizare (inox sau aluminiu) între pereți. Reduce vibrațiile și oferă punct de prindere suplimentar. |
| **Avantaje** | Mai robust decât frameless pur. Compensează denivelări minore. Bara poate servi drept suport pentru prosoape. |
| **Limite** | Bara de stabilizare este vizibilă. Mai puțin minimalist. Necesită 2 pereți opuși. |
| **Cel mai potrivit când** | Geometrie nișă sau colț, denivelări prezente, trafic frecvent. |
| **Compromisuri** | Estetică ușor compromisă de bara vizibilă. Nu rezolvă complet problema stropirii. |

### Opțiunea C — Închidere parțială cu ușă (funcționalitate)

| Atribut | Valoare |
|---|---|
| **Nume** | „Funcțional — panou fix + ușă glisantă sau batantă" |
| **Descriere** | Panou fix + ușă din sticlă (glisantă sau batantă). Control complet al apei. Profil minim necesar pentru ghidajul ușii. |
| **Avantaje** | Control maxim al stropirii. Potrivit pentru toate geometriile. Accesibilitate bună (ușă glisantă). |
| **Limite** | Profil vizibil pentru ghidaj. Cost mai mare. Întreținere moderată (ghidaje, garnituri). |
| **Cel mai potrivit când** | Geometrie insulă, accesibilitate necesară, control maxim al apei. |
| **Compromisuri** | Profilul de ghidaj rupe estetica frameless. Garniturile necesită înlocuire periodică. |

---

## 3. Criterii de comparație

| Criteriu | Opțiunea A | Opțiunea B | Opțiunea C |
|---|---|---|---|
| **Estetică** | ⬤⬤⬤ Maximă | ⬤⬤ Medie | ⬤ Funcțională |
| **Control apă** | ⬤ Parțial | ⬤ Parțial | ⬤⬤⬤ Complet |
| **Robustețe** | ⬤⬤ Standard | ⬤⬤⬤ Ridicată | ⬤⬤⬤ Maximă |
| **Accesibilitate** | ⬤⬤ Standard | ⬤⬤ Standard | ⬤⬤⬤ Bună |
| **Întreținere** | ⬤ Frecventă | ⬤⬤ Moderată | ⬤⬤ Moderată |
| **Cost relativ** | ⬤⬤ Mediu | ⬤⬤ Mediu | ⬤⬤⬤ Ridicat |
| **Toleranță denivelări** | ⬤ Redusă | ⬤⬤⬤ Ridicată | ⬤⬤ Moderată |

---

## 4. Reguli de recomandare / respingere

### Opțiunea A — Recomandată când:
- Q1 = „Nișă"
- Q2 = „Walk-in complet"
- Q3 = „Suprafețe plane"
- **Respinsă când:** Q2 = „Cu ușă glisantă" (incompatibilitate) **SAU** Q3 = „Denivelări" (ancorare nesigură)

### Opțiunea B — Recomandată când:
- Q1 ≠ „Insulă" (necesită 2 pereți opuși)
- Q3 = „Denivelări"
- Q2 = „Walk-in complet"
- **Respinsă când:** Q1 = „Insulă" (nu există 2 pereți opuși pentru bară)

### Opțiunea C — Recomandată când:
- Q2 = „Cu ușă batantă" sau „Cu ușă glisantă"
- Q4 = „Accesibil"
- Q1 = „Insulă" (singura opțiune viabilă)
- **Respinsă când:** nicio condiție clară de respingere — este opțiunea cea mai flexibilă

---

## 5. Structura Decision Record

```typescript
interface DecisionRecord {
  id: string
  decidedAt: string
  intent: { type: "walk_in_shower"; label: "Cabină de duș walk-in" }
  context: {
    geometry: "niche" | "corner" | "island"
    accessType: "walk_in" | "hinged_door" | "sliding_door"
    surfaceCondition: "flat" | "uneven" | "unknown"
    accessibility: "standard" | "accessible"
    maintenance: "minimal" | "normal" | "no_preference"
  }
  options: { ... }[]
  selectedOptionId: string
  acceptedTradeoffs: { description: string; whyAccepted: string }[]
  lessons: string[]
  nextSteps: string[]
}
```

---

## 6. Ce testează DM-004 față de primele trei

| Dimensiune | DM-001/002/003 | DM-004 |
|---|---|---|
| Domeniu | Tehnic (acustică, structură, termic) | **Estetic și funcțional** |
| Întrebări | 4-5 | **5** |
| Criterii | 6-7 | **7** |
| Opțiuni | 3 | 3 |
| Schema DB | Neschimbată | **Neschimbată** |
| Repository | Neschimbat | **Neschimbat** |
| DecisionWorkspace | Neschimbat | **Neschimbat** |

---

## 7. Ce NU intră

- Preț, ofertă, comandă, configurator
- Oblio, BIM, CAD
- Produse specifice (grosimi, feronerie, mărci)
- Supabase, migrare schemă
