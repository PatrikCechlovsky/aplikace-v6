# Kontext pro opravu adresního pole

## Problém
Adresní pole (AddressAutocomplete) se nezobrazuje nebo nefunguje správně v detailu pronajímatele a mého účtu.

---

## Současný stav aplikace

### ✅ Co už funguje

1. **Validace polí:**
   - Rodné číslo (Czech format + dělitelnost 11)
   - PSČ (5 číslic)
   - Telefon (mezinárodní formát)
   - Email (standard)

2. **Povinná pole pro osoby:**
   - Rodné číslo, datum narození, telefon
   - Typ a číslo dokladu
   - Ulice, číslo popisné

3. **Reorganizované role:**
   - Sekce: "Přiřazení subjektu jako:"
   - Struktura: Uživatel samostatně, pak páry role+zástupce

4. **Testovací data:**
   - 8 pronajímatelů v DB (2x OSVČ, 2x spolek, 2x zástupce, 2x státní)
   - Správné `origin_module='030'`

---

## Komponenty k prověření

### 1. AddressAutocomplete
**Umístění:** `/app/UI/AddressAutocomplete.tsx`

**Použití v:**
- `/app/modules/030-pronajimatel/forms/LandlordDetailForm.tsx`
- `/app/modules/020-muj-ucet/forms/MyAccountDetailForm.tsx`

**Možné problémy:**
- Binding na formData
- API endpoint `/api/address-search`
- Props předávání (value, onChange)
- Zobrazení výsledků

### 2. Adresní pole v databázi

**Struktura subjects tabulky:**
```sql
street          TEXT  -- Ulice (povinné pro osoby)
house_number    TEXT  -- Číslo popisné (povinné pro osoby)
orientation_number TEXT  -- Číslo orientační
city            TEXT  -- Město
zip             TEXT  -- PSČ (validováno, 5 číslic)
country         TEXT  -- Země (default CZ)
address_source  TEXT  -- Zdroj adresy (ARES, manual, autocomplete)
```

### 3. Současná implementace v LandlordDetailForm

```typescript
<AddressAutocomplete
  value={formData.street || ''}
  onChange={(address) => {
    // TODO: Zkontrolovat správné bindování
    handleFieldChange('street', address.street);
    handleFieldChange('house_number', address.houseNumber);
    handleFieldChange('city', address.city);
    handleFieldChange('zip', address.zip);
    handleFieldChange('address_source', 'autocomplete');
  }}
  placeholder="Začněte psát adresu..."
/>
```

---

## Co je potřeba ověřit

### 1. API endpoint
```bash
# Test adresního API
curl http://localhost:3000/api/address-search?query=Dlouhá%2067%20Praha
```

**Očekávaný response:**
```json
{
  "suggestions": [
    {
      "street": "Dlouhá",
      "houseNumber": "67",
      "city": "Praha 1",
      "zip": "11000",
      "fullAddress": "Dlouhá 67, Praha 1, 11000"
    }
  ]
}
```

### 2. AddressAutocomplete props
- `value` - aktuální hodnota
- `onChange` - callback s address objektem
- `placeholder` - placeholder text
- `disabled` - disabled state

### 3. FormData binding
```typescript
// Zkontrolovat že formData obsahuje:
{
  street: string;
  house_number: string;
  orientation_number?: string;
  city: string;
  zip: string;
  country: string;
  address_source?: string;
}
```

---

## Dokumentace k nahlédnutí

1. **ADDRESS-AUTOCOMPLETE-SETUP.md** - Setup guide pro adresní autocomplete
2. **03-ui/** - UI komponenty dokumentace
3. **Supabase Snippet 01** - Databázová struktura subjects

---

## Kroky k opravě

1. **Analyzovat AddressAutocomplete komponent**
   - Zkontrolovat props interface
   - Ověřit API volání
   - Zkontrolovat zobrazení výsledků

2. **Testovat API endpoint**
   - Zkontrolovat `/api/address-search/route.ts`
   - Ověřit response format
   - Test s různými query

3. **Opravit binding v formulářích**
   - LandlordDetailForm
   - MyAccountDetailForm
   - Správné předávání onChange hodnot

4. **Otestovat celý flow**
   - Začít psát adresu
   - Vybrat z nabídky
   - Ověřit uložení do DB
   - Ověřit načtení při editaci

---

## Reference kód

### Testovací pronajímatel s adresou
```sql
-- Jan Novák - OSVČ
street: 'Hlavní'
house_number: '123'
city: 'Praha'
zip: '11000'
country: 'CZ'
```

### Použití po opravě
```typescript
// Uživatel začne psát
<AddressAutocomplete
  value={formData.street || ''}
  onChange={(address) => {
    setFormData(prev => ({
      ...prev,
      street: address.street,
      house_number: address.houseNumber,
      orientation_number: address.orientationNumber,
      city: address.city,
      zip: address.zip,
      address_source: 'autocomplete'
    }));
  }}
/>
```

---

## Poznámky

- Adresa je částečně povinná (street, house_number pro osoby)
- PSČ má vlastní validaci (5 číslic)
- address_source slouží pro tracking odkud adresa přišla
- Country má default 'CZ'

**Priorita:** 🔴 HIGH - Blokuje použití formulářů s adresou
