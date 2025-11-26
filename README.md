# 🏠 Pronajímatel v6 – SaaS aplikace pro správu nájemního portfolia

## 🎨 Ikony v aplikaci

Veškeré použité ikony jsou uvedeny a popsány v souboru [`ICONS.md`](./ICONS.md). Tento soubor slouží jako jediný zdroj pro výběr a správu ikon v celé aplikaci.


Tato aplikace je novou verzí systému pro správu pronájmů a nájemních vztahů (verze 6), přepsanou do čisté, konzistentní struktury s důrazem na UX, responzivní design a víceklientskou architekturu (multi-tenant SaaS).

## 💡 Cíle verze v6:
- Unifikovaný UI/UX layout s pevně danými bloky (sidebar, přehledy, hlavní karta, vazby).
- Plně responzivní zobrazení (mobil + desktop).
- Každý modul má stejnou strukturu (přehled → detail → záložky → vazby).
- Backend je postaven nad Supabase s podporou RLS (Row Level Security).
- Frontend v Next.js (App Router) + Tailwind CSS.

📘 Více o návrhu rozhraní najdeš v [`docs/UI-specifikace.md`](docs/UI-specifikace.md)

# Architektura projektu – Aplikace v6 (Pronajímatel)

Používáme záměrně kombinaci **TSX + TS + JS**, protože je to pro tento typ aplikace nejpřehlednější:

- **UI = TSX (React komponenty)**  
  - všechny vizuální komponenty (Sidebar, Tabs, DetailView, ListView, formuláře…)
  - umístění: `src/app/UI/*.tsx` a `src/app/page.tsx` apod.

- **Config = JS (konfigurační soubory, metadata)**  
  - konfigurace modulů, definice přehledů, formulářů, tiles, vazeb
  - umístění: `src/app/modules/**/module.config.js`, `src/app/modules.index.js`
  - důvod: snadno se edituje, přehledné, dá se rychle měnit bez zásahu do typů

- **Logika (Supabase, services) = TS (TypeScript)**  
  - datové služby, přístup do db, helper funkce
  - umístění: např. `src/app/lib/*.ts`, `src/app/services/*.ts`

- **Moduly = JS (metadata modulů)**  
  - každý modul má svoji složku a v ní `module.config.js`
  - tyto configy popisují modul: `id`, `order`, `label`, `icon`, později `forms`, `tiles`, `actions`, `tabs`…

### Proč tento mix:

❤️ To není chyba – to je dokonce **best practice pro konfigurační architekturu**:

- UI komponenty v TSX = moderní, bezpečné, dobře typované
- Config a moduly v JS = jednoduché, přehledné, snadno upravitelné
- Logika v TS = TypeScript nám pomůže chytat chyby v práci s daty
- Nemícháme logiku, konfiguraci a UI v jednom souboru

**Výhoda:**

- neztratíš se,
- modulový systém máš jednoduchý,
- UI je moderní,
- TS ti pomůže, JS tě nezdrží,
- configy můžeš upravovat klidně jen z webového GitHub editoru.

## Proces vývoje aplikace

1. **Fáze 0 – Základní kostra**
   - Nastavit projekt (Next.js, Supabase, Vercel).
   - Vytvořit základní layout (header, sidebar, content).
   - Připravit složku `app/UI` pro komponenty.
   - Připravit složku `app/config` pro konfigurace (moduly, záložky, akce).

2. **Fáze 1 – UI kostra bez logiky**
   - Vytvořit komponenty:
     - HomeButton
     - Sidebar
     - Breadcrumbs
     - HomeActions
     - CommonActions
     - Tabs (10 záložek)
     - DetailView (detail entity – prázdný základ)
     - ListView (přehled – prázdný základ)
   - Vše napojit do `app/page.tsx`.

3. **Fáze 2 – Konfigurace a dynamika**
   - Vytvořit `app/config/modules.ts` – seznam modulů.
   - Vytvořit `app/config/tabs.ts` – 10 fixních záložek.
   - Vytvořit `app/config/actions.ts` – common actions podle modulu.
   - Sidebar, Tabs a CommonActions začnou číst data z těchto config souborů.

4. **Fáze 3 – Stav struktury**
   - Vytvořit `docs/stav-struktury.md`.
   - Zapisovat sem:
     - seznam komponent (UI)
     - seznam formulářů
     - seznam tiles
     - procesy (průvodce, vazby)
   - U každé položky stav: TODO / WIP / DONE.

5. **Fáze 4 – Data a Supabase**
   - Napojit přihlášení (auth).
   - Přidat tabulky (profiles, pronajimatel, nemovitost, jednotka, nájemník, smlouva, platba…).
   - Postupně nahrazovat „fake data“ v UI za reálná data ze Supabase.

6. **Fáze 5 – Refaktoring a dokumentace**
   - Pravidelně upravovat `stav-struktury.md`.
   - Udržovat konzistentní názvy souborů a komponent.

1️⃣ README.md (root repozitáře)
# Pronajímatel v6

Modulární aplikace pro správu pronájmů, nemovitostí a souvisejících procesů.

- **Frontend:** Next.js 14 (App Router), TypeScript + TSX
- **Backend:** Supabase (Auth, DB, API)
- **Hosting:** Vercel
- **Architektura:** modulová, dynamické UI (sidebar, záložky, akce)

---

## 🔧 Technologický stack

- **Next.js 14** – App Router, `app/` struktura
- **TypeScript** – UI a logika (`*.tsx`, `*.ts`)
- **Supabase** – autentizace, databáze
- **Vercel** – CI/CD a produkční nasazení
- **Vlastní UI** – žádná velká UI knihovna, vše pod kontrolou

---

## 📂 Struktura projektu

Zjednodušený přehled:

```txt
app/
  UI/
    Breadcrumbs.tsx
    CommonActions.tsx
    DetailView.tsx
    HomeActions.tsx
    HomeButton.tsx
    ListView.tsx
    LoginPanel.tsx
    Sidebar.tsx
    Tabs.tsx
    icons.ts           ← centrální ikony
  lib/
    supabaseClient.ts  ← klient pro Supabase
  modules/
    010-sprava-uzivatelu/
    020-muj-ucet/
    030-pronajimatel/
    040-nemovitost/
    050-najemnik/
    060-smlouva/
    070-sluzby/
    080-platby/
    090-finance/
    100-energie/
    120-dokumenty/
    130-komunikace/
    900-nastaveni/
  globals.css          ← globální layout + styly
  layout.tsx           ← kořenový layout (importuje globals.css)
  modules.index.js     ← seznam zdrojů modulů
  page.tsx             ← hlavní stránka (login + dashboard)

docs/
  CODESTYLE.md         ← pravidla psaní kódu
  UI-specifikace.md    ← popis UI, sekce 1–10
  layout_auth_ui.md    ← návrh autentizačního layoutu
  stav-struktury.md    ← co je hotové / rozpracované
  todo_list.md         ← úkoly
  (další soubory budou přibývat)

ikons.md               ← surový seznam ikon (zdroj pro icons.ts)
next.config.mjs
package.json
tsconfig.json

🧩 Moduly aplikace

Moduly jsou v adresáři app/modules/.

Každý modul má název:

<pořadí>-<název>/
např. 040-nemovitost


Základní konfig každého modulu:

// app/modules/040-nemovitost/module.config.js

/*
 * FILE: app/modules/040-nemovitost/module.config.js
 * PURPOSE: Konfigurace modulu „Nemovitosti“
 */

import { ICONS } from '@/app/UI/icons'

export default {
  id: '040-nemovitost',
  label: 'Nemovitosti',
  icon: 'building',       // klíč do ICONS
  order: 40,              // pořadí v sidebaru
  enabled: true
}


UI (Sidebar) načítá moduly dynamicky podle modules.index.js a module.config.js.

Postupně budou moduly doplněny o:

tiles/ – přehledy (seznamy)

forms/ – formuláře pro detail entity

services/ – komunikace se Supabase (CRUD, business logika)

🎨 UI layout – 6 hlavních částí

Layout aplikace je rozdělen na 6 základních bloků (desktop):

HomeButton – logo + název aplikace (oranžový blok vlevo nahoře)

Sidebar – seznam modulů

Breadcrumbs – drobečková navigace

HomeActions – pravý horní panel (uživatel, hledání, notifikace, odhlášení)

CommonActions – lišta obecných akcí (Upravit, Příloha, Archivovat…)

Content – hlavní obsah (přehledy, formuláře, dashboard, login)

Vše je definováno v app/page.tsx pomocí CSS gridu z globals.css.

🔐 Autentizace a přístup

Aplikace používá Supabase Auth.

Co je implementováno

supabaseClient.ts – vytvoření klienta Supabase z env proměnných:

NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY

LoginPanel.tsx:

přihlášení (email + heslo)

registrace (email + heslo + jméno)

reset hesla (e-mail s odkazem na obnovu)

page.tsx:

načítání session (supabase.auth.getSession())

posluchač změn session (onAuthStateChange)

přepínání UI:

nepřihlášený uživatel → vidí layout, ale vše je disabled + LoginPanel

přihlášený uživatel → odemčený layout + úvodní dashboard

odhlášení (supabase.auth.signOut())

Další fáze (plán)

MFA (TOTP) na základě Supabase MFA

role & oprávnění (omezení viditelných modulů)

biometrie / Passkeys na telefonu

🎭 Ikony

Surový seznam je definován v ikons.md.

Konkrétní sada pro aplikaci je v app/UI/icons.ts:

exportuje ICONS – mapu klíč → emoji

exportuje getIcon(key) – bezpečné získání ikony

Použití:

import { getIcon } from '@/app/UI/icons'

<span className="sidebar__icon">{getIcon('building')}</span>


Přísné pravidlo: v UI se nikdy nepíše emoji přímo. Vždy pouze přes getIcon().

🧠 Code style a pravidla

Základní pravidla (detail v docs/CODESTYLE.md):

Každý soubor začíná komentářem:

/*
 * FILE: app/UI/Sidebar.tsx
 * PURPOSE: Dynamický sidebar modulů
 */


UI komponenty (app/UI) neobsahují:

přímé volání Supabase / databáze

složitou logiku

inline styly

Logika / služby budou v app/lib (např. services/auth.ts).

Texty jsou primárně česky, do budoucna připravené na i18n.

🚀 Nasazení

Každý push na větev main spouští nový deploy na Vercel.

Produkční URL: https://aplikace-v6.vercel.app
✅ Stav projektu

Viz:

docs/stav-struktury.md – seznam hotových částí

docs/todo_list.md – další úkoly a fáze
