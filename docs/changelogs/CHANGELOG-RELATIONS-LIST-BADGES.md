# 🎨 Changelog – Barevné štítky a statusy ve vazbách

**Datum:** 25.1.2026

## 1️⃣ Přehled změn
- Sjednocení vizuálního zobrazení typů (barevné badge) a statusů v seznamu vazeb se seznamy entit.
- Vazby nyní používají stejné barvy typů jako entity (subject/property/unit) a jednotky zobrazují stav s českým popiskem a ikonou.

## 2️⃣ Databázové změny
- Žádné.

## 3️⃣ Service Layer
- Žádné (pouze načítání existujících číselníků pro mapování barev).

## 4️⃣ UI Komponenty
- Aktualizováno mapování řádků ve vazbách:
  - `LandlordRelationsHub`
  - `PropertyRelationsHub`
  - `UnitRelationsHub`
  - `TenantRelationsHub`
- Přidány barevné badge pro typ subjektu/nemovitosti/jednotky (mapování přes subject_types a generic_types).
- Status jednotky renderovaný přes sdílený helper s českými popisky.

## 5️⃣ Bug Fix
- Žádné.

## 6️⃣ Deployment Checklist
- Žádné specifické kroky.

## 7️⃣ Testing
- Otevřít vazby pro pronajímatele, nemovitost, jednotku a nájemníka.
- Zkontrolovat, že:
  - Typy subjektů jsou barevné (stejně jako v entitních seznamech).
  - Typy nemovitostí a jednotek mají barevné badge.
  - Status jednotek zobrazuje český text a barevnou ikonu.
