# CODESTYLE – pravidla projektu Pronajímatel v6

Cílem je udržet aplikaci modulární, stabilní, čitelnou a dlouhodobě rozšiřitelnou.

---

# 1. Obecné principy

1. **UI oddělené od logiky**
   - UI komponenty jsou čisté.
   - žádné přímé volání Supabase z UI.

2. **Logika v `app/lib`**
   - připojení k databázi
   - autentizace
   - helpers
   - budoucí services

3. **Modulový systém**
   - každý modul má vlastní složku
   - dynamicky načítáno přes `modules.index.js`

4. **Žádné inline CSS**
   - styly pouze v `globals.css`

---

# 2. Povinná hlavička každého souboru

Každý soubor musí začínat:

```ts
/*
 * FILE: app/UI/Sidebar.tsx
 * PURPOSE: Dynamický sidebar modulů
 */
```

Cesta musí být absolutní v rámci projektu.

---

# 3. Typy souborů

| Typ souboru       | Formát | Příklad                     |
|-------------------|--------|-----------------------------|
| UI komponenta     | TSX    | HomeButton.tsx             |
| Logika / helpery  | TS     | supabaseClient.ts          |
| Modul konfigurace | JS     | module.config.js           |
| Moduly index      | JS     | modules.index.js           |

---

# 4. Pojmenování

### Komponenty (UI)
- PascalCase  
  `HomeButton.tsx`, `LoginPanel.tsx`, `DetailView.tsx`

### Funkce a proměnné
- camelCase  
  `loadModules()`, `supabaseClient`

### CSS třídy
- BEM-like  
  `sidebar__item`, `login-panel__submit`

---

# 5. Ikony

Ikony jsou centralizované v:

- `ikons.md` (zdroj)
- `app/UI/icons.ts` (mapa + funkce)

Použití:

```tsx
import { getIcon } from '@/app/UI/icons'

<span>{getIcon('building')}</span>
```

❗ Emoji se **nesmí psát přímo** do UI komponent.

---

# 6. Stylování

- všechny styly v `app/globals.css`
- layout je řešen přes CSS grid
- žádné inline styly
- každý UI blok má svoji prefixovanou CSS třídu:

```
home-button__
sidebar__
login-panel__
```

---

# 7. UI komponenty

Pravidla:

- jen jednoduchá logika (render, props)
- žádné dotazy do DB
- žádné výpočty nebo business logika
- možnost `disabled`:

```tsx
type Props = {
  disabled?: boolean
}
```
---

## 7.1 Speciální formuláře typů (GenericTypeTile)

Některé číselníky (např. `subject_types`, `role_types`, `permission_types`) používají jednotnou komponentu `GenericTypeTile`.

Pro tyto obrazovky platí:

- nevyužívají standardní `CommonActions` (horní akční lišta je skrytá),
- nemají sekci „Přílohy“ – typy jsou čistá konfigurace bez dokumentů,
- akce (Předchozí, Další, Uložit, Archivovat, Nový) jsou řešeny přímo v rámci `GenericTypeTile`,
- ochrana proti ztrátě rozpracovaných změn (dirty state + potvrzovací dialog) je implementována uvnitř komponenty a později bude znovupoužitelná i pro Sidebar / přepínání modulů.

---

# 8. Moduly (`app/modules`)

Struktura modulu:

```
module.config.js
tiles/
forms/
services/
```

Konfigurace:

```js
export default {
  id: '040-nemovitost',
  label: 'Nemovitosti',
  icon: 'building',
  order: 40,
  enabled: true
}
```

Moduly se **neimportují přímo**, jen přes `modules.index.js`.

---

# 9. Autentizace

- klient: `app/lib/supabaseClient.ts`
- UI: `LoginPanel.tsx`
- session: `page.tsx`

Do budoucna bude logika přesunuta do `app/lib/services/auth.ts`.

---

# 10. Commitování

- jedna logická změna = jeden commit
- pojmenování commitů:

```
feat: add login panel with supabase auth
fix: correct sidebar module loader
chore: update grid layout in globals.css
```

---

# 11. Dokumentace

Všechny dokumenty v `docs/` musí být aktualizované:

- README.md
- CODESTYLE.md
- UI-specifikace.md
- stav-struktury.md
- todo_list.md

Po větší změně je povinná aktualizace dokumentace.
