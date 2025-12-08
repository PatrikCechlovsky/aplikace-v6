# 02 – Architecture (Architektura aplikace Pronajímatel v6)

Tento dokument popisuje architekturu celého systému, strukturu adresářů,
modulový systém, principy načítání UI, práci se Supabase a obecné technické standardy.
Slouží jako hlavní technický základ projektu.

--------------------------------------------------------------------
# 1. Architektonické cíle
--------------------------------------------------------------------
- Modulární design (každá oblast aplikace je modul)
- Dynamické načítání modulů (lazy loading)
- Striktní oddělení UI / logiky / dat
- Snadná rozšiřitelnost
- Minimální duplicita
- Přehledná složková struktura
- Jednotný UI layout
- Bezpečný backend pomocí RLS

--------------------------------------------------------------------
# 2. Technologie
--------------------------------------------------------------------
| Vrstva | Technologie |
|-------|-------------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Hosting | Vercel (FE), Supabase Cloud (BE) |
| CSS | Vlastní systém + BEM struktura |
| Ikony | Vlastní emoji/ikonová mapa (icons.ts) |

--------------------------------------------------------------------
# 3. Struktura repozitáře
--------------------------------------------------------------------
```
aplikace-v6/
├── app/
│   ├── AppShell.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   │
│   ├── UI/                    # Sdílené UI komponenty
│   ├── lib/                   # Pomocné funkce a Supabase klient
│   ├── modules/               # Moduly 010–900
│   └── modules.index.js       # Lazy loader modulů
│
├── docs/
│   ├── 01-executive-summary.md
│   ├── 02-architecture.md
│   ├── … až 10
│   └── archive/
│
├── scripts/                   # Vývojové / údržbové skripty
├── package.json
├── tsconfig.json
└── next.config.mjs
```

--------------------------------------------------------------------
# 4. Frontend architektura
--------------------------------------------------------------------

## 4.1 App Router
Aplikace používá Next.js App Router:

- `app/layout.tsx` definuje globální rámec
- `app/AppShell.tsx` definuje hlavní 6‑blokový layout
- moduly se nenacházejí v routách, ale načítají se dynamicky

## 4.2 6‑sekční layout
Struktura:

1. HomeButton  
2. Sidebar  
3. Breadcrumbs  
4. HomeActions  
5. CommonActions  
6. Content

`AppShell.tsx` je jediný soubor, který toto drží konzistentní.

## 4.3 UI komponenty

### Sdílené komponenty (`app/UI`)
- HomeButton
- Sidebar
- Breadcrumbs
- HomeActions
- CommonActions
- EntityList
- EntityDetailFrame
- RelationListWithDetail
- ConfigListWithForm
- LoginPanel
- MfaSetupPanel
- Tabs
- icons.ts (centrální mapa ikon)

**Pravidla:**
- žádná logika v UI
- žádné přímé volání Supabase
- UI pouze prezentuje data

--------------------------------------------------------------------
# 5. Modulový systém
--------------------------------------------------------------------

## 5.1 Princip
Každý modul má vlastní složku:

```
app/modules/040-nemovitost/
    module.config.js
    tiles/
    components/
    services/
```

## 5.2 module.config.js
Závazný formát:

```js
export default {
  id: '040-nemovitost',
  label: 'Nemovitosti',
  icon: 'building',
  order: 40,
  enabled: true,
  tiles: [
    // jednotlivé části modulu
  ]
}
```

## 5.3 modules.index.js
Tento soubor definuje dynamické načítání modulů:

```js
export const MODULE_SOURCES = [
  () => import('./modules/010-sprava-uzivatelu/module.config.js'),
  () => import('./modules/020-muj-ucet/module.config.js'),
  ...
  () => import('./modules/900-nastaveni/module.config.js'),
]
```

### Chování:
- při startu aplikace se projdou SOURCE funkce
- moduly se načtou dynamicky
- sidebar se generuje z konfigurace

## 5.4 Tiles
Každý tile je komponenta, která reprezentuje:
- přehled
- detail
- vazby
- formulář
- konfiguraci

**Tile ≠ route.**  
Celý obsah modulů žije v rámci AppShellu.

--------------------------------------------------------------------
# 6. Logická architektura
--------------------------------------------------------------------

## 6.1 Služby (services)
Veškerá logika práce s daty se nachází zde.

Příklad:
```
app/lib/services/auth.ts
app/modules/900-nastaveni/services/subjectTypes.ts
```

### Pravidla:
- UI nesmí volat Supabase
- validace a datová logika je v services
- každý modul může mít své lokální služby

## 6.2 Helpery (/lib)
Obsahuje:
- supabaseClient.ts
- uiConfig.ts
- colorPalette.ts
- themeSettings.ts

Nic zde nesmí být závislé na jednom konkrétním modulu.

--------------------------------------------------------------------
# 7. Supabase architektura
--------------------------------------------------------------------

## 7.1 Supabase klient
Centrální klient:

```ts
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(url, key)
```

## 7.2 Auth
Aplikace používá:
- login
- logout
- registraci
- reset hesla
- session listener
- MFA (příprava)

## 7.3 RLS
Tabulky mají:
- owner_id
- role-based policies

Výchozí pravidlo:
- uživatel vidí pouze své záznamy

--------------------------------------------------------------------
# 8. Deployment architektura
--------------------------------------------------------------------

## 8.1 Lokální vývoj
```
npm install
npm run dev
```

## 8.2 Build
```
npm run build
npm start
```

## 8.3 Vercel
- každý push do main = automatický deploy
- environment variables jsou načteny z .env.local

--------------------------------------------------------------------
# 9. Bezpečnostní zásady
--------------------------------------------------------------------
- žádné klíče v repozitáři
- pouze veřejné anon klíče v klientu
- RLS musí být vždy aktivní
- UI nesmí mít znalost o interních ID mimo vlastníka

--------------------------------------------------------------------
# 10. Historická část
--------------------------------------------------------------------
(Tato sekce bude použita při přesunu starého obsahu.)