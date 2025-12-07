# /docs/02-architecture.md
## Popis: Tento dokument obsahuje architekturu aplikace, strukturu systému, používané technologie a technické principy.
---

# 02 – Architektura aplikace
*(původní obsah zachován; nové bloky jsou přidány níže)*

---

# 0. Cíl aplikace

Aplikace Pronajímatel v6 slouží ke správě:
- nemovitostí  
- jednotek  
- nájemníků  
- smluv  
- plateb  
- služeb  
- dokumentů  
- komunikace  

Postaveno na:
- Next.js 14 (App Router)
- Supabase Auth + DB + RLS
- Modulárním UI frameworku
- Striktně definovaném 6-sekčním layoutu

---

# 1. Architektura UI – 6 sekční layout

Celá aplikace pracuje s jednotným rozložením:

```
┌───────────────────────────────────────────────────────────────┐
│ 1–2: Sidebar (HomeButton + dynamické moduly)                  │
├──────────────┬───────────────────────────────────────────────┤
│              │ 3: Horní lišta                                 │
│ Sidebar      │    • Breadcrumbs vlevo                         │
│ (left)       │    • HomeActions vpravo                        │
│              ├───────────────────────────────────────────────┤
│              │ 4: CommonActions — lišta obecných akcí         │
│              ├───────────────────────────────────────────────┤
│              │ 5: Content — přehled / detail / formulář       │
└──────────────┴───────────────────────────────────────────────┘
```

### Stav implementace layoutu

| Sekce          | Stav      |
|----------------|-----------|
| Sidebar        | ✔ Hotovo  |
| HomeButton     | ✔ Hotovo  |
| Breadcrumbs    | ✔ Základní verze |
| HomeActions    | ✔ DisplayName, ikonky, logout |
| CommonActions  | ✔ Verze v1 (pevná), připravená na dynamiku |
| Content Engine | ✔ Základní rendering |

---

# 2. Technologie aplikace
*(doplněno z PREHLED-APLIKACE.md)*

Aplikace je postavena na moderním technologickém stacku:

| Technologie | Použití |
|-------------|---------|
| **Next.js 14** | serverové komponenty, routing, optimální rendering |
| **React 18** | UI systém, komponenty |
| **TypeScript** | statická kontrola typů |
| **Supabase Auth** | přihlášení, registrace, session |
| **Supabase Database (PostgreSQL + RLS)** | persistentní data |
| **Supabase Storage** | dokumenty, přílohy |
| **Vercel** | deployment, CI/CD |
| **CSS / Tailwind / vlastní styl** | vzhled UI |

Všechny technologie jsou plně kompatibilní s modulárním systémem aplikace.

---

# 3. Struktura projektu (ROOT, APP, DOCS)
*(zcela doplněno z PREHLED-APLIKACE.md)*

```
/
├── .env.local
├── .git/
├── LICENSE
├── README.md
├── ikons.md
├── next.config.mjs
├── package.json
├── tsconfig.json
│
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── modules.index.js
│   ├── modules/
│   │   ├── 040-nemovitosti/
│   │   ├── 050-jednotky/
│   │   ├── 090-finance/
│   │   ├── 900-nastaveni/
│   │   └── ...
│   └── UI/
│       ├── HomeButton.tsx
│       ├── Sidebar.tsx
│       ├── Breadcrumbs.tsx
│       ├── HomeActions.tsx
│       ├── CommonActions.tsx
│       └── ...
│
└── docs/
    ├── 01-executive-summary.md
    ├── 02-architecture.md
    ├── 03-ui-system.md
    ├── 04-modules.md
    ├── 05-auth-rls.md
    ├── 06-data-model.md
    ├── 07-deployment.md
    ├── 08-plan-vyvoje.md
    ├── 09-project-rules.md
    ├── 10-glossary.md
    └── stav-struktury.md
```

Tato struktura se bude dále rozšiřovat o:

- `/services/` – (plánováno) service layer pro logiku mimo UI  
- `/supabase/` – generované migrace a SQL (po budoucí standardizaci)  

---

# 4. Autentizace – architektura

*(původní text zachován, doplněny detaily)*

Aplikace pracuje se stavem uživatele:

```ts
type SessionUser = {
  email: string | null
  displayName?: string | null
}
```

DisplayName se načítá z:

1. `session.user.user_metadata.display_name`  
2. `full_name`  
3. `name`  
4. `email`  
5. fallback „Uživatel“

### Architektura Auth toku

- klientská komponenta volá **Supabase Auth**  
- serverová komponenta čte **cookies a session**  
- při změně stavu běží `onAuthStateChange`  
- AppShell reaguje a přesměruje na login nebo dashboard  

> Detailní RLS a datové bezpečnostní zásady jsou v `05-auth-rls.md`.

---

# 5. Modulární systém a moduly
*(rozšířeno a systematizováno)*

Každý modul se nachází v:

```
app/modules/<id>-<název>/
```

Složení modulu:

```
module.config.js
overview/
forms/
tiles/
```

### module.config.js obsahuje:

```js
{
  id: "040-nemovitosti",
  label: "Nemovitosti",
  icon: "building",
  order: 40,
  enabled: true,
  // v2:
  // commonActions: { overview: [...], detail: [...], form: [...] }
}
```

### Modul Loader
- moduly se nenačítají staticky  
- Sidebar využívá registr modulů `MODULE_SOURCES`  
- moduly se setřídí podle `order`

Více v `docs/04-modules.md`.

---

# 6. Pravidla architektury a kódu (CODESTYLE pohledem systému)

*(původní text zachován a doplněn)*

- komponenty v `app/UI/` jsou **čisté UI**  
- komponenty v `app/modules/` obsahují **business logiku** modulu  
- názvy komponent → **PascalCase**  
- props a proměnné → **camelCase**  
- event handlery → `handleXxx` a `onXxx`  
- **Žádné funkce uvnitř JSX**  
- Ikony se získávají přes:

```
getIcon('name')
```

Podrobná pravidla → `docs/CODESTYLE.md` a `docs/09-project-rules.md`.

---

# 7. Další architektonické části (doplněno z PREHLED-APLIKACE.md)

## 7.1 Systém CommonActions

Aplikace používá **centrální sadu tlačítek akcí**:

```
add, edit, view, duplicate, attach,
archive, delete,
save, saveAndClose, cancel
```

Verze 2 (plán):
- akce definované v `module.config.js`
- limitace podle role
- limitace podle výběru položky
- limitace podle stavu formuláře (dirty/clean)

---

## 7.2 Systém Breadcrumbs

- verze 1: statické  
- verze 2: dynamické  
- breadcrumb builder se bude odvozovat z:  
  - aktivního modulu  
  - aktivní dlaždice / detailu  
  - aktivního formuláře  

---

## 7.3 Systém Form Engine

Plánované vlastnosti:

- centrální konfigurace polí  
- validace na jednom místě  
- jednotný layout formulářů  
- definice sekcí / tabs  

---

# 8. Stav implementace – architektonické oblasti

| Oblast                                   | Stav                            |
|------------------------------------------|---------------------------------|
| Základní layout                          | ✔ Hotovo                        |
| Sidebar engine                           | ✔ Hotovo                        |
| HomeButton                               | ✔ Hotovo                        |
| Breadcrumbs                              | ✔ Základ (dynamický builder čeká) |
| HomeActions                              | ✔ Hotovo                        |
| CommonActions                            | ✔ Verze 1 / ⏳ Verze 2           |
| FormEngine                               | ⏳ Příprava                      |
| Role & Permissions                       | ⏳ Architektura navržena         |
| Modul Dokumenty                          | ⏳ Rozpracováno                  |
| Modul Komunikace                         | ⏳ Rozpracováno                  |
| Modul Platby                             | ⏳ Rozpracováno                  |

---

# 9. TODO – architektura a systém

*(zachován původní text + doplněno)*

### Nejbližší úkoly
- propojit CommonActions s module.config.js  
- definovat akce podle typu pohledu  
- zavést role & permission systém  
- vytvořit dynamické breadcrumbs  
- přidat stav `requiresSelection` a `requiresDirty`  

### Střednědobé úkoly
- rozšíření modulů (Služby, Komunikace, Dokumenty)  
- sjednocení formulářových komponent  
- agregace dat v modulech  

### Dlouhodobé úkoly
- plná automatizace dokumentů  
- notifikační centrum  
- multi-tenant režim  
- workflow engine  

---

# 10. Závěr

Tento dokument poskytuje přehled architektury v6:

- layout  
- moduly  
- technologie  
- autentizační tok  
- systémové principy  
- TODO pro budoucí verze  

Je jedním z klíčových dokumentů pro vývoj celého systému.

