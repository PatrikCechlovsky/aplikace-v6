# 🏠 Pronajímatel v6
Moderní modulární aplikace pro správu nemovitostí, jednotek, nájemníků, smluv, plateb, dokumentů a komunikace.  
Postaveno na **Next.js 14**, **Supabase**, a vlastním **6-sekčním UI frameworku**.

---

## 🚀 Funkce

- Správa nemovitostí a jednotek  
- Správa nájemníků a smluv  
- Přehled plateb (plánované vs. skutečné)  
- Evidence služeb a měřidel  
- Modul dokumentů (PDF, přílohy)  
- Modul komunikace (e-maily, historie)  
- Plně modulární architektura  
- Autentizace přes Supabase + RLS  
- Dynamický Sidebar a CommonActions  
- Podpora světlého/tmavého režimu  

---

## 📁 Struktura projektu

```
/app/
  /UI/              – globální UI komponenty
  /modules/         – modulární systém (dlaždice, formuláře, přehledy)
  /auth/            – přihlášení a session

/docs/              – hlavní dokumentace 01–10
/docs/archive/      – archiv historických poznámek

/supabase/
  migrations/       – SQL migrace (DB verze)
  seeds/            – startovní data

public/             – statické soubory
```

---

## 📚 Dokumentace

Kompletní systém dokumentace se nachází ve složce **/docs/**  
a je rozdělen do 10 základních kapitol:

| Číslo | Soubor | Popis |
|-------|--------|--------|
| 01 | Executive Summary | Shrnutí projektu |
| 02 | Architecture | Architektura aplikace |
| 03 | UI System | 6-sekční UI, komponenty, workflow |
| 04 | Modules | Modulární systém aplikace |
| 05 | Auth & RLS | Supabase autentizace + zabezpečení |
| 06 | Data Model | Datový model + RLS schéma |
| 07 | Deployment | Nasazení Vercel + Supabase |
| 08 | Plan vývoje | Roadmapa projektu |
| 09 | Project Rules | Pravidla projektu |
| 10 | Glossary | Slovník pojmů |

Každý dokument obsahuje:  
**A = finální obsah**, **B = historické části**, **C = archiv (samostatný soubor)**.

---

## 🛠 Instalace a spuštění

### 1. Klonování repa
```bash
git clone https://github.com/...
cd aplikace-v6
```

### 2. Instalace závislostí
```bash
npm install
```

### 3. Přidání `.env.local`
Nutné proměnné (minimální):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APP_BASE_URL=http://localhost:3000
```

### 4. Lokální spuštění
```bash
npm run dev
```

Aplikace poběží na:  
http://localhost:3000

---

## 🔐 Bezpečnost

- RLS je aktivní na všech tabulkách  
- SERVICE_ROLE_KEY nesmí nikdy na frontend  
- žádné credentials v repozitáři  
- všechny citlivé hodnoty pouze v `.env.local` nebo Vercel ENV  

---

## 🌐 Deployment

Produkční prostředí běží na:

- **Vercel** (Next.js Application Hosting)  
- **Supabase** (DB + Auth + Storage + RLS)  

Podrobný návod → `/docs/07-deployment.md`

---

## 🔄 Verzování

Používáme:

- **git flow** (`main`, `feature/*`)  
- **semantic versioning** (`major.minor.patch`)  
- verzované SQL migrace (`/supabase/migrations/`)  

---

## 🤝 Pravidla projektu

Vývoj se řídí závazným dokumentem:  
`/docs/09-project-rules.md`

Obsahuje:

- Naming conventions  
- Struktura repozitáře  
- UI/UX standardy  
- Modulární pravidla  
- Git workflow  
- Dokumentační pravidla  

---

## 🗂 Archiv

Veškerý starší obsah přesunutý z README  
je uložen v `/docs/archive/`  
pod vlastním souborem.

Nic se nemaže, vše se archivuje podle pravidel projektu.

---

## 📌 Závěr

Tento projekt má jasnou strukturu, dokumentaci, pravidla i roadmapu.  
README slouží jako přehledný vstupní bod, zatímco detailní informace jsou uloženy ve `/docs/01–10`.

