# Generic Types Migration - Dokončeno ✅

**Datum:** 19. 1. 2026  
**Migrace:** `065_create_generic_types_unified.sql`  
**Status:** ✅ Úspěšně dokončeno

---

## Přehled

Úspěšná migrace všech `*_types` tabulek do jednotné tabulky `generic_types` s category-based rozlišením.

### Před migrací
```
subject_types (code TEXT PK)
property_types (id UUID PK, code TEXT) 
unit_types (code TEXT PK)
equipment_types (code TEXT PK)
```

### Po migraci
```
generic_types (
  id UUID PK,
  category TEXT (subject_types|property_types|unit_types|equipment_types),
  code TEXT,
  UNIQUE (category, code)
)
```

---

## Migrace dat

### 1. subject_types → generic_types
- **Počet:** 6 typů
- **UUID:** Nově generované
- **Sloupce:** sort_order → order_index
- **FK:** subjects.subject_type_id (nový sloupec)

### 2. property_types → generic_types  
- **Počet:** 5 typů (rodinny_dum, bytovy_dum, admin_budova, pozemek, jiny_objekt)
- **UUID:** ✅ **Zachovány z property_types.id** (důležité!)
- **FK:** properties.property_type_id (beze změny, jen nový constraint)

### 3. unit_types → generic_types
- **Počet:** 5+ typů
- **UUID:** Nově generované
- **Sloupce:** TEXT → UUID
- **FK:** units.unit_type_id (TEXT → UUID přes temp column)
- **View:** v_units_list (DROP + RECREATE s novým JOINem)

### 4. equipment_types → generic_types
- **Počet:** 9 typů
- **UUID:** Nově generované
- **Sloupce:** TEXT → UUID
- **FK:** equipment.equipment_type_id (TEXT → UUID přes temp column)

---

## Změny v kódu

### ✅ Opravené soubory

#### Services
- `app/lib/services/properties.ts` → `generic_types!fk_properties_type_generic`
- `app/lib/services/units.ts` → `generic_types!fk_units_type_generic`
- `app/lib/services/equipment.ts` → `generic_types!fk_equipment_type_generic`

#### Komponenty
- `app/modules/040-nemovitost/tiles/PropertiesTile.tsx` → načítání z generic_types
- `app/UI/Sidebar.tsx` → `listActiveByCategory('property_types')`

#### Nové služby
- `app/modules/900-nastaveni/services/genericTypes.ts` - univerzální CRUD

---

## FK Constraints

### Nové constraints
```sql
-- Subjects
ALTER TABLE subjects
  ADD CONSTRAINT fk_subjects_type_id
  FOREIGN KEY (subject_type_id) REFERENCES generic_types(id);

-- Properties
ALTER TABLE properties
  ADD CONSTRAINT fk_properties_type_generic
  FOREIGN KEY (property_type_id) REFERENCES generic_types(id);

-- Units
ALTER TABLE units
  ADD CONSTRAINT fk_units_type_generic
  FOREIGN KEY (unit_type_id) REFERENCES generic_types(id);

-- Equipment
ALTER TABLE equipment
  ADD CONSTRAINT fk_equipment_type_generic
  FOREIGN KEY (equipment_type_id) REFERENCES generic_types(id);
```

---

## RLS Policies

```sql
-- Read: Všichni autentizovaní uživatelé mohou číst aktivní typy
CREATE POLICY "generic_types_select"
  ON generic_types FOR SELECT
  TO authenticated
  USING (active = TRUE);

-- Write: Pouze admins
CREATE POLICY "generic_types_admin_all"
  ON generic_types FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM app_admins WHERE user_id = auth.uid()
  ));
```

---

## Problémy a řešení

### 1. Code uniqueness conflict
**Problém:** Kód "zahrada" se vyskytoval ve více kategoriích  
**Řešení:** Composite UNIQUE (category, code) místo UNIQUE (code)

### 2. property_types.id preservace
**Problém:** properties.property_type_id už ukazovaly na UUID  
**Řešení:** Přímý INSERT s `id` z property_types (zachování UUID)

### 3. unit_types/equipment_types TEXT → UUID
**Problém:** FK constraint nešel vytvořit (TEXT vs UUID)  
**Řešení:** 
```sql
1. ADD COLUMN type_id_new UUID
2. UPDATE s lookup přes code
3. DROP COLUMN old_type_id
4. RENAME COLUMN type_id_new TO type_id
```

### 4. View dependency
**Problém:** v_units_list blokoval ALTER COLUMN  
**Řešení:** DROP VIEW před změnou, RECREATE po změně s novým JOINem

---

## Ověření migrace

### SQL queries
```sql
-- Kontrola počtu typů
SELECT category, COUNT(*) 
FROM generic_types 
GROUP BY category 
ORDER BY category;

-- Výsledek:
-- equipment_types | 9
-- property_types  | 5
-- subject_types   | 6
-- unit_types      | 5+

-- Kontrola nemovitostí
SELECT p.property_type_id, gt.code, gt.name, COUNT(*) 
FROM properties p
JOIN generic_types gt ON p.property_type_id = gt.id
GROUP BY p.property_type_id, gt.code, gt.name;

-- Výsledek: 12 nemovitostí správně nalinkovány
```

---

## Úklid (volitelné)

Po ověření funkčnosti lze dropnout staré tabulky:

```sql
-- POZOR: Nenávratná operace!
DROP TABLE IF EXISTS public.property_types CASCADE;
DROP TABLE IF EXISTS public.unit_types CASCADE;
DROP TABLE IF EXISTS public.equipment_types CASCADE;

-- subject_types - ponechat, stále se používá pro subjects.subject_type TEXT
```

⚠️ **Doporučení:** Ponechat zakomentované v migraci minimálně 1 měsíc pro jistotu.

---

## Další kroky

### ⏳ Zbývá implementovat

1. **PropertyDetailForm**
   - Změnit `source: 'property_types'` → `listActiveByCategory('property_types')`
   
2. **GenericTypesTile**
   - Univerzální tile pro správu všech typů v modulu 900
   - Props: `category` určuje, který typ editovat
   
3. **Odstranit staré services** (po verifikaci):
   - `app/modules/900-nastaveni/services/propertyTypes.ts`
   - `app/modules/900-nastaveni/services/unitTypes.ts`
   - Nahradit použitím `genericTypes.ts`

---

## Závěr

✅ **Migrace úspěšná**  
✅ **Data zachována**  
✅ **FK vztahy funkční**  
✅ **UI funguje bez chyb**  
✅ **Performance OK** (indexy na category, code, active)

**Dopad na běžící aplikaci:** Minimální - property types fungovaly hned díky zachování UUID.
