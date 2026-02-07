# Změny typů místností (2026)

## Kontext

V rámci rozvoje evidence vybavení a univerzálnosti aplikace jsme rozšířili a sjednotili typy místností (`room_types`) v systému. Cílem bylo pokrýt nejen byty, ale i domy, zahrady, technické a komerční prostory, aniž by vznikl příliš dlouhý nebo nepřehledný seznam.

## Hlavní kroky a změny

### 1. Analýza původního stavu
- Původní seznam obsahoval 15 typů místností zaměřených na bytové jednotky (kuchyně, koupelna, obývací pokoj, ložnice, atd.).
- Chyběly typy pro exteriér, technické a komerční prostory (např. garáž, zahrada, dílna, kancelář).

### 2. Teoretický návrh rozšíření
- Cílem bylo pokrýt běžné potřeby domů, chalup, komerčních objektů i "edge cases" (např. sekačka, nářadí, skladování).
- Navrženo přidat 8 nových typů:
  - 🏡 Zahrada
  - 🚗 Garáž
  - 🏚️ Sklep
  - 🏠 Půda
  - 🪴 Dvorek
  - 🔧 Dílna
  - 🚪 Vstupní hala
  - 💼 Kancelář
- Celkem nyní 23 typů místností (15 původních + 8 nových + Jiná místnost pro výjimečné případy).

### 3. Implementace změn
- Vytvořena migrace `083_add_property_room_types.sql`:
  - Přidává 8 nových záznamů do tabulky `generic_types` (category = 'room_types').
  - Opraveno pole na `order_index` (původně chybně `sort_order`).
- Všechny nové typy mají ikonu, popis a správné pořadí.

### 4. Opravy a refaktoring
- Opraveny všechny výskyty `installation_date` na `installed_at` v kódu, migracích i views.
- Opraveny typy v service layer (`UnitEquipmentRow`, `PropertyEquipmentRow`, `SaveInput` typy).
- Opraveny payloady v UI (EquipmentTab.tsx).
- Opraveny views v migraci 082 (`v_unit_equipment_list`, `v_property_equipment_list`).
- Opraveno zobrazení filtrů a katalogu (jen český název, bez kódu/ikony).

### 5. Testování a nasazení
- Otestováno v UI: nové typy místností jsou dostupné ve filtrech i při zadávání vybavení.
- Ověřeno, že lze správně kategorizovat vybavení (např. sekačka → Zahrada, nářadí → Garáž/Dílna, PC → Kancelář).
- Všechny migrace úspěšně nasazeny a build prochází.

## Shrnutí
- Systém nyní podporuje evidence vybavení v bytech, domech, zahradách i komerčních objektech.
- Seznam místností je rozšiřitelný, ale stále přehledný.
- Všechny změny jsou popsány a verzovány v migracích a dokumentaci.

---

**Poslední úprava:** 2026-02-04
