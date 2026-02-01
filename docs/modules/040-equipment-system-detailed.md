# 📘 Equipment System – Vybavení nemovitostí a jednotek

**Účel dokumentu**  
Tento dokument definuje **kanonický seznam vybavení a technických prvků** používaných v aplikaci pro správu nemovitostí a jednotek.  
Slouží jako:
- zdroj pravdy pro **datový model (SQL / Supabase)**,
- podklad pro **UI sekce v detailu nemovitosti a jednotky**,
- základ pro **přílohy, revize, historii a rozúčtování**.

---

## 🏢 Rozsah
Vybavení může být přiřazeno k:
- **Nemovitosti** (společné části, technologie domu),
- **Jednotce** (byt, kancelář, komerční prostor),
- **Exteriéru**.

---

## 📊 Aktuální implementace (v6)

### ✅ Hotovo (v databázi)
- **equipment_catalog** – master seznam typů vybavení
- **unit_equipment** – vybavení přiřazené k jednotkám
- **property_equipment** – vybavení přiřazené k nemovitostem
- **generic_types** – typy vybavení (equipment_types) a místností (room_types)
- **Views** – v_unit_equipment_list, v_property_equipment_list

### ✅ Hotovo (v UI) - Aktualizováno 1.2.2026
- **EquipmentTab** – správa vybavení v detailu nemovitosti/jednotky
- **EquipmentCatalogTile** – master seznam typů vybavení s CRUD funkcionalitou
  - ListView s 6 sloupci (Typ, Název, Místnost, Cena, Životnost, Stav)
  - DetailView pro prohlížení/editaci položky
  - Podpora filtrování podle typu vybavení (equipmentTypeFilter prop)
- **CreateEquipmentTile** – vytváření vybavení přes výběr typu (16 karet)
  - Pattern: Tile-based creation jako CreateUnitTile
  - Type selection cards s ikonami a barvami z generic_types
- **EquipmentTypeTile (Factory)** – 16 filtrovaných pohledů podle typu
  - Kuchyňské spotřebiče, Sanitární technika, Vytápění, atd.
  - Každý filtr = samostatná dlaždice v menu
- **EquipmentCatalogDetailFormComponent** – formulář pro detail vybavení
  - 4 sekce: Základní údaje, Cenové informace, Životnost a údržba, Systém
  - Dynamický nadpis: "Katalog vybavení - {název}"
  - Archive pattern (is_archived), no delete
- **EquipmentTypesTile** – správa typů vybavení (generic_types)
- **RoomTypesTile** – správa typů místností (generic_types)

### 🔧 V plánu
- Vazba na jednotky (unit_equipment) - required fields při vazbě
- Vazba na nemovitosti (property_equipment) - required fields při vazbě
- Přílohy na vazby (ne na katalog)
- Vazba na revize (plánované, proběhlé)
- Historie výměn a oprav
- Rozúčtování nákladů na energie
- Notifikace pro revize

---

# 1️⃣ ENERGIE & MĚŘENÍ

## Elektřina
- Hlavní elektroměr  
- Podružný elektroměr  
- Elektroměr jednotky  
- Elektroměr tepelného čerpadla  
- Elektroměr FVE  
- Elektroměr společných prostor  
- Proudový chránič  
- Jističový rozvaděč  
- Podružný rozvaděč  
- HDO přijímač  

## Plyn
- Plynoměr  
- Regulátor plynu  
- Plynový uzávěr  
- Detektor plynu  

## Voda
- Vodoměr – studená voda  
- Vodoměr – teplá voda  
- Podružný vodoměr  
- Hlavní uzávěr vody  
- Podružný uzávěr vody  
- Detektor úniku vody  

## Teplo
- Měřič tepla  
- Kalorimetr  
- Poměrové měřiče topení  
- Rozdělovač topných okruhů  

---

# 2️⃣ VYTÁPĚNÍ & OHŘEV

- Plynový kotel  
- Elektrokotel  
- Kotel na tuhá paliva  
- Kotel na pelety  
- Tepelné čerpadlo (vzduch–vzduch)  
- Tepelné čerpadlo (vzduch–voda)  
- Tepelné čerpadlo (země–voda)  
- Akumulační nádrž  
- Zásobník TUV  
- Průtokový ohřívač  
- Elektrický bojler  
- Solární kolektory  
- Expanzní nádoba  
- Oběhové čerpadlo  

---

# 3️⃣ CHLAZENÍ & VZDUCHOTECHNIKA

- Klimatizace – split  
- Klimatizace – multisplit  
- Klimatizace – VRV / VRF  
- Vnitřní jednotka klimatizace  
- Venkovní jednotka klimatizace  
- Rekuperační jednotka  
- Centrální vzduchotechnika  
- Lokální rekuperační jednotka  
- Digestoř (odtahová / recirkulační)  
- Ventilátor koupelny / WC  

---

# 4️⃣ ZDRAVOTECHNIKA & ODPADY

- WC  
- Umyvadlo  
- Sprchový kout  
- Vana  
- Bidet  
- Pisoár  
- Pračka  
- Sušička  
- Myčka  
- Změkčovač vody  
- Filtrace vody  
- Studna  
- Domácí vodárna  
- Septik  
- ČOV  
- Retenční nádrž  
- Lapač tuků  

---

# 5️⃣ KUCHYNĚ & SPOTŘEBIČE

- Kuchyňská linka  
- Varná deska – plynová  
- Varná deska – elektrická  
- Varná deska – indukční  
- Trouba  
- Mikrovlnná trouba  
- Lednice  
- Mrazák  
- Vinotéka  
- Odsavač par  
- Vestavné spotřebiče  
- Volně stojící spotřebiče  

---

# 6️⃣ STAVEBNÍ PRVKY & KONSTRUKCE

- Okna  
- Balkonové dveře  
- Vstupní dveře  
- Interiérové dveře  
- Bezpečnostní dveře  
- Rolety  
- Žaluzie  
- Markýzy  
- Podlahy – dlažba  
- Podlahy – vinyl  
- Podlahy – parkety  
- Podlahy – koberec  
- Podhledy  
- Sádrokartonové konstrukce  

---

# 7️⃣ BEZPEČNOST & POŽÁR

- EPS (elektronická požární signalizace)  
- Kouřový hlásič  
- Hlásič CO  
- Hlásič plynu  
- Hasicí přístroj  
- Požární hydrant  
- Únikové osvětlení  
- Panikové osvětlení  
- Nouzový vypínač  

---

# 8️⃣ PŘÍSTUPY & ZABEZPEČENÍ

- Elektronický zámek  
- Mechanický zámek  
- Klíčový systém  
- Čipový systém  
- Kódová klávesnice  
- Videotelefon  
- Domovní telefon  
- Kamerový systém  
- Záznamové zařízení (NVR / DVR)  
- Alarm (EZS)  

---

# 9️⃣ IT & SLABOPROUD

- Datový rozvaděč  
- Patch panel  
- Router  
- Switch  
- Wi-Fi access point  
- Optická přípojka  
- Metalická přípojka  
- Anténa DVB-T  
- Satelitní parabola  
- TV rozvody  
- Datové zásuvky  
- Telefonní zásuvky  

---

# 🔟 SPOLEČNÉ PROSTORY

- Výtah  
- Strojovna výtahu  
- Garážová vrata  
- Pohon vrat  
- Závory  
- Nabíječka elektromobilů  
- Kolárna  
- Kočárkárna  
- Sklepní kóje  
- Technická místnost  
- Úklidová místnost  

---

# 1️⃣1️⃣ EXTERIÉR

- Oplocení  
- Brána  
- Branka  
- Automatický pohon brány  
- Osvětlení exteriéru  
- Zahradní zavlažování  
- Bazén  
- Technologie bazénu  
- Sauna  
- Vířivka  
- Pergola  

---

# 1️⃣2️⃣ METADATA (společná pro veškeré vybavení)

Každá položka vybavení může mít následující metadata:

## ✅ Implementováno v databázi (migrace 077)
- **equipment_name** – Název vybavení
- **equipment_type_id** – Kategorie/Typ zařízení (FK na generic_types)
- **room_type_id** – Umístění v místnosti (FK na generic_types)
- **purchase_price** – Pořizovací cena
- **purchase_date** – Datum pořízení
- **installed_at** – Datum instalace
- **state** – Stav (new, good, worn, damaged, to_replace, broken)
- **quantity** – Počet kusů
- **default_lifespan_months** – Životnost v měsících
- **default_revision_interval** – Interval revize v měsících
- **last_revision** – Datum poslední revize
- **description** – Poznámka

## 🔧 Připraveno pro budoucí rozšíření
- Výrobce  
- Model  
- Sériové číslo  
- Rok výroby  
- Záruka do  
- Revize do (vypočítáno z last_revision + interval)
- Vazba na dokumenty (revize, návody, faktury) – přes attachments systém
- Historie výměn – audit trail
- Notifikace pro revize

---

## 📌 Implementační fáze

### V1 ✅ HOTOVO
- Evidence vybavení (equipment_catalog, unit_equipment, property_equipment)
- Přílohy přes standardní attachments systém
- Stavy vybavení (6 stavů)
- UI pro správu (EquipmentTab, EquipmentCatalogTile)
- Typy vybavení a místností (generic_types)

### V2 🔧 V PLÁNU
- Revize (plánované, proběhlé, notifikace)
- Historie výměn (audit trail)
- Rozúčtování nákladů na vybavení mezi nájemníky

### V3 🚀 BUDOUCNOST
- Napojení na měření (elektro, voda, plyn, teplo)
- Grafy spotřeby
- Automatické notifikace pro revize a výměny
- Predikce výměn podle životnosti

---

## 🔗 Související dokumenty
- [40-nemovitost.md](./40-nemovitost.md) – Přehled modulu Nemovitosti
- [Migration 075](../../supabase/migrations/075_add_room_types_equipment_states.sql) – Room types a equipment states
- [Migration 076](../../supabase/migrations/076_fix_equipment_catalog_fk.sql) – FK fix pro equipment_catalog
- [Migration 077](../../supabase/migrations/077_extend_equipment_structure.sql) – Rozšíření struktury vybavení

---

**Autor:** AI + Patrik Čechlovský  
**Datum vytvoření:** 1. února 2026  
**Verze:** 1.0 (V1 implementace dokončena)
