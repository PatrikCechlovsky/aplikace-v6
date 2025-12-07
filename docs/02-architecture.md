# 02 – Architektura aplikace

## 0. Cíl aplikace

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

## 1. Architektura UI – 6 sekční layout

Celá aplikace pracuje s jednotným rozložením:

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

## 2. Autentizace – Supabase Auth (architektonický pohled)

Aplikace pracuje se stavem uživatele:

    type SessionUser = {
      email: string | null
      displayName?: string | null
    }

DisplayName se načítá z:
- session.user.user_metadata.display_name
- fallback full_name
- fallback name
- fallback email
- fallback "Uživatel"

Funkční logika:
- getCurrentSession() načte session při startu aplikace
- onAuthStateChange() detekuje login/logout
- HomeActions zobrazují displayName + ikony + odhlášení
- nepřihlášený uživatel vidí pouze login panel

Detailní rozpis logiky autentizace bude v dokumentu `05-auth-rls.md`.

---

## 3. Modulární systém a struktura modulů

Každý modul má strukturu:

    app/modules/<id>-<nazev>/
      module.config.js
      tiles/
      forms/
      overview/

Příklad konfigurace modulu:

    {
      id: '040-nemovitosti',
      label: 'Nemovitosti',
      icon: 'building',
      order: 40,
      enabled: true
      // budoucí rozšíření:
      // commonActions: { overview: [...], detail: [...], form: [...] }
    }

Dynamické načítání modulů:
- Sidebar automaticky načítá moduly z registry (modules.index.js / MODULE_SOURCES)
- odfiltruje moduly s enabled === false
- seřadí podle order
- UI nikdy neimportuje moduly napřímo, vždy přes modulový loader

Detailní popis jednotlivých modulů bude v dokumentu `04-modules.md`.

---

## 4. Základní pravidla (CODESTYLE z pohledu architektury)

Obecně:
- komponenty v `app/UI/` jsou malé, znovupoužitelné
- moduly v `app/modules/` obsahují business logiku
- názvy komponent: PascalCase
- názvy props / proměnných: camelCase
- event handlery: `onXxx`, interně `handleXxx`
- žádné hooky nebo funkce uvnitř JSX — vždy nad `return`
- všechny ikony přes `getIcon(name)`

Detailní CODESTYLE je rozveden v dokumentu `CODESTYLE.md` nebo `09-project-rules.md`.

---

## 5. Stav implementace (architektonický přehled)

| Oblast                                   | Stav                            |
|------------------------------------------|---------------------------------|
| Základní layout                          | ✔ Hotovo                        |
| Sidebar engine                           | ✔ Hotovo                        |
| HomeButton                               | ✔ Hotovo                        |
| Breadcrumbs                              | ✔ Hotovo (zatím statické)      |
| HomeActions                              | ✔ DisplayName + ikony + logout |
| CommonActions                            | ✔ Verze 1 (pevné), ⏳ Verze 2   |
| Dynamické akce podle modulů             | ⏳ Plán                         |
| Role & oprávnění                        | ⏳ Plán                         |
| Form engine (základ)                    | ✔ Základ                        |
| Moduly Dokumenty / Komunikace / Služby | ⏳ V přípravě                   |

---

## 6. TODO – architektura a systém

### Nejbližší úkoly
- propojit CommonActions s module.config.js  
- přidat definici akcí pro každý formulář / dlaždici  
- zavést role & permission systém  
- dynamické breadcrumbs  
- stav výběru v přehledech (requiresSelection)  
- dirty state formuláře (requiresDirty)  

### Střednědobé úkoly
- rozšíření modulů (Služby, Komunikace, Dokumenty)
- vylepšení dashboardu
- přidání univerzálního Form Engine

### Dlouhodobé úkoly
- notifikační centrum
- automatické generování dokumentů
- e-mailové šablony

---

## 7. Závěr

Tento dokument popisuje architekturu aplikace Pronajímatel v6:

- cíle systému  
- 6-sekční layout  
- modulární architekturu  
- základní pravidla kódu  
- stav implementace a TODO  

Slouží jako referenční rámec pro další vývoj a rozšiřování.
