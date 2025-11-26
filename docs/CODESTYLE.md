# Codestyle – pravidla

1. **Soubory komponent**
   - UI komponenty = `*.tsx`
   - Jedna komponenta = jeden soubor
   - Název souboru = název komponenty (Sidebar.tsx, Tabs.tsx…)

2. **Pojmenování**
   - Komponenty: PascalCase (Sidebar, DetailView)
   - Funkce: camelCase (loadModules, getActions)
   - Konfigurace: malá písmena (modules, tabs, actions)

3. **Struktura**
   - `app/` = stránky a layout
   - `app/UI/` = všechny vizuální komponenty
   - `app/config/` = datové konfigurace (moduly, záložky, akce)
   - `docs/` = dokumentace (stav struktury, pravidla)

4. **Styl**
   - Raději více menších komponent než jedna obří.
   - Logiku (počítání, mapování, transformace) postupně přesouvat do helperů / configů.
   - Nepoužívat „magické stringy“ přímo v komponentách – místo toho config.

5. **Commitování**
   - Každá větší změna = jeden commit.
   - Commit message česky/anglicky, ale srozumitelná („Přidaný Sidebar a Tabs“, „Napojení na Supabase“).

---

## 2️⃣ `docs/CODESTYLE.md` (přepiš tímto obsahem)

```md
# CODESTYLE – pravidla pro kód v projektu Pronajímatel v6

Cíl: udržet velkou aplikaci přehlednou, modulární a snadno rozšiřitelnou.

---

## 1. Základní principy

1. **UI oddělené od logiky**
   - Komponenty v `app/UI` řeší pouze vzhled a jednoduchou interakci.
   - Logika (Supabase, výpočty, validace, business pravidla) bude v `app/lib` (např. `services/auth.ts`).

2. **Konvence složek**
   - `app/UI` – sdílené vizuální komponenty (layout, formuláře, přehledy…)
   - `app/modules` – doménové moduly (Pronajímatel, Nemovitost, Nájemník…)
   - `app/lib` – pomocné funkce, Supabase klient, služby
   - `docs` – dokumentace, specifikace, todo

3. **Žádné zbytečné zkratky**
   - názvy souborů a proměnných raději delší, ale srozumitelné:
     - `LoginPanel.tsx`, ne `LP.tsx`
     - `landlord`, ne `ll`

---

## 2. Hlavička každého souboru

Každý soubor musí začínat tímto komentářem (přizpůsob cestu a účel):

```ts
/*
 * FILE: app/UI/Sidebar.tsx
 * PURPOSE: Dynamický sidebar s moduly
 */
Výjimka: auto-generované soubory (např. .d.ts, soubory generované nástrojem).

3. TypeScript / TSX vs. JS

UI a logika: TypeScript / TSX (.ts, .tsx)

Modulové konfigurace: JavaScript (module.config.js, modules.index.js)

Konvence:

UI komponenty: PascalCase soubory (HomeButton.tsx, LoginPanel.tsx)

Služby / helpery: camelCase soubory (supabaseClient.ts, budoucí authService.ts)

4. Ikony

Ikony jsou centralizované.

Surový seznam: ikons.md

Implementace pro UI: app/UI/icons.ts

export ICONS – mapa klíč → emoji

export getIcon(key: IconKey) – bezpečné použití v UI

Pravidlo:

❌ NE:

<span>🏢</span>
<span>💰</span>


✅ ANO:

import { getIcon } from '@/app/UI/icons'

<span>{getIcon('building')}</span>
<span>{getIcon('finance')}</span>


Díky tomu lze v budoucnu emoji nahradit SVG ikonami bez zásahu do všech komponent.

5. Stylování

Globální styly pouze v app/globals.css.

Layout je řešen přes CSS Grid:

.layout, .layout__sidebar, .layout__topbar, .layout__actions, .layout__content

BEM-like pojmenování tříd:

home-button, home-button__icon, home-button__text

sidebar__item, sidebar__icon, sidebar__label

login-panel__field, login-panel__error

Pravidla:

Žádné inline styly (style={{ ... }}), pokud to není nutné.

Třídy pojmenovávat podle komponenty (login-panel__..., sidebar__...).

Responzivita se bude řešit postupně (breakpointy v globals.css).

6. UI komponenty
Obecná pravidla

Každá komponenta v app/UI:

přijímá props, nic nedostává přes globální proměnné

je čistá (bez side effectů, pokud to není nutné – např. useEffect pro načtení sidebaru)

nemá přímé volání Supabase – to jde přes služby (app/lib)

Pokud komponenta může být zamčená (disabled), má prop:

type Props = {
  disabled?: boolean
}


A podle toho přidává CSS třídu is-disabled nebo atribut disabled na tlačítka.

7. Moduly (app/modules)

Každý modul má:

app/modules/040-nemovitost/
  module.config.js
  tiles/          (přehledy)
  forms/          (formuláře)
  services/       (komunikace s DB, doménová logika)


module.config.js:

definuje základní metadata:

export default {
  id: '040-nemovitost',
  label: 'Nemovitosti',
  icon: 'building', // klíč do icons.ts
  order: 40,
  enabled: true
}


je importovaný pouze přes modules.index.js, nikdy přímo z UI.

8. Autentizace

Supabase klient: app/lib/supabaseClient.ts

UI pro login: app/UI/LoginPanel.tsx

Session a ochrana UI: app/page.tsx

Pravidlo:

v UI komponentách nejsou natvrdo použité supabase funkce (kromě přechodné fáze – postupně se přesune do služeb v app/lib/services/auth.ts).

9. Commity a větve

Hlavní větev: main

Každá větší změna by měla být:

popsána v docs/todo_list.md

zapsaná do commit message tak, aby bylo jasné, co se změnilo:

např. feat: add login panel with supabase auth

např. chore: update layout grid and sidebar icons

10. Dokumentace

Stručný přehled v README.md

Detailní technické věci:

docs/UI-specifikace.md – detailní popis layoutu a UI bloků

docs/layout_auth_ui.md – popis obrazovek kolem přihlášení

docs/stav-struktury.md – co je hotovo

docs/todo_list.md – plán práce

docs/CODESTYLE.md – tento soubor, udržovat aktuální

Při větším zásahu do architektury vždy:

Aktualizovat kód.

Zakreslit změnu do příslušného dokumentu v docs/
