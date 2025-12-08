# /docs/archive/06-data-model-notes.md
## Popis: Archiv starých poznámek, úvah a nezatříděných konceptů z vývoje datového modelu.
---

# ARCHIV – DATOVÝ MODEL (poznámky a koncepty)

Tento archiv uchovává všechny neformální poznámky, úvahy, alternativní návrhy a nápady, které se objevily během návrhu datového modelu, ale nebyly zahrnuty do finální dokumentace.

NIC ZDE NESMÍ BÝT SMAZÁNO.

---

## 🔸 1. Staré diskuze o multi-tenant architektuře

Původní debatní úryvky:

- „Možná raději uděláme databázi pro každého pronajímatele“
- „Co když budeme chtít později slučovat portfolia?“
- „Možná vytvoříme tabulku tenants a uživatelé se k ní přiřadí.“

Tyto úvahy vedly k současnému modelu **owner_id + RLS**.

---

## 🔸 2. Zvažované alternativy pro tabulku contracts

Historické poznámky:

- smlouvy mohly mít vlastní typy "nájem", "podnájem", "rezervační"
- zvažovalo se oddělení deposit do vlastní tabulky
- uvažovalo se o více nájemnících u jedné jednotky současně

Archivováno.

---

## 🔸 3. Nápady na agregované tabulky

Extrémně rané návrhy:

- `unit_state_history`
- `property_valuation_history`
- `service_consumption_aggregates`
- `tenant_risk_index`

Potenciálně zajímavé pro verzi v7.

---

## 🔸 4. Nezrealizované úvahy o měřidlech

- úvaha o tabulce „meter_types“
- propojení měřidel s IoT zařízeními
- automatický import odečtů z CSV nebo API dodavatelů

Archivováno pro budoucí vývoj modulů energií.

---

## 🔸 5. Alternativní návrh komunikace a dokumentů

Rané texty:

- „Dokumenty nemusí být v DB, stačí S3 storage a metadata v JSON.“
- „Komunikace může být jen přepis e-mailu a není třeba modelovat tabulkami.“

Později zavrženo — tabulkový model je stabilnější.

---

## 🔸 6. Testovací návrhy vzorových dat

Původní testovací entity:

```
pronajímatel: Jan Majitel
nemovitost: Panelový dům 12
jednotka: 3+1, 76 m²
nájemník: Karel Nájemníček
smlouva: 2023/001
nájem: 12 000 Kč
vodné/stočné: záloha 500 Kč
```

Zachováno pro testovací dataset.

---

## 🔸 7. Poznámky ze stav-struktury a chatu

- potřeba jednotné tabulky pro audit (`created_by`, `updated_by`)
- úvaha o logické deletions (`is_active`)
- otázka: „Máme mít cizí klíče ON DELETE CASCADE?“
- úvaha: „Budeme mít history tabulky?“

Zachováno pro pozdější rozhodnutí.

---

# 📌 Závěr archivu

Tento archiv slouží jako zdroj kontextu při budoucích úpravách datového modelu.  
Ukládáme sem jak reálné poznámky, tak i nápady, které mohou být užitečné později.

