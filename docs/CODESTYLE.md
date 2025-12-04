# 📏 CODESTYLE – projekt Pronajímatel v6

Cílem je udržet aplikaci **modulární, stabilní, čitelnou a dlouhodobě rozšiřitelnou**.  
Tento dokument je **závazný** pro veškerý nový kód v projektu `aplikace-v6`.

---

## 0. ZÁKLADNÍ PRINCIPY

1. **UI oddělené od logiky**
   - UI komponenty (v `app/UI/` a uvnitř modulů) jsou co nejvíc „hloupé“.
   - Nepřistupují přímo k Supabase – žádné `supabase.from(...)` v komponentách.
   - Neřeší business logiku, pouze vykreslují data + emitují události.

2. **Logika v `app/lib` a `services`**
   - připojení k databázi (Supabase klient)
   - autentizace (`services/auth.ts`)
   - business logika (např. `subjectTypes.ts`)
   - helpers a utility funkce
   - UI zavolá jen funkci z `lib/services`, nikdy ne přímo DB.

3. **Modulový systém**
   - Každý modul má vlastní složku v `app/modules/`.
   - Moduly jsou načítány dynamicky přes `modules.index.js`.
   - Nikde v UI není přímý import konkrétního modulu – vše přes modulový engine.

4. **Žádné inline CSS**
   - Všechny styly patří do `app/globals.css` (příp. budoucí modulární CSS).
   - Inline styly (`style={{ ... }}`) jsou zakázané, kromě výjimečných utilit (např. dynamic width u progressbaru).

5. **Jednotný 6-sekční layout**
   - Každý hlavní pohled používá 6-blokový layout:
     1. HomeButton
     2. Sidebar
     3. Breadcrumbs
     4. HomeActions
     5. CommonActions
     6. Content
   - Nové UI komponenty musí být navrženy tak, aby do tohoto layoutu zapadaly.

---

## 1. POVINNÁ HLAVIČKA SOUBORU

Každý **TS/TSX/JS** soubor v projektu musí začínat hlavičkou:

```ts
/*
 * FILE: app/UI/Sidebar.tsx
 * PURPOSE: Dynamický sidebar modulů
 */
```

Pravidla:
- `FILE:` obsahuje **absolutní cestu v rámci projektu** (začíná `app/` nebo `docs/`).
- `PURPOSE:` krátce a srozumitelně popisuje **účel souboru** (max. 1–2 řádky).
- Hlavička se používá i v modulech, services, docs (přizpůsobit cestu).

---

## 2. STRUKTURA PROJEKTU – ROLE ADRESÁŘŮ

- `app/UI/` – znovupoužitelné UI komponenty (HomeButton, Sidebar, HomeActions, CommonActions, Tabs, ListView atd.).  
- `app/modules/` – byznys-moduly (Nemovitosti, Nájemníci, Smlouvy…). Každý modul má:
  - `module.config.js`
  - `tiles/` – přehledové „dlaždice“
  - `forms/` – formuláře
  - `services/` (volitelně) – modulová logika
- `app/lib/` – společná logika:
  - `supabaseClient.ts`
  - `uiConfig.ts`
  - `services/auth.ts`
  - další sdílené services
- `docs/` – dokumentace (`README`, `CODESTYLE`, `UI-specifikace`, `stav-struktury`, `todo_list`…)
- `ikons.md` – katalog všech ikon používaných v systému.

---

## 3. POJMENOVÁNÍ

### 3.1 Komponenty (UI)
- **Formát:** PascalCase
- **Příklady:**  
  `HomeButton.tsx`, `HomeActions.tsx`, `CommonActions.tsx`, `LoginPanel.tsx`, `SubjectTypesTile.tsx`

### 3.2 Funkce a proměnné
- **Formát:** camelCase
- **Příklady:**  
  `loadModules()`, `handleLogout`, `activeModuleId`, `displayName`

### 3.3 CSS třídy
- **Formát:** BEM-like s prefixem podle komponenty
- **Příklady:**  
  `sidebar`, `sidebar__item`, `home-actions__user`, `common-actions__btn`

### 3.4 Moduly
- **Formát:** `<číslo>-<kebab-case>`
- **Příklady:**  
  `010-sprava-uzivatelu`, `040-nemovitost`, `050-najemnik`, `900-nastaveni`

### 3.5 Typy a rozhraní (TypeScript)
- **Formát:** PascalCase, prefix `T` nebo jasný název entity
- **Příklady:**  
  `SessionUser`, `ModuleConfig`, `CommonActionId`, `SubjectType`

---

## 4. IKONY A EMOJI

### 4.1 Centrální správa ikon
- Ikony jsou definované v:
  - `ikons.md` – zdrojový seznam ikon + jejich význam
  - `app/UI/icons.ts` – mapování klíč → skutečná ikona/emoji

### 4.2 Pravidla používání
- **Nikdy** nepíšeme emoji přímo do komponenty.  
- Vždy používáme:

```tsx
import { getIcon } from '@/app/UI/icons'

<span className="sidebar__icon">
  {getIcon('building')}
</span>
```

- Pokud ikona v mapě chybí, **nejdřív ji doplníme** do `icons.ts` a `ikons.md`, teprve potom použijeme.

---

## 5. UI KOMPONENTY – OBECNÁ PRAVIDLA

1. **Minimum logiky** – komponenta řeší jen:
   - rozložení (layout)
   - styly (CSS třídy)
   - transformaci props → UI
   - volání callbacků (např. `onLogout`, `onModuleSelect`).

2. **Žádné DB dotazy ani Supabase volání**
   - UI dostává data z vyšší vrstvy (services / page).
   - Např. `HomeActions` pouze přijímá `displayName`, nečte přímo session.

3. **Podpora `disabled`**
   - Každá interaktivní komponenta má volitelné `disabled?: boolean`.
   - `disabled` ovlivní vzhled (např. snížená opacita) i interakci (tlačítka neklikají).

4. **Žádné hooky uvnitř JSX**
   - všechny `useState`, `useEffect`, `useMemo`, `useCallback` atd. jsou **nahoře v komponentě**, před `return`.
   - nikdy neuvnitř podmíněného renderu.

5. **Žádné funkce přímo v JSX**
   - místo:
     ```tsx
     <button onClick={() => doSomething(id)}>Klik</button>
     ```
   - použijeme:
     ```tsx
     const handleClick = () => doSomething(id)

     <button onClick={handleClick}>Klik</button>
     ```

---

## 6. SPECIFICKÉ KOMPONENTY A JEJICH ROLE

### 6.1 HomeButton
- Soubor: `app/UI/HomeButton.tsx`
- Účel: název aplikace + návrat na dashboard.
- Props:
  ```ts
  type HomeButtonProps = {
    disabled?: boolean
    onClick?: () => void
  }
  ```

### 6.2 Sidebar
- Soubor: `app/UI/Sidebar.tsx`
- Načítá moduly z `modules.index.js` a zobrazuje je v levém sloupci.
- Props (zjednodušeně):
  ```ts
  type SidebarProps = {
    disabled?: boolean
    activeModuleId?: string
    onModuleSelect?: (moduleId: string) => void
  }
  ```
- Sidebar **nikdy** sám neřeší oprávnění ani data – pouze renderuje seznam modulů.

### 6.3 Breadcrumbs
- Soubor: `app/UI/Breadcrumbs.tsx`
- Ukazuje aktuální cestu (zatím základní „Dashboard / Domov“).
- Do budoucna: dynamická cesta podle modulu / detailu.
- Breadcrumbs nesmí mizet – vždy nad `Content`.

### 6.4 HomeActions
- Soubor: `app/UI/HomeActions.tsx`
- Pravá část horní lišty.
- Zobrazuje:
  - `displayName` (z metadata Supabase)
  - ikonu uživatele, lupy, zvonku
  - tlačítko **Odhlásit**
- Props (zjednodušeně):
  ```ts
  type HomeActionsProps = {
    disabled?: boolean
    displayName: string
    onLogout?: () => void
  }
  ```

### 6.5 CommonActions
- Soubor: `app/UI/CommonActions.tsx`
- Zobrazuje lištu obecných akcí (Přidat, Upravit, Archivovat, atd.).
- Centrální definice akcí:

  ```ts
  export type CommonActionId =
    | 'add'
    | 'edit'
    | 'view'
    | 'duplicate'
    | 'attach'
    | 'archive'
    | 'delete'
    | 'save'
    | 'saveAndClose'
    | 'cancel'
  ```

- Každá akce má definici v `COMMON_ACTION_DEFS` (id, icon, label, případně `requiresSelection`, `requiresDirty`).  
- Verze 1: pevný seznam tlačítek (pro demoverzi UI).  
- Verze 2 (plán):
  - konfigurace v `module.config.js` podle:
    - modulu
    - typu pohledu (overview/detail/form)
    - role / oprávnění
    - stavu formuláře (dirty)
    - výběru řádku (selection).

---

## 7. MODULY A MODULE.CONFIG

Každý modul má v kořeni soubor `module.config.js`:

```js
/*
 * FILE: app/modules/040-nemovitost/module.config.js
 * PURPOSE: Konfigurace modulu „Nemovitosti“
 */

export default {
  id: '040-nemovitost',
  label: 'Nemovitosti',
  icon: 'building',
  order: 40,
  enabled: true,
  // Budoucí rozšíření:
  // commonActions: { overview: [...], detail: [...], form: [...] }
}
```

Pravidla:
- Moduly **se neimportují napřímo** v UI – vždy přes `modules.index.js`.
- `order` definuje pořadí v sidebaru.
- `enabled: false` modul schová, ale kód zůstává připravený.

---

## 8. PRÁCE SE SUPABASE A AUTH

- Supabase klient je pouze v `app/lib/supabaseClient.ts` nebo případných services.
- UI komponenty pracují jen s daty, které dostanou přes props.
- Autentizace se řeší v:
  - `services/auth.ts`
  - `page.tsx` (načtení session, listener `onAuthStateChange`)

`SessionUser` typ:

```ts
type SessionUser = {
  email: string | null
  displayName?: string | null
}
```

DisplayName se sestavuje z metadata v tomto pořadí:
1. `display_name`
2. `full_name`
3. `name`
4. `email`
5. `"Uživatel"`

---

## 9. GIT A COMMITS

- Commity by měly být **krátké a významově ucelené**.
- Návrh prefixů:
  - `feat:` – nová funkce
  - `fix:` – oprava chyby
  - `refactor:` – úprava kódu bez změny funkce
  - `docs:` – úprava dokumentace
  - `style:` – čistě vizuální změny (CSS, spacing)
  - `chore:` – údržba, závislosti, skripty

Příklad:  
`feat: add HomeActions with displayName`

---

## 10. SHRNUJÍCÍ PRAVIDLA (ZKRÁCENÁ VERZE)

1. UI je hloupé – logika v `lib`/`services`.  
2. Žádné přímé Supabase volání z komponent.  
3. Všechny styly v `globals.css`, žádné inline `style={}`.  
4. Ikony vždy přes `getIcon()`.  
5. Modul = složka v `app/modules/` + `module.config.js`.  
6. 6-sekční layout dodržet u všech hlavních obrazovek.  
7. Komponenty s `disabled` props, žádné hooky uvnitř JSX.  
8. Event handlery před `return`, ne anonymní funkce v JSX.  
9. Hlavička `FILE` + `PURPOSE` na začátku každého souboru.  
10. Při pochybnostech – raději doplnit do CODESTYLE, než vymýšlet výjimku.

---

Tento CODESTYLE platí pro všechny nové i upravované soubory v projektu **Pronajímatel v6**.
