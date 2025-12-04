# 🏠 Pronajímatel v6 — Kompletní dokumentace (aktuální stav)

Tento dokument shrnuje **celý současný stav projektu**, vše co jsme spolu vytvořili, a zároveň definuje **pravidla pro další práci**.  
Je plně konsolidovaný, profesionálně uspořádaný a připravený pro vývojáře i budoucí rozšiřování.

---

# 0. CÍL APLIKACE

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
- **Next.js 14 (App Router)**
- **Supabase Auth + DB + RLS**
- **Modulárním UI frameworku**
- **Striktně definovaném 6‑sekčním layoutu**

---

# 1. ARCHITEKTURA UI — 6 SEKČNÍ LAYOUT

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

### Stav implementace
| Sekce | Stav |
|-------|------|
| Sidebar | ✔ Hotovo |
| HomeButton | ✔ Hotovo |
| Breadcrumbs | ✔ Základní verze |
| HomeActions | ✔ DisplayName, ikonky, logout |
| CommonActions | ✔ Verze v1 (pevná), připravená na dynamiku |
| Content Engine | ✔ Základní rendering |

---

# 2. AUTENTIZACE – Supabase Auth

Aplikace pracuje se stavem:

```ts
type SessionUser = {
  email: string | null
  displayName?: string | null
}
```

### DisplayName se načítá z:
- `session.user.user_metadata.display_name`
- fallback `full_name`
- fallback `name`
- fallback `email`
- fallback `"Uživatel"`

### Funkční logika:
- `getCurrentSession()` načte session při otevření aplikace
- `onAuthStateChange()` detekuje login/logout
- `HomeActions` zobrazují displayName + ikony + odhlášení
- nepřihlášený uživatel může vidět pouze login panel

---

# 3. MODULÁRNÍ SYSTÉM A STRUKTURA MODULŮ

Každý modul má strukturu:

```
app/modules/<id>-<nazev>/
  module.config.js
  tiles/
  forms/
  overview/
```

### module.config.js musí obsahovat:
```js
{
  id: '040-nemovitosti',
  label: 'Nemovitosti',
  icon: 'building',
  order: 40,
  enabled: true,
  // budoucí rozšíření:
  // commonActions: { overview: [...], detail: [...], form: [...] }
}
```

### Dynamické načítání modulů
Sidebar automaticky:
- načte vše z `MODULE_SOURCES`
- odfiltruje `enabled === false`
- seřadí podle `order`

---

# 4. UI PRVKY — DETAILNÍ POPIS

## 4.1 HomeButton
- obsahuje název aplikace + ikonu domů
- reaguje na kliknutí (`onClick`)
- má stav `disabled`
- při kliknutí navrací uživatele na dashboard

## 4.2 Sidebar
- dynamicky načítá moduly
- zobrazuje ikony i popisy
- podporuje aktivní modul (`activeModuleId`)
- volá `onModuleSelect`

## 4.3 Breadcrumbs
Aktuální stav:
- statická verze: „Dashboard / Domov“
- zobrazuje ikonku domů (přes getIcon)

Budoucí stav:
- dynamický builder podle aktivního modulu / dlaždice / detailu
- vícestupňová cesta

## 4.4 HomeActions
V pravé části horní lišty.

Obsah:
- displayName uživatele  
- ikona profilu 👤 (placeholder)  
- lupa 🔍 (globální search – placeholder)
- zvonek 🔔 (notifikace – placeholder)
- tlačítko **Odhlásit**

Podpora:
- `disabled` stav (před přihlášením)

## 4.5 CommonActions (verze 1)
Aktuálně pevný výpis tlačítek pro demonstraci UI.

Centrální definice akcí:
```
add, edit, view, duplicate, attach,
archive, delete,
save, saveAndClose, cancel
```

Budoucí systém (verze 2):
- konfigurace akcí v `module.config.js`
- kombinace s oprávněními podle role
- kombinace se stavem formuláře (dirty / clean)
- filtr podle výběru položky (requiresSelection)

## 4.6 Content
- zobrazuje přehled, detail, formulář
- renderuje se podle aktivního modulu a stavu aplikace
- login panel se zobrazuje mimo modulový systém

---

# 5. CODESTYLE (ZÁKLADNÍ PRAVIDLA)

### Obecně:
- komponenty v `app/UI/` jsou malé, znovupoužitelné
- moduly v `app/modules/` obsahují business logiku
- názvy komponent: **PascalCase**
- názvy props/ proměnných: **camelCase**
- event handlery: `onXxx`, interně `handleXxx`
- žádné hooky nebo funkce uvnitř JSX — vždy nad `return`
- všechny ikony přes `getIcon(name)`

---

# 6. STAV IMPLEMENTACE (PŘEHLED)

| Oblast | Stav |
|--------|------|
| Základní layout | ✔ Hotovo |
| Sidebar engine | ✔ Hotovo |
| HomeButton | ✔ Hotovo |
| Breadcrumbs | ✔ Hotovo (zatím statické) |
| HomeActions | ✔ DisplayName + ikony + logout |
| CommonActions | ✔ Verze 1 (pevné), ⏳ Verze 2 |
| Dynamické akce podle modulů | ⏳ |
| Role & oprávnění | ⏳ |
| Form engine | ✔ Základ |
| Moduly Dokumenty / Komunikace / Služby | ⏳ |

---

# 7. TODO — CO BUDEME DĚLAT DÁL

### 🔜 Nejbližší úkoly
- propojit CommonActions s module.config.js  
- přidat definici akcí pro každý formulář / dlaždici  
- zavést role & permission systém  
- dynamické breadcrumbs  
- stav výběru v přehledech (requiresSelection)  
- dirty state formuláře (requiresDirty)  

### 🔜 Střednědobé úkoly
- rozšíření modulů (Služby, Komunikace, Dokumenty)
- vylepšení dashboardu
- přidání univerzálního Form Engine

### 🔜 Dlouhodobé úkoly
- notifikační centrum
- automatické generování dokumentů
- e-mailové šablony

---

# 8. ZÁVĚR

Tento dokument představuje konzolidovaný stav projektu Pronajímatel v6  
a slouží jako závazný referenční dokument pro vývoj.

Jakékoliv nové UI nebo modul MUSÍ respektovat:
1. 6‑sekční layout  
2. CommonActions v definované podobě  
3. Modulární architekturu  
4. Supabase autentizaci a práci s metadaty  
