# Podrobné shrnutí aplikace Pronajímatel v6

> Tento dokument obsahuje kompletní přehled aplikace včetně struktury souborů, komponent, modulů, nastavení a všech procesů.

---

## 📌 O aplikaci

**Pronajímatel v6** je modulární SaaS aplikace pro správu nájemních vztahů. Jedná se o 6. generaci aplikace, kompletně přepsanou do moderní modulární architektury.

### Klíčové vlastnosti:
- Správa pronajímatelů, nemovitostí, jednotek a nájemníků
- Správa smluv, služeb a plateb
- Finanční přehled a vyúčtování
- Správa dokumentů a komunikace
- Modulární architektura s možností rozšíření
- Bezpečnost pomocí Row Level Security (RLS)

### Produkční URL:
**https://aplikace-v6.vercel.app**

---

## 🛠️ Technologie

| Technologie | Verze | Účel |
|-------------|-------|------|
| Next.js | 14.2.3 | React framework s App Router |
| React | 18.2.0 | UI knihovna |
| TypeScript | 5.6.0 | Typová bezpečnost |
| Supabase | 2.48.0 | Backend (Auth + DB) |
| Vercel | - | CI/CD + produkční hosting |
| CSS | - | Ručně tvořený UI systém |

---

## 📂 Kompletní struktura projektu

```
aplikace-v6/
├── .env.local                      # Proměnné prostředí (Supabase klíče)
├── .git/                           # Git repozitář
├── LICENSE                         # Licence projektu
├── README.md                       # Hlavní dokumentace
├── ikons.md                        # Katalog všech ikon (242 ikon)
├── next-env.d.ts                   # Next.js TypeScript deklarace
├── next.config.mjs                 # Konfigurace Next.js
├── package.json                    # NPM závislosti a skripty
├── tsconfig.json                   # TypeScript konfigurace
│
├── app/                            # Hlavní složka Next.js App Router
│   ├── globals.css                 # Globální CSS styly (668 řádků)
│   ├── layout.tsx                  # Kořenový layout aplikace
│   ├── page.tsx                    # Hlavní stránka (dashboard/login)
│   ├── modules.index.js            # Index všech modulů pro lazy loading
│   │
│   ├── UI/                         # UI komponenty
│   │   ├── Breadcrumbs.tsx         # Drobečková navigace
│   │   ├── CommonActions.tsx       # Akční lišta entity
│   │   ├── ConfigListWithForm.tsx  # Konfigurace typů (číselníky)
│   │   ├── DetailView.tsx          # Detail entity (základní)
│   │   ├── EntityDetailFrame.tsx   # Rámec detailu entity
│   │   ├── EntityList.tsx          # Seznam entit (přehled)
│   │   ├── GenericTypeTile.tsx     # Generický typový pohled
│   │   ├── HomeActions.tsx         # Akce uživatele (vpravo nahoře)
│   │   ├── HomeButton.tsx          # Logo/Home tlačítko
│   │   ├── ListView.tsx            # Jednoduchý přehled
│   │   ├── LoginPanel.tsx          # Přihlašovací panel
│   │   ├── MfaSetupPanel.tsx       # Nastavení 2FA (TOTP)
│   │   ├── RelationListWithDetail.tsx # Vazby (seznam + detail)
│   │   ├── Sidebar.tsx             # Boční menu modulů
│   │   ├── Tabs.tsx                # Záložky modulů
│   │   ├── icons.ts                # Centrální mapa ikon
│   │   └── supabase.js             # Alternativní Supabase klient
│   │
│   ├── lib/                        # Knihovny a služby
│   │   ├── supabaseClient.ts       # Hlavní Supabase klient
│   │   ├── uiConfig.ts             # Konfigurace UI (téma, ikony)
│   │   └── services/               # Aplikační služby
│   │       └── auth.ts             # Autentizační funkce
│   │
│   ├── modules/                    # Aplikační moduly
│   │   ├── 010-sprava-uzivatelu/   # Správa uživatelů
│   │   │   ├── module.config.js
│   │   │   └── RolesConfigPanel.tsx
│   │   ├── 020-muj-ucet/           # Můj účet
│   │   │   └── module.config.js
│   │   ├── 030-pronajimatel/       # Pronajímatelé
│   │   │   └── module.config.js
│   │   ├── 040-nemovitost/         # Nemovitosti
│   │   │   └── module.config.js
│   │   ├── 050-najemnik/           # Nájemníci
│   │   │   └── module.config.js
│   │   ├── 060-smlouva/            # Smlouvy
│   │   │   └── module.config.js
│   │   ├── 070-sluzby/             # Služby
│   │   │   └── module.config.js
│   │   ├── 080-platby/             # Platby
│   │   │   └── module.config.js
│   │   ├── 090-finance/            # Finance
│   │   │   └── module.config.js
│   │   ├── 100-energie/            # Energie/Měřidla
│   │   │   └── module.config.js
│   │   ├── 120-dokumenty/          # Dokumenty
│   │   │   └── module.config.js
│   │   ├── 130-komunikace/         # Komunikace
│   │   │   └── module.config.js
│   │   └── 900-nastaveni/          # Nastavení
│   │       ├── module.config.js
│   │       ├── services/
│   │       │   └── subjectTypes.ts
│   │       └── tiles/
│   │           └── SubjectTypesTile.tsx
│   │
│   └── nastaveni/                  # Route pro nastavení
│       └── page.tsx
│
└── docs/                           # Dokumentace
    ├── CODESTYLE.md                # Kódové standardy
    ├── UI-specifikace.md           # Specifikace UI
    ├── layout_auth_ui.md           # Layout a autentizace
    ├── stav-struktury.md           # Stav vývoje
    ├── todo_list.md                # Seznam úkolů
    └── PREHLED-APLIKACE.md         # Tento dokument
```

---

## 🎨 UI Layout – 6 hlavních částí

Aplikace využívá jednotný 6-blokový layout postavený na CSS Grid:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌──────────┐  ┌─────────────────────────────────────────┐ │
│  │    1     │  │  3. Breadcrumbs    │    4. HomeActions   │ │
│  │  Home    │  ├─────────────────────────────────────────┤ │
│  │  Button  │  │           5. CommonActions              │ │
│  ├──────────┤  ├─────────────────────────────────────────┤ │
│  │          │  │                                         │ │
│  │    2     │  │                                         │ │
│  │ Sidebar  │  │            6. Content                   │ │
│  │ (menu)   │  │         (hlavní obsah)                  │ │
│  │          │  │                                         │ │
│  │          │  │                                         │ │
│  └──────────┘  └─────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Detailní popis jednotlivých částí:

#### 1. HomeButton (`app/UI/HomeButton.tsx`)
- **Účel:** Logo aplikace a název "Pronajímatel v6"
- **Umístění:** Levý horní roh
- **Funkce:** Kliknutím návrat na hlavní přehled
- **Props:** `disabled?: boolean`

```tsx
<div className="home-button">
  <span className="home-button__icon">🏠</span>
  <span className="home-button__text">Pronajímatel v6</span>
</div>
```

#### 2. Sidebar (`app/UI/Sidebar.tsx`)
- **Účel:** Dynamické menu modulů
- **Umístění:** Levý sloupec
- **Funkce:** 
  - Načítá moduly z `modules.index.js`
  - Zobrazuje ikony a názvy modulů
  - Zvýrazňuje aktivní modul
- **Props:** `disabled?: boolean`

```tsx
// Dynamické načítání modulů
useEffect(() => {
  async function loadModules() {
    for (const loader of MODULE_SOURCES) {
      const mod = await loader()
      // ...zpracování konfigurace
    }
    loaded.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    setModules(loaded)
  }
  loadModules()
}, [])
```

#### 3. Breadcrumbs (`app/UI/Breadcrumbs.tsx`)
- **Účel:** Drobečková navigace
- **Umístění:** Horní část nad obsahem
- **Funkce:** Zobrazuje aktuální cestu (Domů > Modul > Detail)
- **Props:** `disabled?: boolean`

#### 4. HomeActions (`app/UI/HomeActions.tsx`)
- **Účel:** Uživatelské akce
- **Umístění:** Vpravo nahoře
- **Komponenty:**
  - Jméno přihlášeného uživatele
  - Tlačítko hledání (🔍)
  - Tlačítko notifikací (🔔)
  - Tlačítko profilu (👤)
  - Tlačítko odhlášení
- **Props:** `disabled?: boolean`, `onLogout?: () => void`

#### 5. CommonActions (`app/UI/CommonActions.tsx`)
- **Účel:** Akční lišta entity
- **Umístění:** Pod breadcrumbs, nad obsahem
- **Výchozí akce:**
  - Detail (👁️)
  - Upravit (✏️)
  - Přílohy (📎)
  - Archivovat (🗄️)
  - Smazat (🗑️)
- **Props:** `disabled?: boolean`, `actions?: CommonAction[]`

```tsx
type CommonAction = {
  key: 'detail' | 'edit' | 'attach' | 'archive' | 'delete'
  label: string
  iconKey: IconKey
  onClick?: () => void
  disabled?: boolean
}
```

#### 6. Content (`layout__content`)
- **Účel:** Hlavní pracovní plocha
- **Umístění:** Největší část vpravo dole
- **Obsah podle stavu:**
  - Přihlašovací obrazovka (nepřihlášený)
  - Dashboard/přehled (přihlášený)
  - Detail entity
  - Formuláře a průvodci

---

## 🧩 Modulový systém

### Princip fungování

Moduly jsou dynamicky načítány pomocí lazy loading. Každý modul má:

1. **module.config.js** – konfigurace modulu
2. **tiles/** – dlaždice/přehledy
3. **forms/** – formuláře
4. **services/** – datové služby

### Seznam všech modulů

| Kód | Název | Ikona | Pořadí | Stav |
|-----|-------|-------|--------|------|
| 010 | Správa uživatelů | 👤 | 10 | DONE |
| 020 | Můj účet | 👤 | 20 | DONE |
| 030 | Pronajímatelé | 🏠 | 30 | DONE |
| 040 | Nemovitosti | 🏢 | 40 | DONE |
| 050 | Nájemníci | 👥 | 50 | DONE |
| 060 | Smlouvy | 📜 | 60 | DONE |
| 070 | Služby | ⚙️ | 70 | DONE |
| 080 | Platby | 💳 | 80 | DONE |
| 090 | Finance | 💰 | 90 | DONE |
| 100 | Energie | ⚡ | 100 | DONE |
| 120 | Dokumenty | 📁 | 120 | DONE |
| 130 | Komunikace | 💬 | 130 | DONE |
| 900 | Nastavení | ⚙️ | 900 | DONE |

### Konfigurace modulu (příklad)

```javascript
// FILE: app/modules/040-nemovitost/module.config.js

export default {
  id: '040-nemovitost',
  label: 'Nemovitosti',
  icon: 'building',      // klíč z icons.ts
  order: 40,             // pořadí v menu
  enabled: true,         // zobrazení v sidebaru
  
  // Budoucí rozšíření:
  overview: [],          // přehledy (list view)
  detail: [],            // formuláře detailu
  tiles: [],             // dlaždice
  actions: [],           // akce modulu
}
```

### Index modulů (`modules.index.js`)

```javascript
export const MODULE_SOURCES = [
  () => import('./modules/010-sprava-uzivatelu/module.config.js'),
  () => import('./modules/020-muj-ucet/module.config.js'),
  () => import('./modules/030-pronajimatel/module.config.js'),
  () => import('./modules/040-nemovitost/module.config.js'),
  () => import('./modules/050-najemnik/module.config.js'),
  () => import('./modules/060-smlouva/module.config.js'),
  () => import('./modules/070-sluzby/module.config.js'),
  () => import('./modules/080-platby/module.config.js'),
  () => import('./modules/090-finance/module.config.js'),
  () => import('./modules/100-energie/module.config.js'),
  () => import('./modules/120-dokumenty/module.config.js'),
  () => import('./modules/130-komunikace/module.config.js'),
  () => import('./modules/900-nastaveni/module.config.js'),
]
```

---

## 🔐 Autentizace

### Přehled

Aplikace využívá Supabase Auth pro kompletní správu uživatelů.

### Podporované funkce:

| Funkce | Stav | Popis |
|--------|------|-------|
| Přihlášení | ✅ | Email + heslo |
| Registrace | ✅ | Email + heslo + jméno |
| Reset hesla | ✅ | Email s odkazem |
| Session listener | ✅ | Automatická detekce stavu |
| Odhlášení | ✅ | Vymazání session |
| MFA (TOTP) | 🔧 | V přípravě |

### Autentizační služba (`app/lib/services/auth.ts`)

```typescript
// Přihlášení
export async function login(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

// Odhlášení
export async function logout() {
  return supabase.auth.signOut()
}

// Registrace
export async function register(email: string, password: string, fullName: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }
    }
  })
}

// Reset hesla
export async function resetPassword(email: string, redirectTo: string) {
  return supabase.auth.resetPasswordForEmail(email, { redirectTo })
}

// Získání session
export async function getCurrentSession() {
  return supabase.auth.getSession()
}

// Listener změn stavu
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback)
}
```

### MFA (2FA) podpora

```typescript
// Vytvoření TOTP faktoru
export async function enrollTotpFactor() {
  return supabase.auth.mfa.enroll({ factorType: 'totp' })
}

// Challenge pro ověření
export async function challengeTotpFactor(factorId: string) {
  return supabase.auth.mfa.challenge({ factorId })
}

// Ověření kódu
export async function verifyTotpChallenge(params) {
  return supabase.auth.mfa.verify(params)
}
```

### Proces přihlášení (flow)

```
1. Uživatel otevře aplikaci
   ↓
2. Kontrola session (getCurrentSession)
   ↓
3. Session neexistuje → zobrazí se LoginPanel
   ↓
4. Uživatel zadá email + heslo
   ↓
5. Volání login() → Supabase Auth
   ↓
6. onAuthStateChange detekuje změnu
   ↓
7. Nastavení session do state
   ↓
8. UI se přepne na hlavní obsah
```

---

## 🎨 Stylování

### Globální CSS (`globals.css`)

Aplikace používá vlastní CSS systém bez externích knihoven (Tailwind, Bootstrap apod.).

### CSS Layout (Grid)

```css
.layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  grid-template-rows: auto auto 1fr;
  min-height: 100vh;
}

.layout__sidebar { grid-row: 1 / span 3; grid-column: 1; }
.layout__topbar { grid-column: 2; grid-row: 1; }
.layout__actions { grid-column: 2; grid-row: 2; }
.layout__content { grid-column: 2; grid-row: 3; }
```

### BEM konvence názvů

```css
/* Blok */
.sidebar { }

/* Element */
.sidebar__item { }
.sidebar__icon { }
.sidebar__label { }

/* Modifikátor */
.sidebar__item--active { }
```

### Témata (Themes)

Aplikace podporuje 5 barevných motivů:

| Téma | Třída | Popis |
|------|-------|-------|
| Light | `theme-light` | Výchozí světlé téma |
| Dark | `theme-dark` | Tmavý režim |
| Blue | `theme-blue` | Modrý accent |
| Green | `theme-green` | Zelený accent |
| Orange | `theme-orange` | Oranžový accent |

```css
/* Dark téma */
body.theme-dark {
  background-color: #020617;
  color: #e5e7eb;
}

body.theme-dark .layout__sidebar {
  background: #020617;
  border-right-color: #1f2937;
}
```

### Konfigurace tématu (`app/lib/uiConfig.ts`)

```typescript
export type ThemeName = 'light' | 'dark' | 'blue' | 'green' | 'orange'

export const uiConfig: UiConfig = {
  showSidebarIcons: true,      // Ikony v sidebaru
  showBreadcrumbIcons: true,   // Ikony v breadcrumbs
  theme: 'light',              // Aktivní téma
}
```

### Responsive design

```css
@media (max-width: 768px) {
  .layout {
    display: flex;
    flex-direction: column;
  }
  
  .layout__sidebar,
  .layout__topbar,
  .layout__actions,
  .layout__content {
    width: 100%;
  }
}
```

---

## 🎭 Systém ikon

### Centrální mapa ikon (`app/UI/icons.ts`)

```typescript
export type IconKey =
  | 'home' | 'users' | 'user' | 'landlord' | 'building'
  | 'apartment' | 'unit' | 'tenant' | 'contract' | 'services'
  | 'payments' | 'finance' | 'energy' | 'documents' | 'communication'
  | 'settings' | 'dashboard' | 'help' | 'list' | 'detail'
  | 'edit' | 'delete' | 'archive' | 'attach' | 'refresh'
  | 'search' | 'warning' | 'notification' | 'logout' | 'login'
  | 'add' | 'send' | 'history' | 'folder' | 'file'
  | 'chat' | 'mail' | 'print' | 'form' | 'grid' | 'tile'

export const ICONS: Record<IconKey, string> = {
  home: '🏠',
  users: '👥',
  user: '👤',
  landlord: '🏠',
  building: '🏢',
  // ... další ikony
}

export function getIcon(key: IconKey | undefined, fallback = '❓') {
  if (!key) return fallback
  return ICONS[key] ?? fallback
}
```

### Použití v komponentách

```tsx
import { getIcon } from '@/app/UI/icons'

// Správné použití
<span>{getIcon('building')}</span>

// NIKDY nepsat emoji přímo!
// ❌ <span>🏢</span>
```

### Kompletní katalog ikon

Aplikace obsahuje **242 ikon** rozdělených do kategorií:
- ZÁKLAD / NAV (26 ikon)
- CRUD / ACTIONS (27 ikon)
- BUILDINGS / PROPERTY (13 ikon)
- COMMUNICATION (10 ikon)
- E-COMMERCE / FINANCE (11 ikon)
- CALENDAR / TIME (10 ikon)
- A další...

---

## 🗄️ Databáze (Supabase)

### Připojení (`app/lib/supabaseClient.ts`)

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Proměnné prostředí (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://viwxxerhmounbymcbroi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### Hlavní tabulky

| Tabulka | Účel |
|---------|------|
| `subjects` | Centrální tabulka osob/firem |
| `subject_types` | Typy subjektů (číselník) |
| `subject_roles` | Role subjektů |
| `subject_permissions` | Oprávnění subjektů |
| `role_types` | Typy rolí (číselník) |
| `permission_types` | Typy oprávnění (číselník) |

### Row Level Security (RLS)

Každý uživatel vidí **pouze své vlastní záznamy**.

```sql
-- Zapnutí RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- SELECT – jen vlastní záznamy
CREATE POLICY "Subjects: select own"
ON public.subjects
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

-- INSERT – vkládat pouze své subjekty
CREATE POLICY "Subjects: insert own"
ON public.subjects
FOR INSERT
TO authenticated
WITH CHECK (auth_user_id = auth.uid());

-- UPDATE – měnit pouze vlastní řádky
CREATE POLICY "Subjects: update own"
ON public.subjects
FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- DELETE
CREATE POLICY "Subjects: delete own"
ON public.subjects
FOR DELETE
TO authenticated
USING (auth_user_id = auth.uid());
```

### Číselníky (read-only)

```sql
-- Všichni přihlášení mohou číst číselníky
CREATE POLICY "Role types: read all"
ON public.role_types
FOR SELECT
TO authenticated
USING (true);
```

---

## 📦 UI Komponenty – Detailní popis

### LoginPanel (`app/UI/LoginPanel.tsx`)

Panel pro přihlášení/registraci/reset hesla.

**Módy:**
- `login` – přihlášení
- `register` – registrace
- `reset` – reset hesla

**State:**
```typescript
const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login')
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [password2, setPassword2] = useState('')
const [fullName, setFullName] = useState('')
const [message, setMessage] = useState<string | null>(null)
const [error, setError] = useState<string | null>(null)
const [loading, setLoading] = useState(false)
```

### MfaSetupPanel (`app/UI/MfaSetupPanel.tsx`)

Panel pro nastavení dvoufázového ověření (TOTP).

**Kroky:**
1. Vytvoření MFA faktoru a QR kódu
2. Naskenování v Authenticator aplikaci
3. Zadání a ověření 6místného kódu

### EntityList (`app/UI/EntityList.tsx`)

Přehled entit v modulu (tabulka).

**Props:**
```typescript
type Props = {
  columns: EntityListColumn[]
  rows: EntityListRow[]
  loading?: boolean
  onRowDoubleClick?: (row: EntityListRow) => void
  onRowClick?: (row: EntityListRow) => void
  emptyText?: string
}
```

### EntityDetailFrame (`app/UI/EntityDetailFrame.tsx`)

Rámec hlavní karty detailu entity.

**Sekce:**
- Hlavní formulář
- Přílohy
- Systémové informace

### RelationListWithDetail (`app/UI/RelationListWithDetail.tsx`)

Vzor záložky "vazby" – nahoře seznam (max 10 položek), dole detail.

### ConfigListWithForm (`app/UI/ConfigListWithForm.tsx`)

Vzor pro nastavení typů (role, oprávnění, typ subjektu...).

### GenericTypeTile (`app/UI/GenericTypeTile.tsx`)

Jednotný typový pohled pro číselníky s následujícími poli:
- `code` – kód
- `name` – název
- `description` – popis
- `color` – barva
- `icon` – ikona
- `sort_order` – pořadí
- `active` – aktivní/archivovaný

---

## 📋 Konfigurace projektu

### package.json

```json
{
  "name": "aplikace-v6",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.48.0",
    "next": "^14.2.3",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/react": "^18.2.0",
    "@types/node": "^20.14.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### next.config.mjs

```javascript
const nextConfig = {
  reactStrictMode: true,
}

export default nextConfig
```

---

## 🔄 Procesy a toky dat

### Hlavní stránka – životní cyklus

```
1. RootLayout (layout.tsx)
   - Načtení globals.css
   - Nastavení tématu na <body>
   
2. HomePage (page.tsx)
   - useEffect: Kontrola session
   - Nastavení listeneru onAuthStateChange
   
3. Render podle stavu:
   - loading → "Načítání..."
   - !isAuthenticated → LoginPanel
   - isAuthenticated → Dashboard
   
4. Sidebar načte moduly
   - MODULE_SOURCES.forEach(loader)
   - Seřazení podle order
   - Render položek menu
```

### Přidání nového modulu

```
1. Vytvořit složku: app/modules/XXX-nazev/
2. Vytvořit module.config.js:
   export default {
     id: 'XXX-nazev',
     label: 'Název modulu',
     icon: 'icon_key',
     order: XXX,
     enabled: true
   }
3. Přidat import do modules.index.js
4. (Volitelně) Přidat route do app/
```

### CRUD operace s Supabase

```typescript
// CREATE
const { data, error } = await supabase
  .from('table_name')
  .insert(payload)
  .select()
  .single()

// READ
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('id', id)

// UPDATE
const { data, error } = await supabase
  .from('table_name')
  .update(payload)
  .eq('id', id)
  .select()
  .single()

// DELETE
const { error } = await supabase
  .from('table_name')
  .delete()
  .eq('id', id)
```

---

## 📏 Kódové standardy (CODESTYLE)

### Povinná hlavička souboru

```typescript
/*
 * FILE: app/UI/ComponentName.tsx
 * PURPOSE: Popis účelu komponenty
 */
```

### Pojmenování

| Typ | Formát | Příklad |
|-----|--------|---------|
| Komponenty | PascalCase | `HomeButton.tsx` |
| Funkce | camelCase | `loadModules()` |
| CSS třídy | BEM-like | `sidebar__item` |
| Moduly | kebab-case + číslo | `040-nemovitost` |

### Pravidla

1. **UI oddělené od logiky** – žádné přímé volání Supabase z UI
2. **Logika v `app/lib`** – databáze, auth, helpers
3. **Žádné inline CSS** – vše v `globals.css`
4. **Emoji přes `getIcon()`** – nikdy přímo v kódu
5. **Moduly přes `modules.index.js`** – nikdy přímý import

---

## 📊 Vazby mezi entitami

```
Pronajímatel
    ↓ 1:N
Nemovitost
    ↓ 1:N
Jednotka ──────────────→ Měřidla
    ↓ 0:1                  ↓
Nájemník                 Energie
    ↓ 1:N
Smlouva ──→ Služby
    ↓         ↓
Platby    Vyúčtování
    ↓
Finance
```

| Entita | Vazby (1:N) |
|--------|-------------|
| Pronajímatel | → Nemovitosti |
| Nemovitost | → Jednotky, Měřidla, Finance, Přílohy |
| Jednotka | → Nájemník (0:1) |
| Nájemník | → Smlouvy |
| Smlouva | → Služby, Platby, Dokumenty, Přílohy |
| Služba | → Měřidlo (volitelně) |
| Platba | → Smlouva |

---

## 🚀 Nasazování (Deployment)

### Automatické nasazení

Každý push do větve `main` automaticky vytváří nový deployment na Vercel.

### Proces:

```
1. Push do main
   ↓
2. Vercel detekuje změnu
   ↓
3. Spuštění buildu (next build)
   ↓
4. Deployment na produkci
   ↓
5. URL: https://aplikace-v6.vercel.app
```

### Příkazy pro vývoj

```bash
# Instalace závislostí
npm install

# Vývojový server
npm run dev

# Produkční build
npm run build

# Spuštění produkčního buildu
npm start

# Lint
npm run lint
```

---

## 📈 Stav vývoje

### Hotové části (DONE)

- [x] Základní struktura projektu
- [x] Layout aplikace (6 částí)
- [x] Modulový systém
- [x] Dynamický Sidebar
- [x] Autentizace (login, register, reset)
- [x] Session management
- [x] Globální styly
- [x] Témata (light, dark, blue, green, orange)
- [x] Systém ikon
- [x] RLS bezpečnost v databázi

### V procesu (WIP)

- [ ] MFA (2FA) integrace
- [ ] Mobilní responsive layout
- [ ] Detailní formuláře modulů
- [ ] CRUD operace pro všechny entity

### Plánované (TODO)

- [ ] Vazby mezi entitami
- [ ] Reporty a exporty
- [ ] Automatická komunikace
- [ ] Verzování dokumentů
- [ ] Role-based UI

---

## 📚 Další dokumentace

| Dokument | Popis |
|----------|-------|
| `docs/CODESTYLE.md` | Pravidla psaní kódu |
| `docs/UI-specifikace.md` | Specifikace UI layoutu |
| `docs/layout_auth_ui.md` | Layout a autentizace |
| `docs/stav-struktury.md` | Přehled stavu komponent |
| `docs/todo_list.md` | Seznam úkolů |
| `ikons.md` | Kompletní katalog ikon |

---

*Dokument vytvořen: 2025-12-01*
*Verze aplikace: 1.0.0*
