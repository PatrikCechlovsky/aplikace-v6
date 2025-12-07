# /docs/02-architecture.md
## Popis: Tento dokument obsahuje architekturu aplikace a strukturu systému.
---
# 03 – UI systém a komponenty

## 1. Přehled UI architektury

Aplikace využívá pevně daný 6-sekční layout:

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

## 2. UI prvky – detailní popis

### 2.1 HomeButton
- obsahuje název aplikace + ikonu domů
- reaguje na kliknutí (onClick)
- má stav `disabled`
- při kliknutí navrací uživatele na dashboard

### 2.2 Sidebar
- dynamicky načítá moduly
- zobrazuje ikony i popisy
- podporuje aktivní modul (`activeModuleId`)
- volá `onModuleSelect`

### 2.3 Breadcrumbs

Aktuální stav:
- statická verze: „Dashboard / Domov“
- zobrazuje ikonku domů (přes getIcon)

Budoucí stav:
- dynamický builder podle aktivního modulu / dlaždice / detailu
- vícestupňová cesta (např. Modul > Přehled > Detail)

### 2.4 HomeActions

V pravé části horní lišty.

Obsah:
- displayName uživatele  
- ikona profilu 👤 (placeholder)  
- lupa 🔍 (globální search – placeholder)
- zvonek 🔔 (notifikace – placeholder)
- tlačítko **Odhlásit**

Podpora:
- `disabled` stav (před přihlášením)

### 2.5 CommonActions (verze 1)

Aktuálně pevný výpis tlačítek pro demonstraci UI.

Centrální definice akcí:

- add, edit, view, duplicate, attach  
- archive, delete  
- save, saveAndClose, cancel  

Budoucí systém (verze 2):
- konfigurace akcí v `module.config.js`
- kombinace s oprávněními podle role
- kombinace se stavem formuláře (dirty / clean)
- filtr podle výběru položky (requiresSelection)

### 2.6 Content

- zobrazuje přehled, detail, formulář
- renderuje se podle aktivního modulu a stavu aplikace
- login panel se zobrazuje mimo modulový systém (před přihlášením)

---

## 3. Základní pravidla UI (CODESTYLE)

Obecně:
- komponenty v `app/UI/` jsou malé, znovupoužitelné
- vizuální logika (layout, barvy, stavy) patří do UI
- business logika patří do modulů nebo services
- žádné přímé volání Supabase z UI komponent
- žádné hooky nebo funkce uvnitř JSX — vždy nad `return`
- ikony pouze přes `getIcon(name)`

Detailnější UI pravidla jsou v dokumentu `CODESTYLE.md` / `09-project-rules.md`.

---

## 4. Stav implementace UI

| Oblast                     | Stav                            |
|----------------------------|---------------------------------|
| Základní layout            | ✔ Hotovo                        |
| Sidebar engine             | ✔ Hotovo                        |
| HomeButton                 | ✔ Hotovo                        |
| Breadcrumbs                | ✔ Hotovo (zatím statické)      |
| HomeActions                | ✔ DisplayName + ikony + logout |
| CommonActions              | ✔ Verze 1 (pevné), ⏳ Verze 2   |
| Form engine – UI část      | ✔ Základ                        |
| UI pro Dokumenty/Komunikaci/Služby | ⏳ V přípravě           |

---

## 5. TODO – UI systém

### Nejbližší úkoly
- dynamické breadcrumbs  
- globální search v HomeActions  
- notifikační panel  
- CommonActions v2 (podle modulu, role, stavu)  
- jednotný Form Engine (FormFieldText, Select, MultiSelect, Boolean)  

### Střednědobé úkoly
- Table komponenta pro přehledy
- Modální okna
- Toast notifikace

### Dlouhodobé úkoly
- pokročilé UI pro komunikaci a dokumenty
- dashboard s widgety
- responzivní layout pro mobil

---

## 6. Závěr

Tento dokument se zaměřuje výhradně na UI:

- jak je rozvržen layout  
- jak fungují klíčové komponenty  
- jaká jsou základní pravidla pro jejich použití  
- jaký je stav implementace a plán dalšího rozvoje  

Slouží jako referenční dokument pro návrh a implementaci uživatelského rozhraní.
