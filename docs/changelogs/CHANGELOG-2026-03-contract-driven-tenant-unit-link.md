# Changelog: Contract-driven vazba nájemník ↔ jednotka

**Datum:** 2026-03-20  
**Moduly:** 050-najemnik, 040-nemovitost, shared services

## Co se změnilo

### 1) Nájemník: „Přiřazení jednotky ve smlouvě“
- V detailu nájemníka byla sekce přejmenována z „Přiřazení jednotky“ na **„Přiřazení jednotky ve smlouvě“**.
- Výběr jednotky už není editovatelný přímo u nájemníka.
- Detail nyní načítá přiřazení z contracts:
  - aktivní smlouva → aktivní jednotka,
  - pokud není aktivní, ale existuje budoucí → budoucí přiřazení,
  - jinak bez smlouvy.

### 2) Jednotka: stav a nájemník odvozené ze smluv
- `listUnits()` a `getUnitDetail()` nově dopočítávají stav jednotky ze smluv:
  - `occupied` = existuje aktivní smlouva,
  - `reserved` = není aktivní, ale existuje budoucí,
  - `available` = žádná aktivní ani budoucí,
  - `renovation` zůstává zachovaný pouze pokud není aktivní/budoucí smlouva.
- Nájemník u jednotky se bere z aktivní smlouvy.

### 3) Ukládání jednotky
- Uložení jednotky už neprovádí přímé přiřazení nájemníka.
- `saveUnit()` byl upraven tak, aby při UPDATE nepřepisoval `status` / `tenant_id`, pokud nejsou explicitně předány.

## Dotčené soubory
- `app/lib/services/contracts.ts`
- `app/lib/services/units.ts`
- `app/modules/050-najemnik/forms/TenantDetailFrame.tsx`
- `app/modules/050-najemnik/forms/TenantDetailForm.tsx`
- `app/modules/040-nemovitost/components/UnitDetailFrame.tsx`
- `app/modules/040-nemovitost/forms/UnitDetailForm.tsx`

## Poznámka
Tato změna je přechodový krok. Finální konzistence má být do budoucna zajištěna i databázovými pravidly (nepřekryv intervalů smluv pro `unit_id` a `tenant_id`).
