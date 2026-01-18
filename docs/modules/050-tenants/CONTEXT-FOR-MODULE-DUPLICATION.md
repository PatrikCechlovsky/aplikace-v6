# Kontext pro duplikaci modulu 030 → 050 (Nájemníci)

## Cíl
Vytvořit modul 050-najemnik jako kopii modulu 030-pronajimatel, s úpravami pro nájemníky místo pronajímatelů.

---

## Reference modul 030 (Pronajímatelé)

### Struktura
```
app/modules/030-pronajimatel/
  ├── module.config.js          # Konfigurace modulu
  ├── LandlordList.tsx           # Seznam pronajímatelů
  ├── LandlordDetail.tsx         # Detail pronajímatele
  ├── forms/
  │   └── LandlordDetailForm.tsx # Formulář
  └── components/
      └── (další komponenty)
```

### Klíčové vlastnosti modulu 030
- `module_id: '030'`
- `name: 'Pronajímatelé'`
- `icon: 'home'`
- `origin_module: '030'` v DB

---

## Změny pro modul 050 (Nájemníci)

### 1. Základní konfigurace

#### module.config.js
```javascript
// ZMĚNIT Z:
export const config = {
  id: '030',
  name: 'Pronajímatelé',
  path: '/pronajimatel',
  icon: 'home',
  // ...
}

// NA:
export const config = {
  id: '050',
  name: 'Nájemníci',
  path: '/najemnik',
  icon: 'users',  // Nebo jiná vhodná ikona
  // ...
}
```

#### Menu tiles
```javascript
// ZMĚNIT Z:
tiles: [
  {
    id: "prehled",
    label: "Přehled",  // Už zkráceno
    icon: "users",
    action: { type: "view", view: "list" },
  },
  {
    id: "pridat",
    label: "Přidat",  // Už zkráceno
    icon: "user-plus",
    action: { type: "view", view: "new" },
  }
]

// PONECHAT STEJNĚ (už je zkráceno správně)
```

---

### 2. Databázové flagi

#### Role flagi - KRITICKÁ ZMĚNA

```typescript
// ZMĚNIT Z (030):
is_landlord: boolean;
is_landlord_delegate: boolean;

// NA (050):
is_tenant: boolean;
is_tenant_delegate: boolean;
```

#### origin_module

```typescript
// ZMĚNIT Z:
origin_module: '030'

// NA:
origin_module: '050'
```

---

### 3. Komponenty k přejmenování

#### Soubory
```
TenantList.tsx          ← LandlordList.tsx
TenantDetail.tsx        ← LandlordDetail.tsx
forms/
  TenantDetailForm.tsx  ← LandlordDetailForm.tsx
```

#### Type definice
```typescript
// ZMĚNIT Z:
interface Landlord {
  id: string;
  subject_type: string;
  display_name: string;
  is_landlord: boolean;
  is_landlord_delegate: boolean;
  // ...
}

// NA:
interface Tenant {
  id: string;
  subject_type: string;
  display_name: string;
  is_tenant: boolean;
  is_tenant_delegate: boolean;
  // ...
}
```

---

### 4. Formulář - Detail změny

#### Název sekce rolí (už upraveno v 030)
```typescript
// PONECHAT:
<h3>Přiřazení subjektu jako:</h3>

// Pouze změnit checkboxy:
```

#### Checkboxy v TenantDetailForm
```typescript
{/* Uživatel aplikace - beze změny */}
<div className="flex items-center gap-4 py-2 border-b">
  <label className="flex items-center gap-2 text-sm">
    <input
      type="checkbox"
      checked={formData.is_user || false}
      onChange={(e) => handleFieldChange('is_user', e.target.checked)}
    />
    Uživatel aplikace
  </label>
</div>

{/* ZMĚNIT Z is_landlord NA is_tenant */}
<div className="flex items-center gap-4 py-2 border-b">
  <label className="flex items-center gap-2 text-sm flex-1">
    <input
      type="checkbox"
      checked={formData.is_tenant || false}
      onChange={(e) => handleFieldChange('is_tenant', e.target.checked)}
    />
    Nájemník
  </label>
  <label className="flex items-center gap-2 text-sm flex-1">
    <input
      type="checkbox"
      checked={formData.is_tenant_delegate || false}
      onChange={(e) => handleFieldChange('is_tenant_delegate', e.target.checked)}
    />
    Zástupce nájemníka
  </label>
</div>

{/* Pronajímatel a zástupce */}
<div className="flex items-center gap-4 py-2 border-b">
  <label className="flex items-center gap-2 text-sm flex-1">
    <input
      type="checkbox"
      checked={formData.is_landlord || false}
      onChange={(e) => handleFieldChange('is_landlord', e.target.checked)}
    />
    Pronajímatel
  </label>
  <label className="flex items-center gap-2 text-sm flex-1">
    <input
      type="checkbox"
      checked={formData.is_landlord_delegate || false}
      onChange={(e) => handleFieldChange('is_landlord_delegate', e.target.checked)}
    />
    Zástupce pronajímatele
  </label>
</div>

{/* Údržba - beze změny */}
<div className="flex items-center gap-4 py-2 border-b">
  <label className="flex items-center gap-2 text-sm flex-1">
    <input
      type="checkbox"
      checked={formData.is_maintenance || false}
      onChange={(e) => handleFieldChange('is_maintenance', e.target.checked)}
    />
    Údržba
  </label>
  <label className="flex items-center gap-2 text-sm flex-1">
    <input
      type="checkbox"
      checked={formData.is_maintenance_delegate || false}
      onChange={(e) => handleFieldChange('is_maintenance_delegate', e.target.checked)}
    />
    Zástupce údržby
  </label>
</div>
```

---

### 5. Validace - PONECHAT TOTOŽNÉ

#### ✅ Všechny validace z modulu 030 PONECHAT:

```typescript
// PONECHAT BEZ ZMĚNY:
validatePersonalIdNumber()  // Rodné číslo
validateZip()               // PSČ
validatePhone()             // Telefon
validateEmail()             // Email

// PONECHAT BEZ ZMĚNY:
// Povinná pole pro osoby
if (formData.subject_type === 'osoba') {
  if (!formData.personal_id_number) missingFields.push('rodné číslo');
  if (!formData.birth_date) missingFields.push('datum narození');
  if (!formData.phone) missingFields.push('telefon');
  if (!formData.id_doc_type) missingFields.push('typ dokladu');
  if (!formData.id_doc_number) missingFields.push('číslo dokladu');
  if (!formData.street) missingFields.push('ulici');
  if (!formData.house_number) missingFields.push('číslo popisné');
}
```

**Důvod:** Validace jsou univerzální pro všechny typy subjektů (pronajímatelé i nájemníci).

---

### 6. SQL migrace - Testovací nájemníci

#### Soubor
`/supabase/migrations/012_seed_test_tenants.sql`

#### Struktura (stejná jako 011 s výjimkou flagů)

```sql
INSERT INTO public.subjects (
  subject_type,
  display_name,
  email,
  phone,
  is_tenant,              -- ZMĚNA: místo is_landlord
  -- Person fields
  title_before,
  first_name,
  last_name,
  birth_date,
  personal_id_number,
  id_doc_type,
  id_doc_number,
  -- Company fields
  company_name,
  ic,
  dic,
  ic_valid,
  dic_valid,
  -- Address
  street,
  house_number,
  city,
  zip,
  country,
  -- Origin
  origin_module,          -- ZMĚNA: '050' místo '030'
  -- Poznámka
  note,
  is_archived
) VALUES (
  'osoba',
  'Karel Nový - Nájemník',
  'karel.novy@tenant.cz',
  '+420 777 123 456',
  true,                   -- is_tenant
  'Ing.',
  'Karel',
  'Nový',
  '1988-03-12',
  '8803125678',
  'OP',
  'TN123456',
  NULL, NULL, NULL, NULL, NULL,  -- Company fields (NULL pro osobu)
  'Nová',
  '15',
  'Brno',
  '60200',
  'CZ',
  '050',                  -- origin_module
  'Testovací nájemník #1',
  false
);
```

#### Doporučení: Vytvořit 8 testovacích nájemníků
- 2x osoba (fyzická osoba - nájemník)
- 2x firma (s.r.o. jako nájemník)
- 2x zástupce nájemníka
- 2x jiný typ (např. družstvo)

---

### 7. Co PONECHAT identické

✅ **Validace všech polí:**
- Rodné číslo, PSČ, telefon, email
- Povinná pole pro osoby
- Error handling

✅ **UI struktura:**
- DetailTabs
- DetailView wrapper
- Breadcrumbs
- CommonActions

✅ **ForwardRef pattern:**
```typescript
export interface TenantDetailFormHandle {
  validateForm: () => boolean;
}

const TenantDetailForm = forwardRef<TenantDetailFormHandle, TenantDetailFormProps>(
  // ... stejná struktura jako LandlordDetailForm
);
```

✅ **Adresní autocomplete:**
- AddressAutocomplete komponent
- Binding na formData
- address_source tracking

---

## Checklist pro duplikaci

### Příprava
- [ ] Zkopírovat složku `030-pronajimatel` → `050-najemnik`
- [ ] Přejmenovat všechny soubory (Landlord → Tenant)
- [ ] Přejmenovat všechny komponenty v kódu

### Konfigurace
- [ ] Upravit `module.config.js` (id, name, path, icon)
- [ ] Zkrátit menu labels ("Přehled", "Přidat") - už je hotovo

### Databáze
- [ ] Změnit `is_landlord` → `is_tenant`
- [ ] Změnit `is_landlord_delegate` → `is_tenant_delegate`
- [ ] Nastavit `origin_module = '050'`

### Formulář
- [ ] Aktualizovat checkboxy rolí
- [ ] Ověřit že validace funguje
- [ ] Otestovat povinná pole
- [ ] Ověřit forwardRef pattern

### SQL migrace
- [ ] Vytvořit `012_seed_test_tenants.sql`
- [ ] 8 testovacích nájemníků
- [ ] **KRITICKÉ:** `origin_module = '050'`
- [ ] **KRITICKÉ:** `is_tenant = true`

### Testing
- [ ] Build test (`npm run build`)
- [ ] Vytvořit nového nájemníka
- [ ] Editovat existujícího nájemníka
- [ ] Ověřit validace
- [ ] Ověřit povinná pole
- [ ] Ověřit uložení do DB

### Git
- [ ] Commit: `feat: modul 050 - Nájemníci (duplikace z 030)`
- [ ] Push a deploy

---

## Známé pasti

### ⚠️ POZOR #1: origin_module
```sql
-- ŠPATNĚ:
origin_module: NULL  -- Způsobí NOT NULL constraint error

-- SPRÁVNĚ:
origin_module: '050'  -- Pro nájemníky
```

### ⚠️ POZOR #2: Role flagi
```typescript
// ŠPATNĚ (copy-paste z 030):
is_landlord: true

// SPRÁVNĚ:
is_tenant: true
```

### ⚠️ POZOR #3: Paths
```javascript
// ŠPATNĚ:
path: '/pronajimatel'

// SPRÁVNĚ:
path: '/najemnik'
```

### ⚠️ POZOR #4: Import paths
```typescript
// ŠPATNĚ:
import { LandlordDetailForm } from '../030-pronajimatel/forms/LandlordDetailForm';

// SPRÁVNĚ:
import { TenantDetailForm } from '../050-najemnik/forms/TenantDetailForm';
```

---

## Reference dokumentace

1. **validation-roles-implementation.md** - Kompletní implementace validací a rolí z modulu 030
2. **Supabase Snippet 01** - Databázová struktura (role flagi)
3. **011_seed_test_landlords.sql** - Vzor pro 012_seed_test_tenants.sql

---

## Očekávaný výsledek

Po dokončení by měl modul 050 být:
- ✅ Funkčně identický s modulem 030
- ✅ S vlastními daty (nájemníci, ne pronajímatelé)
- ✅ S vlastními flagi (`is_tenant`, `is_tenant_delegate`)
- ✅ S vlastním `origin_module = '050'`
- ✅ Se všemi validacemi a povinnými pole
- ✅ S testovacími daty v databázi

**Priorita:** 🟡 MEDIUM - Po opravě adresního pole

**Odhadovaný čas:** 2-3 hodiny (ruční duplikace + úpravy + testování)
