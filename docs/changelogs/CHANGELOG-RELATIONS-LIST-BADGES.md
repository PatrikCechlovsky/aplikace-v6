# 🎨 Changelog – Vazby (huby) + barevné štítky + statusy

**Datum:** 25.1.2026

## 1️⃣ Přehled změn
- Implementovány a sjednoceny „vazbové huby“ pro pronajímatele, nemovitosti, jednotky a nájemníky.
- Sjednocení vizuálního zobrazení typů (barevné badge) a statusů v seznamu vazeb se seznamy entit.
- Vazby nyní používají stejné barvy typů jako entity (subject/property/unit) a jednotky zobrazují stav s českým popiskem a ikonou.
- Standardizováno pořadí tabů podle modulů.
- Opraveno renderování vazeb v Nájemnících (view mode).
- Odstraněny cirkulární importy vytažením sdílených definic sloupců do samostatných souborů.
- Opraveny ikony (typ jednotky „Zahrada“, katalog vybavení, modul Nájemníci).
- Přidán sdílený helper pro status jednotek + oprava build chyby (JSX v .ts).

## 2️⃣ Databázové změny
- Žádné.

## 3️⃣ Service Layer
- Přidány služby pro načtení vazeb nájemníka.
- Existující služby rozšířeny o data potřebná pro vazby (typy, barvy, názvy).

## 4️⃣ UI Komponenty
- Přidány nové/aktualizované huby vazeb:
  - `LandlordRelationsHub`
  - `PropertyRelationsHub`
  - `UnitRelationsHub`
  - `TenantRelationsHub`
- Sjednocené sloupce v samostatných souborech:
  - `landlordsColumns.ts`
  - `propertiesColumns.ts`
  - `unitsColumns.ts`
  - `tenantsColumns.ts`
- Vazby v CommonActions jako samostatný view mode s přepínačem a ListView.
- Přidány barevné badge pro typ subjektu/nemovitosti/jednotky (mapování přes subject_types a generic_types).
- Status jednotky renderovaný přes sdílený helper s českými popisky.
- Přidán helper `unitsStatus.ts` (sdílené mapování statusů).

## 5️⃣ Bug Fix
- Oprava renderu vazeb v Nájemnících (view mode nebyl zobrazen).
- Build fix: odstranění JSX z .ts (použití `React.createElement`).

## 6️⃣ Deployment Checklist
- Žádné specifické kroky.

## 7️⃣ Testing
- Otevřít vazby pro pronajímatele, nemovitost, jednotku a nájemníka.
- Zkontrolovat, že:
  - Typy subjektů jsou barevné (stejně jako v entitních seznamech).
  - Typy nemovitostí a jednotek mají barevné badge.
  - Status jednotek zobrazuje český text a barevnou ikonu.
  - Pořadí tabů je sjednocené.
  - Vazby se renderují i v Nájemnících.
