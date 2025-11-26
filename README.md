# Pronajímatel v6 – Modulární SaaS pro správu nájemních vztahů

Toto je 6. generace aplikace „Pronajímatel“, kompletně přepsaná do moderní modulární architektury.

---

# 🚀 Technologie

- Next.js 14 (App Router)
- TypeScript / TSX
- Supabase (Auth + DB)
- Vercel (CI/CD + produkční hosting)
- Ručně tvořený UI systém bez externích knihoven

---

# 📂 Struktura projektu

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
    icons.ts
  lib/
    supabaseClient.ts
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
  globals.css
  layout.tsx
  modules.index.js
  page.tsx

docs/
  CODESTYLE.md
  UI-specifikace.md
  layout_auth_ui.md
  stav-struktury.md
  todo_list.md

ikons.md
README.md
next.config.mjs
package.json
tsconfig.json
```

---

# 🧩 Modulový systém

Moduly jsou umístěné v `app/modules/`.

Každý modul má strukturu:

```
module.config.js
tiles/
forms/
services/
```

### Ukázka konfigurace modulu

```js
/*
 * FILE: app/modules/040-nemovitost/module.config.js
 * PURPOSE: Konfigurace modulu „Nemovitosti“
 */

import { ICONS } from '@/app/UI/icons'

export default {
  id: '040-nemovitost',
  label: 'Nemovitosti',
  icon: 'building',
  order: 40,
  enabled: true
}
```

Moduly jsou dynamicky načítané podle `modules.index.js`.

---

# 🎨 UI – 6 hlavních částí aplikace

Celý layout aplikace je rozdělen na:

1. **HomeButton** – název aplikace vlevo nahoře
2. **Sidebar** – seznam modulů
3. **Breadcrumbs** – drobečková navigace
4. **HomeActions** – horní panel vpravo
5. **CommonActions** – lišta obecných akcí
6. **Content** – hlavní plocha (dashboard, přehled, formuláře)

Glóbalní styly a grid definované v `globals.css`.

---

# 🔐 Autentizace

- přihlášení (email + heslo)
- registrace (email + heslo + jméno)
- reset hesla (Supabase reset mail)
- session listener (`onAuthStateChange`)
- blokace UI pro nepřihlášené uživatele
- Logout

MFA (TOTP) je aktivní v Supabase a bude doplněno v budoucí fázi.

---

# 🎭 Ikony

- seznam ikon v `ikons.md`
- implementace ikon v `app/UI/icons.ts`

Použití:

```tsx
import { getIcon } from '@/app/UI/icons'

<span>{getIcon('building')}</span>
```

V UI se emoji **nikdy nepíší přímo**, vždy přes `getIcon()`.

---

# 🧠 Kódové standardy

Viz `docs/CODESTYLE.md`.

Shrnutí:

- UI komponenty neobsahují logiku Supabase
- logika a DB připojení v `app/lib`
- žádné inline styly
- každá komponenta má povinnou hlavičku:

```ts
/*
 * FILE: app/UI/Sidebar.tsx
 * PURPOSE: Popis účelu souboru
 */
```

- názvy komponent PascalCase
- názvy funkcí camelCase
- moduly pouze přes `module.config.js`

---

# 🧾 Dokumentace

V adresáři `docs/` jsou tyto soubory:

- UI-specifikace.md
- layout_auth_ui.md
- stav-struktury.md
- todo_list.md
- CODESTYLE.md

---

# 🚀 Nasazování

Každý push do větve `main` automaticky vytváří nový deployment (Vercel).

Produkční URL:  
https://aplikace-v6.vercel.app

---

# 📌 Stav projektu

Viz:

- docs/stav-struktury.md
- docs/todo_list.md
