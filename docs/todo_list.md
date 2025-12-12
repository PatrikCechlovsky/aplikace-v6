# 📋 TODO List — Pronajímatel v6
Kompletní seznam úkolů, rozdělený podle oblastí vývoje.  
Obsahuje vše, co je potřeba pro dokončení UI, logiky, modulů i dokumentace.

---

# 1. 🔐 AUTENTIZACE & UŽIVATELÉ

## ✔ Hotovo
- Načítání session při startu aplikace.
- Poslech `onAuthStateChange`.
- Zobrazení displayName v HomeActions.
- Odhlášení uživatele.
- Fallback logika displayName.

## ⏳ Udělat
- Nastavení avataru uživatele.
- Editace uživatelského profilu (modul „Můj účet“).
- Implementace rolí a oprávnění.
- Specifikace permission matrix.
- Uložení auditních stop (v2).

---

# 2. 🧭 UI LAYOUT (6-SEKČNÍ)

## ✔ Hotovo
- Celá struktura layoutu:
  - Sidebar
  - HomeButton
  - Breadcrumbs
  - HomeActions
  - CommonActions
  - Content
- CSS a rozmístění prvků.

## ⏳ Udělat
- Dynamické breadcrumbs.
- Animace sidebaru (otevřít / zavřít).
- Mobilní varianta layoutu.
- Globální search bar (v HomeActions).
- Notifikační panel.

---

# 3. 🎨 UI KOMPONENTY

## ✔ Hotovo
- HomeButton
- Sidebar
- Breadcrumbs (základ)
- HomeActions
- CommonActions verze 1
- Ikonový systém

## ⏳ Udělat
- CommonActions verze 2
  - akce podle modulu
  - akce podle role
  - akce podle stavu (dirty/selection)
- Table komponenta pro přehledy
- Jednotný Form Engine:
  - FormFieldText
  - FormFieldSelect
  - FormFieldMultiSelect
  - FormFieldBoolean
- Modální okna
- Toast notifikace

---

# 4. 📦 MODULY

## ✔ Hotovo — základní kostry
- 010 Správa uživatelů
- 020 Můj účet
- 030 Pronajímatel
- 040 Nemovitost
- 050 Nájemník
- 900 Nastavení

## ⏳ Udělat — rozšíření modulů
### Modul Nemovitosti
- Přidat seznam vybavení
- Navázat jednotky na nemovitosti
- Detail + formulář + přehled

### Modul Nájemník
- Kompletní formulář všech polí
- Napojení na smlouvy

### Modul Smlouvy
- Vytvořit datový model
- Validace smluvních období
- Vazby na nájemníky a jednotky

### Modul Platby / Finance
- Platební kalendář
- QR generátor
- Filtrování dle období

### Modul Měřidla
- Základní evidence
- Import odečtů
- Automatická tvorba vyúčtování (v2)

### Modul Dokumenty
- Šablony e-mailů
- Generování PDF
- Archiv dokumentů

### Modul Komunikace
- Historie zpráv
- Štítky komunikace
- Automatizované zprávy podle událostí

---

# 5. 🧠 LOGIKA & SERVICES

## ✔ Hotovo
- Auth service
- Supabase client
- Module loader

## ⏳ Udělat
- Permission service
- CommonActions engine
- DynamicBreadcrumbs builder
- FormState manager
- Centralizace všech datových validací

---

# 6. 📚 DOKUMENTACE

## ✔ Hotovo
- README-profesionalni.md
- UI-SPECIFIKACE.md
- stav-struktury.md
- CODESTYLE-novy.md
- PREHLED-APLIKACE-KONSOLIDOVANY.md

## ⏳ Udělat
- ikons.md (kompletní katalog ikon)
- modulová dokumentace (každý modul zvlášť)
- uživatelský HELP systém
- workflow diagramy
- datové modely (vizuální ER diagram)

---

# 7. 🛠️ INFRA & TECH

## ⏳ Udělat
- Optimalizace buildů
- CI/CD GitHub Actions
- Logování chyb v produkci
- Testy (unit + integration)

---

# 8. 🔮 BUDOUCNOST

## Plánované funkce:
- Automatizace procesů (workflow engine)
- Napojení na email API (SendGrid / Postmark)
- Mobilní aplikace (v2)
- Zabezpečení přístupu ke konkrétním modulům
- Rozhraní pro externí API

---

# 9. 🧹 KAŽDODENNÍ ÚDRŽBA

- Udržovat dokumentaci aktuální.
- Po dokončení úkolu přesunout z „Uděláme“ do „Hotovo“.
- Každá nová funkce musí mít popis v dokumentaci.
- Každá změna UI musí být propsána v UI-SPECIFIKACI.

---

# 10. ZÁVĚR

Tento TODO list je **živý dokument**.  
Slouží k řízení vývoje a kontrole, co už bylo splněno a co nás čeká.

Je doporučeno aktualizovat jej po:

- dokončení každé komponenty,
- přidání nového modulu,
- úpravě logiky,
- nebo změně dokumentace.

---

## DOPLNĚNÍ (2025-12-12) – Konsolidace UI a modulového postupu

### ✅ UZAVŘENO – UI ARCHITEKTURA & DOKUMENTACE
Následující oblast je považována za **architektonicky hotovou**:

- UI architektura (AppShell, layout, role vrstev)
- Routing vs UI layout
- UI konfigurace (theme, accent, menu, icons)
- Sidebar / TopMenu – jednotný model, různé renderery
- Modul 900 jako zdroj UI konfigurace
- UI-specifikace
- UI-system
- stav-struktury
- glossary (pojmy)

➡️ Další změny v UI architektuře **pouze formou doplnění**, nikoliv přepisů.

---

### 🔄 NOVÝ STANDARD – MODULOVÝ POSTUP
Od tohoto data platí:

- Každý modul musí mít:
  - vlastní `MODULE-TODO.md`
  - postup dle dokumentu **POSTUP.md**
- Implementace modulu **nesmí začít**, dokud:
  - není vyplněn MODULE-TODO
  - nejsou definována pole, selecty, role a UI struktura

---

### ⏳ AKTUÁLNÍ PRIORITY (DLE POSTUPU)

#### Modul 010 – Správa uživatelů
- [ ] Ověřit MODULE-TODO dle POSTUP.md
- [ ] Zkontrolovat generic types (role, permissions)
- [ ] Navázat na modul 900 (číselníky)
- [ ] Implementace ListView + DetailView podle checklistu

#### Modul 020 – Můj účet
- [ ] Ověřit MODULE-TODO dle POSTUP.md
- [ ] Oddělit „self-edit“ logiku od admin logiky
- [ ] Napojení na auth flow (2FA, změna hesla)

#### Modul 900 – Nastavení
- [ ] Vytvořit MODULE-TODO (nový)
- [ ] Definovat všechny GenericTypeTiles
- [ ] UI nastavení (theme, menu, icons) = referenční modul
- [ ] Dokumentační autorita pro číselníky

---

### 📌 POZNÁMKA
Tento TODO list řídí **prioritu práce**,  
MODULE-TODO soubory řídí **konkrétní implementaci**.
## TODO – TopMenu (horní menu) + CommonActions

### 1️⃣ Aktivní stav TopMenu (MVP)
- [ ] Napojit `TopMenu` na `activeModuleId`
- [ ] Zvýraznit aktivní modul (`.topmenu__item--active`)
- [ ] Ověřit, že klik na modul:
  - nastaví `activeModuleId`
  - zruší předchozí výběr sekce / tile

---

### 2️⃣ TopMenu – struktura obsahu (logika)
- [ ] Replikovat **logiku Sidebaru** pro TopMenu:
  - modul (level 1)
  - sekce (level 2)
  - tile (level 3)
- [ ] Zachovat stejný typ výběru:
  ```ts
  {
    moduleId: string
    sectionId?: string | null
    tileId?: string | null
  }

## TODO – TopMenu (horní menu) + CommonActions

1) Aktivní stav TopMenu (MVP)
- [ ] Napojit `TopMenu` na `activeModuleId`
- [ ] Zvýraznit aktivní modul (`.topmenu__item--active`)
- [ ] Ověřit, že klik na modul:
  - [ ] nastaví `activeModuleId`
  - [ ] zruší předchozí výběr `sectionId` / `tileId` (tj. návrat na “úvod modulu”, pokud nebylo vybráno nic dalšího)

2) TopMenu – struktura obsahu (logika)
- [ ] Replikovat navigační logiku Sidebaru pro TopMenu (jen UI bude jiné):
  - [ ] modul (level 1)
  - [ ] sekce (level 2)
  - [ ] tile (level 3; svázané přes `tile.sectionId`)
- [ ] Zachovat stejný typ výběru jako Sidebar:
  - [ ] `SidebarSelection = { moduleId: string, sectionId?: string | null, tileId?: string | null }`
- [ ] TopMenu musí volat `handleModuleSelect(...)` stejně jako Sidebar:
  - [ ] modul: `handleModuleSelect({ moduleId })`
  - [ ] sekce: `handleModuleSelect({ moduleId, sectionId })`
  - [ ] tile: `handleModuleSelect({ moduleId, sectionId, tileId })`

3) TopMenu – UI chování
- [ ] Modul bez children → klik rovnou aktivuje modul (žádné podmenu)
- [ ] Modul s children → klik otevře podmenu (dropdown nebo “druhý řádek”)
- [ ] V podmenu zobrazit:
  - [ ] seznam sekcí modulu
  - [ ] po rozkliknutí sekce zobrazit tiles v dané sekci
  - [ ] fallback: pokud modul nemá sections → zobrazit tiles rovnou
- [ ] Aktivní položky (vizuálně):
  - [ ] aktivní modul
  - [ ] aktivní sekce (pokud vybraná)
  - [ ] aktivní tile (nejhlubší úroveň)

4) TopMenu – UX pravidla
- [ ] V jeden okamžik otevřené pouze jedno podmenu (1 aktivní “expanded” modul)
- [ ] Klik mimo TopMenu zavře podmenu
- [ ] Změna modulu zavře předchozí podmenu
- [ ] Konzistence chování se Sidebarem (TopMenu je jiná vizualizace, ne jiná logika)

5) Layout – CommonActions v TopMenu režimu (AŽ POTOM)
- [ ] Neřešit dřív, dokud TopMenu nebude funkční a otestovatelné
- [ ] Upravit `layout__actions` na 2 řádky:
  - [ ] řádek 1: `TopMenu`
  - [ ] řádek 2: `CommonActions`
- [ ] CommonActions zarovnat doprava
- [ ] Sidebar režim zůstává beze změny

6) Test scénáře
- [ ] Přepnutí Sidebar ↔ TopMenu
- [ ] Aktivace modulu bez sekcí
- [ ] Aktivace modulu se sekcemi
- [ ] Výběr tile → registrace `CommonActions` (lišta se objeví a je správně zarovnaná)
- [ ] Přihlášen / odhlášen stav (disabled chování)
- [ ] Zavírání podmenu klikem mimo / změnou modulu

Poznámka: TopMenu je pouze alternativní prezentace stejné navigační logiky jako Sidebar. Žádná duplicitní business logika.
