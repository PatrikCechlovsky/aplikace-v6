# Porovnání databáze s formuláři (31.1.2026)

## 🎯 Účel dokumentu
Tento dokument porovnává aktuální stav databáze (podle `docs/data/Supabase Snippet 02_vzorky_hodnot_vsech_poli.csv`) s požadavky ve formulářích `PropertyDetailForm.ts` a `UnitDetailForm.tsx`.

## ✅ PROPERTIES (Nemovitosti)

### Stav: **KOMPLETNÍ** ✅

Všechna pole z `PropertyDetailForm.ts` jsou implementována v databázi:

| Pole | DB sloupec | Typ | Status |
|------|-----------|------|--------|
| landlord_id | landlord_id | uuid | ✅ |
| property_type_id | property_type_id | uuid | ✅ |
| display_name | display_name | text | ✅ |
| internal_code | internal_code | text | ✅ |
| street | street | text | ✅ |
| house_number | house_number | text | ✅ |
| city | city | text | ✅ |
| zip | zip | text | ✅ |
| country | country | text | ✅ |
| region | region | text | ✅ |
| land_area | land_area | numeric | ✅ |
| built_up_area | built_up_area | numeric | ✅ |
| building_area | building_area | numeric | ✅ |
| number_of_floors | number_of_floors | integer | ✅ |
| floors_above_ground | floors_above_ground | integer | ✅ |
| floors_below_ground | floors_below_ground | integer | ✅ |
| units_count | units_count | integer | ✅ (read-only) |
| build_year | build_year | integer | ✅ |
| reconstruction_year | reconstruction_year | integer | ✅ |
| cadastral_area | cadastral_area | text | ✅ |
| parcel_number | parcel_number | text | ✅ |
| lv_number | lv_number | text | ✅ |
| note | note | text | ✅ |
| is_archived | is_archived | boolean | ✅ |

**Počet polí:** 24/24 ✅

---

## ⚠️ UNITS (Jednotky)

### Stav: **KOMPLETNÍ po migraci 074** ✅

| Pole | DB sloupec | Typ | Migrace | Status |
|------|-----------|------|---------|--------|
| propertyId | property_id | uuid | 061 | ✅ |
| unitTypeId | unit_type_id | uuid | 061 | ✅ |
| displayName | display_name | text | 061 | ✅ |
| internalCode | internal_code | text | 061 | ✅ |
| street | street | text | 061 | ✅ |
| houseNumber | house_number | text | 061 | ✅ |
| city | city | text | 061 | ✅ |
| zip | zip | text | 061 | ✅ |
| country | country | text | 061 | ✅ |
| region | region | text | 061 | ✅ |
| floor | floor | integer | 061 | ✅ |
| doorNumber | door_number | text | 061 | ✅ |
| area | area | numeric | 061 | ✅ |
| rooms | rooms | numeric | 061 | ✅ (legacy) |
| status | status | text | 061 | ✅ |
| note | note | text | 061 | ✅ |
| originModule | origin_module | text | 061 | ✅ |
| isArchived | is_archived | boolean | 061 | ✅ |
| **landlordId** | **landlord_id** | **uuid** | **071** | ✅ |
| **tenantId** | **tenant_id** | **uuid** | **072** | ✅ |
| **disposition** | **disposition** | **text** | **072** | ✅ |
| **orientationNumber** | **orientation_number** | **text** | **072** | ✅ |
| **yearRenovated** | **year_renovated** | **integer** | **072** | ✅ |
| **managerName** | **manager_name** | **text** | **072** | ✅ |
| **cadastralArea** | **cadastral_area** | **text** | **074** | ✅ |
| **parcelNumber** | **parcel_number** | **text** | **074** | ✅ |
| **lvNumber** | **lv_number** | **text** | **074** | ✅ |

**Počet polí:** 27/27 ✅

---

## 📝 Historie změn

### Migrace 061 (2026-01-18)
- Původní vytvoření tabulky `units`
- 18 základních polí

### Migrace 071 (2026-01-25)
- Přidáno `landlord_id` (pronajímatel jednotky může být jiný než u nemovitosti)

### Migrace 072 (2026-01-25)
- Přidáno `tenant_id` (odkaz na nájemníka)
- Přidáno `disposition` (dispozice 1+kk, 2+1, atd.)
- Přidáno `orientation_number` (číslo orientační)
- Přidáno `year_renovated` (rok rekonstrukce)
- Přidáno `manager_name` (správce jednotky)
- Migrace dat: `rooms` → `disposition`

### Migrace 073 (2026-01-25)
- Seed data pro `generic_types` kategorie `unit_dispositions`
- 8 typů dispozic (1+kk až 6+kk, atipický)

### Migrace 074 (2026-01-31) ⭐ NOVÁ
- Přidáno `cadastral_area` (katastrální území)
- Přidáno `parcel_number` (číslo parcely)
- Přidáno `lv_number` (list vlastnictví)
- Indexy pro vyhledávání
- Constraints pro délku

---

## 🎯 Závěr

### ✅ Properties: KOMPLETNÍ (24 polí)
Všechna pole z formuláře jsou v databázi, včetně `floors_above_ground`, `floors_below_ground` a `units_count`.

### ✅ Units: KOMPLETNÍ po migraci 074 (27 polí)
Všechna pole z formuláře budou v databázi po spuštění migrace 074.

### 📊 Celková konzistence: 51/51 (100%) ✅

---

## 🚀 Další kroky

1. **Spustit migraci 074:**
   ```bash
   # Lokálně (Supabase CLI)
   supabase migration up
   
   # Nebo v Supabase Dashboard
   # SQL Editor → Paste migration → Run
   ```

2. **Aktualizovat CSV export:**
   - Spustit SQL query `02_vzorky_hodnot_vsech_poli.sql`
   - Exportovat do `docs/data/`
   - Verifikovat nové sloupce v `units` tabulce

3. **Testovat formuláře:**
   - UnitDetailForm.tsx - všechna pole by měla fungovat
   - PropertyDetailForm.ts - již kompletní

4. **Další vývoj:**
   - PropertyDetailFrame (detail view)
   - UnitDetailFrame (detail view)
   - RelationListWithDetail pro jednotky v nemovitosti

---

## 📌 Reference

- **Formuláře:**
  - [PropertyDetailForm.ts](../app/modules/040-nemovitost/forms/PropertyDetailForm.ts)
  - [UnitDetailForm.tsx](../app/modules/040-nemovitost/forms/UnitDetailForm.tsx)

- **Migrace:**
  - [061_create_units.sql](../supabase/migrations/061_create_units.sql)
  - [071_add_floors_and_units_count_to_properties.sql](../supabase/migrations/071_add_floors_and_units_count_to_properties.sql)
  - [072_add_missing_fields_to_units.sql](../supabase/migrations/072_add_missing_fields_to_units.sql)
  - [073_seed_unit_dispositions.sql](../supabase/migrations/073_seed_unit_dispositions.sql)
  - [074_add_cadastre_fields_to_units.sql](../supabase/migrations/074_add_cadastre_fields_to_units.sql)

- **Data:**
  - [Supabase Snippet 02_vzorky_hodnot_vsech_poli.csv](./Supabase%20Snippet%2002_vzorky_hodnot_vsech_poli.csv)
  - [Supabase Snippet 01_prehled_vsech_poli.csv](./Supabase%20Snippet%2001_prehled_vsech_poli.csv)
