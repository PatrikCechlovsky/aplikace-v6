# 🚀 Instrukce pro spuštění migrace na generic_types

## ⚠️ DŮLEŽITÉ: Migrace musí proběhnout v pořadí

### Krok 1: Spuštění SQL migrace v Supabase Dashboard

1. **Otevřít Supabase Dashboard**
   - Přejít na https://supabase.com/dashboard
   - Vybrat projekt aplikace-v6

2. **Otevřít SQL Editor**
   - V levém menu kliknout na **SQL Editor**
   - Kliknout na **New query**

3. **Nahrát migraci**
   - Otevřít lokální soubor: `/supabase/migrations/065_create_generic_types_unified.sql`
   - Zkopírovat celý obsah
   - Vložit do SQL editoru v Supabase

4. **Spustit migraci**
   - Kliknout **Run** nebo stisknout **F5**
   - Počkat na dokončení (může trvat 5-10 sekund)

5. **Ověřit výsledek**
   ```sql
   -- Zkontrolovat, že generic_types tabulka existuje a obsahuje data
   SELECT category, COUNT(*) as count 
   FROM public.generic_types 
   GROUP BY category 
   ORDER BY category;
   ```
   
   Měli byste vidět:
   ```
   category          | count
   ------------------+-------
   equipment_types   | 9
   property_types    | 6
   subject_types     | 6
   unit_types        | (záleží na data)
   ```

6. **Zkontrolovat property_type_code sloupec**
   ```sql
   -- Ověřit, že properties mají property_type_code
   SELECT property_type_code, COUNT(*) 
   FROM public.properties 
   GROUP BY property_type_code;
   ```

### Krok 2: Po úspěšné migraci

Po spuštění SQL migrace můžete pokračovat:

```bash
# 1. Pull nejnovější změny (už jsou pushnuté)
git pull origin feature/ai-spoluprace

# 2. Restartovat dev server
# Ctrl+C v terminálu kde běží npm run dev
npm run dev

# 3. Otestovat aplikaci
# Otevřít http://localhost:3000
# - Zkontrolovat sidebar (měly by se zobrazit ikony a počty)
# - Otevřít Nemovitosti → Přehled nemovitostí
# - Otevřít Pronajímatelé → Přehled pronajímatelů
```

## 📝 Co migrace dělá?

1. **Vytvoří generic_types tabulku**
   - Composite PK: (category, code)
   - Podporuje 4 kategorie: subject_types, property_types, unit_types, equipment_types

2. **Migruje data ze starých tabulek**
   - subject_types → generic_types (category='subject_types')
   - property_types → generic_types (category='property_types')
   - unit_types → generic_types (category='unit_types')
   - equipment_types → generic_types (category='equipment_types')

3. **Přidá nové sloupce do hlavních tabulek**
   - subjects.subject_type_code (text) + FK na generic_types(code)
   - properties.property_type_code (text) + FK na generic_types(code)
   - units.unit_type_code (text) + FK na generic_types(code)
   - equipment.equipment_type_code (text) + FK na generic_types(code)

4. **Zachová staré sloupce** (pro bezpečnost)
   - subjects.subject_type (stále existuje)
   - properties.property_type_id (stále existuje)
   - units.unit_type_id (stále existuje)
   - equipment.equipment_type_id (stále existuje)

## ⏳ Co se stane po migraci?

### Již implementováno ✅
- ✅ Sidebar.tsx používá genericTypes service
- ✅ genericTypes.ts service vytvořen
- ✅ Všechny 3 moduly (030, 040, 050) aktualizovány

### Zbývá dokončit 🔄
- 🔄 properties service - změnit na property_type_code
- 🔄 PropertiesTile - načítat z generic_types
- 🔄 PropertyDetailForm - select z generic_types
- 🔄 Vytvořit GenericTypesTile komponentu pro modul 900
- 🔄 Testování

## 🚨 Pokud migrace selže

Pokud SQL migrace hlásí chybu:

1. **Constraint chyba** (property_type_code NOT NULL)
   - Zkontrolujte, že všechny properties mají property_type_id
   - Chybějící typy: `SELECT * FROM properties WHERE property_type_id IS NULL;`

2. **FK chyba** (FOREIGN KEY constraint)
   - Zkontrolujte orphan záznamy: 
   ```sql
   SELECT p.id, p.property_type_id
   FROM properties p
   LEFT JOIN property_types pt ON p.property_type_id = pt.id
   WHERE pt.id IS NULL;
   ```

3. **Tabulka už existuje**
   - Smazat generic_types: `DROP TABLE IF EXISTS generic_types CASCADE;`
   - Spustit migraci znovu

## 📊 Výhody unified generic_types

- ✅ **Jeden service** pro všechny typy (subject, property, unit, equipment)
- ✅ **Jedna komponenta** GenericTypesTile s category parametrem
- ✅ **Jednodušší údržba** - změna v jednom místě pro všechny typy
- ✅ **Konzistentní UI** - stejný vzhled pro správu všech typů
- ✅ **Sidebar dynamický** - ikony + barvy + počty z jedné tabulky
- ✅ **Snadné rozšíření** - nový typ = jen přidat kategorii

## 🎯 Po dokončení testování

Když vše funguje, odkomentovat DROP příkazy v migraci:

```sql
-- Smazat staré sloupce
ALTER TABLE public.subjects DROP COLUMN IF EXISTS subject_type CASCADE;
ALTER TABLE public.properties DROP COLUMN IF EXISTS property_type_id CASCADE;
ALTER TABLE public.units DROP COLUMN IF EXISTS unit_type_id CASCADE;
ALTER TABLE public.equipment DROP COLUMN IF EXISTS equipment_type_id CASCADE;

-- Smazat staré tabulky
DROP TABLE IF EXISTS public.subject_types CASCADE;
DROP TABLE IF EXISTS public.property_types CASCADE;
DROP TABLE IF EXISTS public.unit_types CASCADE;
DROP TABLE IF EXISTS public.equipment_types CASCADE;
```

Spustit v SQL editoru → **Hotovo!** 🎉
