# GLAZEO — After Action Report: Validation Sessions

> **Regulă:** Observațiile individuale nu decid direcția. Doar pattern-urile repetate.

---

## 1. Structura raportului

După toate sesiunile, raportul răspunde la **3 întrebări**, nu 30.

### Întrebarea 1: Unde se blochează utilizatorii?

Pattern-uri observate la minimum 3 participanți:

| Pattern | Participanți afectați | Severitate |
|---|---|---|
| | P-__, P-__, P-__ | ☐ Blocant ☐ Important ☐ Minor |
| | P-__, P-__, P-__ | ☐ Blocant ☐ Important ☐ Minor |

### Întrebarea 2: Recomandarea este credibilă?

| Semnal | DA (câți) | PARȚIAL (câți) | NU (câți) |
|---|---|---|---|
| Acceptă recomandarea fără îndoială | | | |
| Ar folosi Decision Record-ul | | | |
| Ar folosi GLAZEO din nou | | | |

### Întrebarea 3: Ce schimbăm?

| Prioritate | Ce | Bazat pe | Acțiune |
|---|---|---|---|
| **Acum** (blocant) | | P-__, P-__, P-__ | |
| **Curând** (important) | | P-__, P-__ | |
| **Mai târziu** (nice-to-have) | | P-__ | |

---

## 2. Reguli de sinteză

### Un singur participant = o observație, nu o concluzie

Dacă un singur utilizator spune ceva, **nu** este un pattern. Este o notă.

### Trei participanți independenți = un semnal

Același comportament la 3 utilizatori din profiluri diferite → probabil o problemă reală.

### Nu repara ce nu s-a spart

Dacă niciun utilizator nu menționează o problemă pe care tu o suspectai → nu este o problemă reală (încă).

### Observațiile pozitive contează la fel de mult

Dacă 4 din 5 utilizatori spun „asta e clar" → nu modifica acea parte. Este validată.

---

## 3. Decizia post-validare

Pe baza raportului, **o singură direcție** este aleasă:

| Dacă utilizatorii... | Atunci următorul vertical slice este... |
|---|---|
| Abandonează și vor să revină | **Resume sessions** |
| Vor să trimită decizia altcuiva | **Multi-role / sharing** |
| Nu au încredere în recomandare | **Îmbunătățește engine-ele și explicațiile** |
| Fluxul e clar, record-ul e valoros | **Scalează distribuția și onboarding-ul** |

---

## 4. Ce NU intră în AAR

- „Ar fi frumos să avem și..." (fără pattern)
- „Un utilizator a spus că..." (fără confirmare de la alții)
- „Mie personal mi se pare că..." (nu e vorba despre tine)
- „În viitor am putea..." (nu acum — arhitectura e înghețată)

---

## 5. Template de completare

### 5.1 Rezumat per participant

| Cod | Profil | DM | Durată | Blocaje | Recomandare credibilă? | Ar folosi din nou? |
|---|---|---|---|---|---|---|
| P-01 | | | | | ☐ Da ☐ Parțial ☐ Nu | ☐ Da ☐ Poate ☐ Nu |
| P-02 | | | | | ☐ Da ☐ Parțial ☐ Nu | ☐ Da ☐ Poate ☐ Nu |
| P-03 | | | | | ☐ Da ☐ Parțial ☐ Nu | ☐ Da ☐ Poate ☐ Nu |
| P-04 | | | | | ☐ Da ☐ Parțial ☐ Nu | ☐ Da ☐ Poate ☐ Nu |
| P-05 | | | | | ☐ Da ☐ Parțial ☐ Nu | ☐ Da ☐ Poate ☐ Nu |

### 5.2 Pattern-uri transversale

| Pattern | Frecvență | Gravitate | Recomandare |
|---|---|---|---|
| | / 5 | ☐ Blocant ☐ Important ☐ Minor | |
| | / 5 | ☐ Blocant ☐ Important ☐ Minor | |
| | / 5 | ☐ Blocant ☐ Important ☐ Minor | |

### 5.3 Decizie

> Pe baza sesiunilor de validare din [data], următorul vertical slice este:
>
> **[Alege una]**
>
> Motiv: ______________

---

## 6. Etică

- Toate observațiile sunt anonimizate (cod P-01, nu nume).
- Raportul nu conține informații personale.
- Datele brute (template-urile individuale) nu se partajează.
