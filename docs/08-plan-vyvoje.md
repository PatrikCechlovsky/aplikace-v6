# /docs/08-plan-vyvoje.md
## Popis: Tento dokument obsahuje plán vývoje aplikace Pronajímatel v6 – krátkodobé, střednědobé a dlouhodobé cíle.
---

# 08 – Plán vývoje (Roadmapa)

Cílem tohoto dokumentu je definovat jasnou, realistickou a kontinuální roadmapu vývoje aplikace Pronajímatel v6.

Plán je rozdělen do tří úrovní:

- **Krátkodobé** (týdny)
- **Střednědobé** (měsíce)
- **Dlouhodobé** (strategický směr)

---

# 1. Krátkodobé cíle (nejbližší týdny)

## 1.1 UI systém a jádro aplikace
- dokončit **CommonActions v2**  
  - akce podle modulu  
  - akce podle role  
  - akce podle stavu formuláře (dirty / clean)  
  - akce podle výběru položky (requiresSelection)
- implementovat **dynamické breadcrumbs**
- sjednotit vzhled všech formulářů (GenericForm layout)
- dopracovat jednotný **FormField systém**:
  - text
  - select
  - multiselect
  - number
  - boolean

## 1.2 Modul 900 – Nastavení
- dopracovat SubjectTypesTile, UnitTypesTile, ServiceTypesTile
- dokončit šipky pro řazení a jejich logiku
- sjednotit barevné palety a UI pro výběr ikon
- oddělit systém číselníků pro budoucí moduly

## 1.3 Datový model – první stabilní verze
- vytvořit SQL migrace pro jádro (subjects, properties, units, tenants, contracts)
- připravit migrace pro typy a číselníky
- zavést první RLS politiky

## 1.4 Autentizace
- stabilizace session managementu
- příprava na profil uživatele (zobrazení, úprava)

---

# 2. Střednědobé cíle (1–3 měsíce)

## 2.1 Moduly aplikace (hlavní funkce)
- **Smlouvy (070)** – detailní implementace
- **Platby (080)** – evidence úhrad, variabilní symboly
- **Finance (090)** – předpisy, spoje se službami
- **Měřidla (100)** – typy, odečty, vazby na jednotky

## 2.2 Dokumenty a komunikace
- modul **Dokumenty (110)**:
  - upload dokumentů
  - generování PDF (náhled + uložit)
  - metadata dokumentů
- modul **Komunikace (120)**:
  - ukládání odeslaných e-mailů
  - propojení s dokumenty
  - šablony e-mailů (email_templates)

## 2.3 Role & Permission systém
- UI kontrola podle rolí
- backend RLS v Supabase pro:
  - SELECT
  - UPDATE
  - INSERT
  - DELETE
- mapování rolí na moduly
- mapování permissions na CommonActions

## 2.4 Tabulkové komponenty
- univerzální tabulka pro všechny přehledy:
  - řazení
  - filtrování
  - pagination
  - výběr řádku
  - akce po najetí myši → ikonky

---

# 3. Dlouhodobé cíle (3 měsíce – 1 rok)

## 3.1 Automatizace a workflow
- automatické generování nájemních smluv
- workflow „blíží se konec nájmu“
- workflow „nezaplaceno po X dnech“
- automatické e-maily a připomínky

## 3.2 Multi-tenant režim
- více pronajímatelů v jedné aplikaci
- izolace dat pomocí RLS
- oddělení dokumentů ve storage

## 3.3 Integrace
- napojení na platební brány (GoPay / Stripe)
- import bankovních výpisů (API nebo CSV)
- integrace s energetickými firmami (odečty stavu měřidel)

## 3.4 Pokročilé moduly
- **Helpdesk / Servisní požadavky**
  - závady, úkoly, workflow oprav
- **Reporty**
  - finanční reporty
  - roční přehledy
  - exporty do PDF a Excelu

## 3.5 Mobilní optimalizace
- přehledné karty
- rychlé akce pro mobilní rozhraní
- offline režim (velmi dlouhodobý cíl)

---

# 4. Milníky projektu

### Milník M1 – „Stabilní základ“
- jádro UI (HomeButton, Sidebar, Breadcrumbs, CommonActions)
- stabilní login
- modul 900 funkční pro typy

### Milník M2 – „Smlouvy a Finance“
- smlouvy
- předpisy
- platby
- jednotky a nemovitosti plně propojeny

### Milník M3 – „Dokumenty & Komunikace“
- odesílání e-mailů
- ukládání dokumentů
- PDF generátor

### Milník M4 – „Automatizace“
- workflow systém
- cron úlohy
- automatické upomínky

---

# 5. Co bude každý modul potřebovat, než půjde do produkce

Každý modul musí splnit:

- [ ] jednotný přehled (list)
- [ ] jednotný detail (detail view)
- [ ] jednotný formulář (form layout)
- [ ] definici CommonActions
- [ ] napojení na RLS
- [ ] audit-log akcí
- [ ] validace dat
- [ ] dokumentaci v `/docs`

---

# 6. Poznámky (uchováváme vše)

- AI agent bude možné integrovat později pro doporučení cen nájmů  
- přání: generovat kompletní PDF balíček smluv jedním kliknutím  
- možnost: přidat modul „Kalendář událostí“ (prohlídky, výměny měřidel)  

---

# 7. Závěr

Tento dokument slouží jako strategický plán vývoje projektu.  
Každý splněný milník postupně posouvá aplikaci od základní verze ke komplexní profesionální platformě pro správu nájemních vztahů.

