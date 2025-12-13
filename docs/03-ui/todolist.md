# TODO – DetailView sekce jako ouška (Tabs) v aplikace-v6

Cíl: mít v appce DetailView, které je složené z **Header + Tabs (ouška) + Active Section**.
Sekce budou definované **centrálně** (registry) a jednotlivé entity jen řeknou **které sekce** chtějí zobrazit.

---

## 0) Mini pravidla práce (aby se to nerozbilo)
- [ ] Po každé fázi udělat malý commit (např. `feat(detail-tabs): phase-1`)
- [ ] Nic nemazat – když něco nahrazujeme, označit staré jako `// ARCHIVE` nebo přesun do `docs/archive/`
- [ ] CSS jen přes theme tokeny (žádné tvrdé barvy)

---

## FÁZE 1 – Ouška (Tabs) napevno v jednom DetailView (rychle viditelný výsledek)
**Cíl:** vidět ouška pod nadpisem a přepínat placeholder obsah.

- [ ] Vybrat pilotní DetailView/DetailFrame (doporučení: modul 010 user detail nebo libovolný existující detail, kde už je header)
- [ ] Přidat komponentu `DetailTabs` (jen UI + active state + onChange)
- [ ] Přidat CSS `detail-tabs.css` (outline, active tab “napojený” na panel, hover)
- [ ] Napojit CSS do `globals.css` (nebo centrálního importu komponentních CSS)
- [ ] V pilotním DetailFrame:
  - [ ] vložit `<DetailTabs />` **pod header**
  - [ ] udělat `activeTab` state a přepínat 2–3 testovací bloky

✅ Hotovo, když: v appce vidím 3 ouška, aktivní je zvýrazněné, obsah se přepíná a funguje v light/dark.

---

## FÁZE 2 – Datový model sekcí (registry)
**Cíl:** sekce definovat jednou a opakovaně používat.

- [ ] Definovat typ `DetailSection`:
  - `id: string`
  - `label: string`
  - `icon?: string`
  - `order?: number`
  - `visibleWhen?: (ctx) => boolean`
  - `render: (ctx) => ReactNode`
- [ ] Vytvořit centrální registry: `DETAIL_SECTIONS`
- [ ] Založit 3 demo sekce (obsah zatím jednoduchý):
  - [ ] `basics` – Základní informace
  - [ ] `notes` – Poznámky
  - [ ] `audit` – Audit / metadata

✅ Hotovo, když: registry exportuje 3 sekce a lze je použít bez kopírování kódu.

---

## FÁZE 3 – Napojení registry do generického DetailView
**Cíl:** DetailView dostane jen `sectionIds` a vykreslí vše automaticky.

- [ ] Upravit generický rámec detailu (EntityDetailFrame / DetailView):
  - [ ] přijme `sectionIds: string[]`
  - [ ] načte sekce z `DETAIL_SECTIONS`
  - [ ] vyfiltruje podle `visibleWhen`
  - [ ] seřadí podle `order`
  - [ ] vykreslí `DetailTabs` + `activeSection.render(ctx)`
- [ ] Fallback pro aktivní tab:
  - [ ] pokud aktivní tab neexistuje → přepnout na první dostupný

✅ Hotovo, když: u pilota přestanu psát testovací obsah a používám `sectionIds`.

---

## FÁZE 4 – UX pravidla (aby to bylo “excelově” čisté)
- [ ] Pokud je jen 1 sekce → Tabs skrýt (zobrazit rovnou obsah)
- [ ] Pokud je sekcí hodně → Tabs řádek:
  - [ ] horizontální scroll
  - [ ] bez rozbití layoutu
- [ ] Volitelně: uložit aktivní tab do URL `?tab=notes` (sdílení + návrat)

✅ Hotovo, když: dlouhá řada oušek se dá scrollovat a nic nepřetéká.

---

## FÁZE 5 – Pilot entita (první “reálně hotovo”)
**Cíl:** jedna entita má finální systém sekcí.

- [ ] Vybrat 1 entitu (doporučení: 010 uživatel nebo 020 můj účet)
- [ ] Nastavit `sectionIds` (4–6 max):
  - [ ] `basics`
  - [ ] `contact`
  - [ ] `roles`
  - [ ] `security`
  - [ ] `audit`
- [ ] Postupně plnit obsah sekcí (nejdřív read-only, potom edit)

✅ Hotovo, když: entita má ouška, sekce dávají smysl a je to jednotné s theme.

---

## FÁZE 6 – Rozšíření a reuse napříč appkou
- [ ] Použít stejné sekce u druhé entity (reuse bez kopie)
- [ ] Vytvořit univerzální sekce, které budou skoro všude:
  - [ ] Základ
  - [ ] Poznámky
  - [ ] Audit
- [ ] Dopsat do docs: „Jak přidat sekci do registry“ + „Jak ji použít v entitě“

✅ Hotovo, když: druhý detail používá stejné sekce jen jiným výběrem `sectionIds`.

---

## Poznámky ke stylu (theme + CSS)
- Tabs musí používat existující tokeny:
  - `--color-surface`, `--color-border`, `--color-text`, `--color-muted`
  - (pro active stav ideálně) `--color-selected-row-bg` nebo nový token pro “active tab”
- Aktivní tab vizuálně “napojený” na panel:
  - aktivní tab má stejný background jako obsah
  - spodní border aktivního tabu se opticky ztratí (napojení)

---
