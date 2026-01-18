# CHANGELOG – Implementace Uživatelů nájemníka a Debounce vyhledávání

**Datum:** 17.-18. ledna 2026  
**Branch:** `feature/ai-spoluprace`  
**Commits:** 73db7b4 až db1e8b8 (8 commitů)

---

## 🎯 Přehled změn

### 1. Nová funkce: Tab "Uživatelé" v detailu nájemníka
**Požadavek:** _"každý nájemník v bytě může mít svého spolubydlícího nebo více spolubydlících"_

### 2. Oprava checkboxů v detailu nájemníka
**Požadavek:** _"na druhém řádku jsem chtěl jako první sloupec pronajimatel a zástupce pronajimatele a na druhém nájemník a zástupce nájemníka"_

### 3. Debounce mechanismus pro vyhledávání
**Požadavek:** _"když napíšu tři písmena na klávesnici do políčka pro vyhledávání, napíše se mi jen jedno... je možné udělat nějaké spoždění abych mohl napsat alespoň 3-5 písmen?"_

---

## 📋 Detailní dokumentace

### 1. Nová záložka "Uživatelé" (TenantUsersSection)

#### 1.1 Databázová migrace

**Soubor:** `supabase/migrations/052_create_tenant_users.sql`

**Tabulka:** `public.tenant_users`

| Sloupec | Typ | Povinné | Popis |
|---------|-----|---------|-------|
| `id` | UUID | ✅ | Primární klíč |
| `tenant_id` | UUID | ✅ | Foreign key → `subjects(id)` |
| `first_name` | TEXT | ✅ | Jméno uživatele |
| `last_name` | TEXT | ✅ | Příjmení |
| `birth_date` | DATE | ✅ | Datum narození |
| `note` | TEXT | ❌ | Poznámka (vztah: manželka, syn...) |
| `is_archived` | BOOLEAN | ✅ | Archivace (default false) |
| `created_at` | TIMESTAMPTZ | ✅ | Čas vytvoření |
| `updated_at` | TIMESTAMPTZ | ✅ | Čas aktualizace |
| `created_by` | UUID | ❌ | Foreign key → `auth.users(id)` |

**Indexy:**
- `idx_tenant_users_tenant_id` – rychlé vyhledávání dle nájemníka
- `idx_tenant_users_created_at` – třídění dle data vytvoření

**RLS Policies:**
- `tenant_users_select_policy` – čtení pokud má přístup k nájemníkovi
- `tenant_users_insert_policy` – vkládání pro přihlášené uživatele
- `tenant_users_update_policy` – aktualizace pro přihlášené uživatele
- `tenant_users_delete_policy` – mazání (archivace) pro přihlášené uživatele

**⚠️ POZNÁMKA:** Migrace je připravena, ale **NENÍ SPUŠTĚNA** v Supabase. Před nasazením do produkce je třeba:
1. Otevřít Supabase Dashboard
2. SQL Editor → Vložit obsah `052_create_tenant_users.sql`
3. Spustit migraci

---

#### 1.2 Service Layer

**Soubor:** `app/lib/services/tenantUsers.ts`

**Exportované funkce:**

```typescript
// Načtení uživatelů nájemníka
export async function listTenantUsers(params: { 
  tenantId: string 
  includeArchived?: boolean 
}): Promise<TenantUserRow[]>

// Vytvoření nového uživatele
export async function createTenantUser(data: {
  tenantId: string
  firstName: string
  lastName: string
  birthDate: string
  note?: string
}): Promise<TenantUserRow>

// Aktualizace uživatele
export async function updateTenantUser(
  id: string, 
  data: Partial<TenantUserRow>
): Promise<TenantUserRow>

// Archivace uživatele
export async function archiveTenantUser(id: string): Promise<void>

// Obnovení z archivu
export async function restoreTenantUser(id: string): Promise<void>
```

**Použité RLS:** Všechny operace respektují policies z migrace 052.

---

#### 1.3 UI Komponenta

**Soubor:** `app/UI/detail-sections/TenantUsersSection.tsx` (338 řádků)

**Props:**
```typescript
type TenantUsersSectionProps = {
  tenantId: string
  viewMode: 'view' | 'edit' | 'create'
}
```

**Funkce:**
- ✅ **Seznam uživatelů** (RelationListWithDetail pattern)
- ✅ **Read-only režim** (`viewMode='view'`) – skryje formulář
- ✅ **Edit režim** (`viewMode='edit'` nebo `'create'`) – zobrazí formulář
- ✅ **4 navigační tlačítka:**
  - ◀️ Předchozí (chevron-left)
  - ▶️ Další (chevron-right)
  - ➕ Přidat (add)
  - 💾 Uložit (save)
- ✅ **2-sloupcový layout** (jako AccountsSection)
- ✅ **Validace:**
  - Jméno povinné (min 2 znaky)
  - Příjmení povinné (min 2 znaky)
  - Datum narození povinné (formát YYYY-MM-DD)
- ✅ **Archivace** místo fyzického mazání

**Design pattern:**
```typescript
// Read-only check
const readOnly = viewMode === 'view'

// Podmíněný render formuláře
{!readOnly && (
  <section className="detail-form__section">
    {/* Formulář pro Jméno, Příjmení, Datum narození, Poznámka */}
  </section>
)}
```

**Styling:** Použity CSS třídy z `app/styles/components/detail-form.css`

---

#### 1.4 Registrace v DetailView

**Soubor:** `app/UI/DetailView.tsx`

**Řádek 354:**
```typescript
users: {
  id: 'users',
  label: 'Uživatelé',
  render: (ctx) => {
    const TenantUsersSection = require('@/app/UI/detail-sections/TenantUsersSection').default
    return <TenantUsersSection tenantId={entityId} viewMode={ctx.mode ?? 'edit'} />
  },
},
```

**Viditelnost:** Tab se zobrazuje pouze pro modul `tenants` (nájemníci).

---

### 2. Oprava checkboxů v detailu nájemníka

**Soubor:** `app/modules/050-najemnik/forms/TenantDetailForm.tsx`

**Původní chyba:** Checkbox "Zástupce pronajimatele" byl na řádku 2, ale měl být "Zástupce nájemníka".

**Opravené pořadí:**

| Řádek | Sloupec 1 | Sloupec 2 |
|-------|-----------|-----------|
| 1 | ☑️ Uživatel aplikace | — |
| 2 | ☑️ **Pronajímatel** | ☑️ **Zástupce pronajimatele** |
| 3 | ☑️ **Nájemník** | ☑️ **Zástupce nájemníka** |
| 4 | ☑️ Údržba | ☑️ Zástupce údržby |

**Typová oprava:**
- Přidána property `isLandlordDelegate: boolean` do typu `TenantFormValue`
- Přidána inicializace v `buildInitialFormValue()` v TenantDetailFrame.tsx
- Přidána property `isLandlordDelegate?: boolean | null` do typu `UiTenant`

**Commits:**
- c90a030: Oprava pořadí checkboxů
- d844919: Přidání `isLandlordDelegate` do typu TenantFormValue
- b69d23a: Přidání do `buildInitialFormValue`
- db1e8b8: Přidání do typu UiTenant

---

### 3. Debounce mechanismus pro vyhledávání

**Problém:** Při psaní do vyhledávacího pole se znaky ztrácely, protože každý znak spouštěl API call a re-render.

**Řešení:** Oddělení okamžité hodnoty inputu od debounced hodnoty pro API.

#### 3.1 Implementované soubory

**Opravené komponenty:**
1. `app/modules/050-najemnik/tiles/TenantsTile.tsx`
2. `app/modules/030-pronajimatel/tiles/LandlordsTile.tsx`
3. `app/modules/010-sprava-uzivatelu/tiles/UsersTile.tsx`
4. `app/UI/GenericTypeTile.tsx` (všechny číselníky v nastavení)

#### 3.2 Princip fungování

**Před opravou:**
```typescript
const [filterText, setFilterText] = useState('')

// Okamžitě volá API při každém znaku
useEffect(() => {
  void load()  // ← API call
}, [filterText])

// Input je přímo svázán s filterText
<input value={filterText} onChange={(e) => setFilterText(e.target.value)} />
```

**Po opravě:**
```typescript
const [filterInput, setFilterInput] = useState('')  // ← Okamžitá hodnota
const [filterText, setFilterText] = useState('')   // ← Debounced hodnota

// Debounce 500ms
useEffect(() => {
  const timer = setTimeout(() => {
    setFilterText(filterInput)  // ← Čeká 500ms
  }, 500)
  return () => clearTimeout(timer)
}, [filterInput])

// API se volá pouze při změně debounced hodnoty
useEffect(() => {
  void load()
}, [filterText])

// Input používá okamžitou hodnotu
<ListView 
  filterValue={filterInput}  // ← Vidíš znaky okamžitě
  onFilterChange={setFilterInput}
/>
```

**Výsledek:**
- ✅ Můžeš psát rychle, všechny znaky se zobrazují okamžitě
- ✅ API call se spustí až 500ms po ukončení psaní
- ✅ Žádné ztracené znaky
- ✅ Méně zbytečných API callů

#### 3.3 Srovnání s přílohovým systémem

| Aspekt | Přílohy (DetailAttachmentsSection) | Seznamy (TenantsTile apod.) |
|--------|-----------------------------------|------------------------------|
| **Filtrování** | Client-side (v paměti) | Server-side (API + DB) |
| **Data** | Načtena najednou | Načítána s filtrem |
| **Rychlost** | Okamžité | 500ms debounce |
| **Vhodné pro** | Malé datasety (< 100 položek) | Velké datasety (> 500 položek) |

**Poznámka:** Přílohy používají `useMemo` pro okamžité filtrování již načtených dat. Seznamy používají debounce, protože data jsou načítána z databáze s každým filtrem.

---

## 🐛 Opravené bugy

### Bug 1: Formulář viditelný v read mode
**Soubor:** `app/UI/detail-sections/TenantUsersSection.tsx`

**Původní problém:**
```typescript
viewMode: 'read' | 'edit' | 'create'  // ❌ Typ 'read'
const readOnly = viewMode === 'read'  // ❌ Kontrola na 'read'
```

**Problém:** DetailView posílal `mode='view'`, ale komponenta kontrolovala `'read'`.

**Oprava:**
```typescript
viewMode: 'view' | 'edit' | 'create'  // ✅ Typ 'view'
const readOnly = viewMode === 'view'  // ✅ Kontrola na 'view'
```

**Commit:** 73db7b4

---

### Bug 2: TypeScript compilation errors
**Chyby:**
1. `Property 'isLandlordDelegate' does not exist on type 'TenantFormValue'`
2. `Property 'isLandlordDelegate' is missing in buildInitialFormValue`
3. `Property 'isLandlordDelegate' does not exist on type 'UiTenant'`

**Oprava:** Přidána property do všech 3 míst (d844919, b69d23a, db1e8b8)

---

## 📦 Soubory ke kontrole před nasazením

### ✅ Připraveno k deploy
- [x] `app/UI/detail-sections/TenantUsersSection.tsx` – nová komponenta
- [x] `app/lib/services/tenantUsers.ts` – nový service
- [x] `app/UI/DetailView.tsx` – registrace tab 'users'
- [x] `app/modules/050-najemnik/forms/TenantDetailForm.tsx` – oprava checkboxů
- [x] `app/modules/050-najemnik/forms/TenantDetailFrame.tsx` – type fix
- [x] `app/modules/050-najemnik/tiles/TenantsTile.tsx` – debounce
- [x] `app/modules/030-pronajimatel/tiles/LandlordsTile.tsx` – debounce
- [x] `app/modules/010-sprava-uzivatelu/tiles/UsersTile.tsx` – debounce
- [x] `app/UI/GenericTypeTile.tsx` – debounce

### ⚠️ NUTNÉ SPUSTIT PŘED DEPLOY
- [ ] **Migration 052** v Supabase Dashboard
  - SQL Editor → vložit `supabase/migrations/052_create_tenant_users.sql`
  - Ověřit vytvoření tabulky `tenant_users`
  - Ověřit indexy a RLS policies

### 📋 Testovací checklist po deploy

**1. Otestovat tab "Uživatelé" u nájemníka:**
- [ ] Tab se zobrazuje v detailu nájemníka
- [ ] V read mode je viditelný pouze seznam
- [ ] V edit mode je viditelný seznam + formulář
- [ ] Tlačítko ➕ Přidat funguje
- [ ] Navigace ◀️ ▶️ mezi uživateli funguje
- [ ] Tlačítko 💾 Uložit funguje
- [ ] Validace jména/příjmení/data narození
- [ ] Archivace uživatele (nezobrazí se v seznamu)

**2. Otestovat checkboxy v detailu nájemníka:**
- [ ] Řádek 2: Pronajímatel + Zástupce pronajimatele
- [ ] Řádek 3: Nájemník + Zástupce nájemníka
- [ ] Řádek 4: Údržba + Zástupce údržby

**3. Otestovat vyhledávání:**
- [ ] Seznam nájemníků: rychlé psaní "Praha" → všechna písmena viditelná
- [ ] Seznam pronajímatelů: rychlé psaní → bez ztráty znaků
- [ ] Seznam uživatelů: rychlé psaní → bez ztráty znaků
- [ ] Číselníky v nastavení: rychlé psaní → bez ztráty znaků
- [ ] Výsledky se zobrazí ~500ms po ukončení psaní

---

## 🔗 Související dokumenty

- [docs/03-ui-system.md](03-ui-system.md) – 6-section layout
- [docs/04-modules.md](04-modules.md) – Module system
- [docs/06-data-model.md](06-data-model.md) – Database schema
- [app/modules/postup.md](../app/modules/postup.md) – Module development process

---

## 📝 Poznámky pro budoucí vývoj

### Možná vylepšení:
1. **Client-side filtrování pro malé datasety** – Pokud máš < 500 nájemníků/pronajímatelů, zvažit přepnutí na okamžité filtrování jako u příloh
2. **Export CSV** – Přidat export seznamu uživatelů nájemníka
3. **Hromadný import** – Import spolubydlících z CSV
4. **Notifikace při změně** – Poslat email nájemníkovi když se přidá/odebere spolubydlící

### Technický dluh:
- Zvážit unifikaci typu `viewMode` vs `mode` napříč komponentami
- Zvážit globální nastavení debounce času (konstanta místo hardcoded 500ms)

---

**Status:** ✅ Připraveno k nasazení (po spuštění migrace 052)  
**Branch:** `feature/ai-spoluprace`  
**Posledný commit:** db1e8b8
