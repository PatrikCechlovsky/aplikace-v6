# FÁZE 1: NÁVRH A VZHLED APLIKACE (BEZ KÓDU)

## 1️⃣ Potvrdit počet a význam UI bloků (layout struktura)
- Upřesnit, kolik máš hlavních bloků UI (původně 8–9)
- Definovat, co přesně je v každém bloku  
  *(např. „blok 5 = záložky s vazbami“, „blok 9 = přehled entit“)*

## 2️⃣ Nakreslit finální rozložení obrazovky
- Jeden obrázek pro desktop (Full HD)
- Jeden obrázek pro mobilní režim
- Definovat fixní části layoutu  
  *(sidebar, záhlaví, záložky...)*
- Definovat proměnlivé části  
  *(detail entity, vazby...)*

## 3️⃣ Popsat chování záložek (Tabs a Connections)
- Potvrdit fixní pořadí záložek (např. 1–10)
- Ujasnit, že hlavní karta zůstává vždy na stejné pozici  
  *(např. smlouva je vždy v záložce 6)*
- Popsat, jak fungují seznam + detail (vždy spolu)

## 4️⃣ Upřesnit logiku vazeb mezi entitami
- Definovat strom:
  - Pronajímatel  
    → Nemovitost  
    → Jednotka  
    → Nájemník  
    → Smlouva  
    → Platby
- Vysvětlit výjimky *(např. Jednotka bez nájemníka)*
- Nakreslit diagram vazeb *(vizuální)*

## 5️⃣ Navrhnout přílohový systém
- Kam se ukládají přílohy
- Jak se zobrazují
- Co znamená archivace vs verze
- Jak bude fungovat upload  
  *(formulář, drag & drop...)*

## 6️⃣ Finální dokumentace UI layoutu
- Sloučit výsledky do jednoho dokumentu `UI-rozvrh.md`
- Připravit jako podklad pro šablonování modulů
