# 📋 Detailní shrnutí změn: Adresy, Login a Osobní údaje

**Datum:** 2024 (aktuální session)  
**Modul:** 020-muj-ucet (Můj účet) + UI komponenty  
**Branch:** `feature/ai-spoluprace`

---

## 🎯 Přehled změn

Tento dokument popisuje všechny změny provedené v rámci implementace:
1. **Povinné přihlašovací jméno nebo email** v formuláři "Můj účet"
2. **Adresní pole s autocomplete funkcionalitou** (RÚIAN/Google Places API)
3. **Osobní identifikační údaje** (datum narození, rodné číslo, typ dokladu, číslo dokladu)
4. **Nahrazení tlačítka "Sidebar" tlačítkem "Profile"** v HomeActions
5. **Vylepšené error handling a debugging** pro address autocomplete API

---

## 📁 Změněné soubory

### 1. Databázové migrace

#### `supabase/migrations/005_add_address_to_subjects.sql`
**Účel:** Přidání sloupců pro adresu do tabulky `subjects`

**Přidané sloupce:**
- `street` (TEXT) - Název ulice
- `city` (TEXT) - Název města/obce
- `zip` (TEXT) - PSČ
- `house_number` (TEXT) - Číslo popisné/orientační
- `country` (TEXT, DEFAULT 'CZ') - Kód státu (ISO 3166-1 alpha-2)

**Komentáře:** Všechny sloupce mají SQL komentáře pro dokumentaci

---

#### `supabase/migrations/006_add_personal_id_fields_to_subjects.sql`
**Účel:** Přidání sloupců pro osobní identifikační údaje do tabulky `subjects`

**Přidané sloupce:**
- `birth_date` (DATE) - Datum narození
- `personal_id_number` (TEXT) - Rodné číslo (volitelné, pro ČR formát YYMMDD/XXXX)
- `id_doc_type` (TEXT) - Typ dokladu totožnosti: 'OP' (občanský průkaz), 'PAS' (pas), 'RP' (řidičský průkaz), 'OTHER' (jiný)
- `id_doc_number` (TEXT) - Číslo dokladu totožnosti

**Indexy:**
- `idx_subjects_personal_id_number` - Pro rychlejší vyhledávání podle rodného čísla
- `idx_subjects_id_doc_number` - Pro vyhledávání podle čísla dokladu

**Komentáře:** Všechny sloupce mají SQL komentáře pro dokumentaci

---

### 2. Backend služby

#### `app/lib/services/users.ts`
**Změny:**
- Přidány nové pole do typu `SubjectRow`:
  - `street`, `city`, `zip`, `house_number`, `country`
  - `birth_date`, `personal_id_number`, `id_doc_type`, `id_doc_number`
- Přidány nové pole do typu `SaveUserInput`:
  - `street`, `city`, `zip`, `houseNumber`, `country`
  - `birthDate`, `personalIdNumber`, `idDocType`, `idDocNumber`
- Aktualizován `SELECT` query v `getUserDetail()` - přidány nové sloupce
- Aktualizován `subjectPayload` v `saveUser()` - přidány nové pole pro insert/update

**Důležité:** Mapování camelCase (TypeScript) ↔ snake_case (databáze)

---

#### `app/lib/services/bankAccounts.ts`
**Změny:**
- Přidáno debug logování v `saveBankAccount()` pro diagnostiku RLS problémů
- Loguje session data, subject data a payload před uložením

---

### 3. UI komponenty - Formuláře

#### `app/modules/020-muj-ucet/forms/MyAccountDetailForm.tsx`
**Změny:**
- **Přidáno pole "Přihlašovací jméno nebo email":**
  - Vždy viditelné (ne podmíněné)
  - Povinné pole (`required`)
  - Label: "Přihlašovací jméno nebo email"
  - Placeholder: "povinné (jméno nebo email)"
  - Přidáno do typu `MyAccountFormValue` jako `login: string`

- **Přidána adresní pole:**
  - Integrována komponenta `AddressAutocomplete`
  - Pole: `street`, `city`, `zip`, `houseNumber`, `country`
  - Přidáno do typu `MyAccountFormValue`

- **Přidána osobní identifikační pole:**
  - `birthDate` (date input)
  - `personalIdNumber` (text input) - Rodné číslo
  - `idDocType` (select dropdown) - Typ dokladu: OP, PAS, RP, OTHER
  - `idDocNumber` (text input) - Číslo dokladu
  - Přidáno do typu `MyAccountFormValue`

**Sekce formuláře:**
- "Přihlašovací údaje" - obsahuje login field (vždy viditelný)
- "Osobní údaje" - obsahuje nová pole pro identifikaci
- "Adresa" - obsahuje AddressAutocomplete komponentu

---

#### `app/modules/020-muj-ucet/forms/MyAccountDetailFrame.tsx`
**Změny:**
- Přidány nové pole do typu `UiUser`:
  - `street`, `city`, `zip`, `houseNumber`, `country`
  - `birthDate`, `personalIdNumber`, `idDocType`, `idDocNumber`
  - `login` (pokud ještě nebylo)

- Aktualizována funkce `buildInitialFormValue()`:
  - Mapuje nová pole z `UiUser` do `MyAccountFormValue`
  - Zahrnuje všechny nové adresní a osobní identifikační pole

- Aktualizován `saveUser()` call:
  - Předává všechna nová pole do `saveUser()` funkce

---

#### `app/modules/020-muj-ucet/tiles/MyAccountTile.tsx`
**Změny:**
- Přidána nová pole do typu `UiUser`:
  - `street`, `city`, `zip`, `houseNumber`, `country`
  - `birthDate`, `personalIdNumber`, `idDocType`, `idDocNumber`
  - `login`

- Aktualizována funkce `loadUser()`:
  - Mapuje nová pole z `subject` objektu (vráceného `getUserDetail()`) do `nextUser` objektu
  - Zahrnuje všechny nové adresní a osobní identifikační pole

---

### 4. UI komponenty - Address Autocomplete

#### `app/UI/AddressAutocomplete.tsx`
**Účel:** Autocomplete komponenta pro vyhledávání adres pomocí RÚIAN/Google Places API

**Funkcionalita:**
- Používá Next.js API route (`/api/address-search`) jako proxy (řeší CORS problémy)
- Debounce 500ms pro optimalizaci API volání
- Zobrazuje loading indikátor během načítání
- Zobrazuje dropdown s návrhy adres
- Po výběru návrhu automaticky vyplní pole: `street`, `city`, `zip`, `houseNumber`
- Podporuje pouze české adresy (`country === 'CZ'`)
- Zobrazuje info zprávu, pokud autocomplete nefunguje
- Tlačítko "✕" pro ruční vyplnění (skryje autocomplete)

**Props:**
- `street`, `city`, `zip`, `houseNumber`, `country` - aktuální hodnoty
- `onAddressChange` - callback při změně adresy
- `disabled` - možnost zakázat komponentu
- `className`, `placeholder` - styling props

**Debug logování:**
- Loguje všechny API volání a odpovědi
- Zobrazuje chyby z API route přes `X-Debug-Errors` header

---

#### `app/api/address-search/route.ts`
**Účel:** Next.js API route jako proxy pro address autocomplete (řeší CORS a bezpečně spravuje API klíče)

**Funkcionalita:**
- **Priorita endpointů:**
  1. Visidoo API (pokud je nastaven `NEXT_PUBLIC_VISIDOO_API_KEY`)
  2. Google Places API (pokud je nastaven `GOOGLE_PLACES_API_KEY` nebo `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`)
  3. Fallback RÚIAN endpointy (ruian.cuzk.cz, cuzk.ruian.cz, skaut.cz, fnx.io)

- **Error handling:**
  - Zkouší každý endpoint postupně
  - Timeout 5 sekund na endpoint
  - Detailní error logging pro každý endpoint
  - Pro Google Places API: zpracovává statusy (`OK`, `ZERO_RESULTS`, `REQUEST_DENIED`, `INVALID_REQUEST`, `OVER_QUERY_LIMIT`)
  - Vrací chyby v `X-Debug-Errors` headeru pro debugging na klientovi

- **Transformace dat:**
  - Google Places API: transformuje `predictions` do jednotného formátu
  - Visidoo API: podporuje různé formáty odpovědí (`data`, `results`, array)
  - Ostatní RÚIAN API: podporuje různé formáty odpovědí

- **Caching:**
  - Cache-Control header: `public, s-maxage=3600, stale-while-revalidate=86400`

- **Runtime:**
  - `export const runtime = 'nodejs'` - potřebné pro `setTimeout` a další Node.js API

**Environment variables:**
- `NEXT_PUBLIC_VISIDOO_API_KEY` - Visidoo API klíč
- `GOOGLE_PLACES_API_KEY` - Google Places API klíč (doporučeno, server-side)
- `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` - Fallback pro Google Places API klíč
- `NEXT_PUBLIC_RUIAN_API_KEY` - Legacy RÚIAN API klíč

---

### 5. UI komponenty - HomeActions

#### `app/UI/HomeActions.tsx`
**Změny:**
- **Odstraněno:**
  - Tlačítko "Sidebar" (`onForceSidebar` prop)
  - Funkcionalita pro vynucení sidebar layoutu

- **Přidáno:**
  - Tlačítko "Profile" - otevírá modul "Můj účet" (020-muj-ucet)
  - Používá `handleModuleSelect` callback pro navigaci

**Props:**
- `handleModuleSelect` - callback pro výběr modulu (povinné)
- Ostatní props zůstaly beze změny

---

#### `app/AppShell.tsx`
**Změny:**
- **Odstraněno:**
  - Funkce `forceSidebarLayout()` - již není potřeba
  - Všechny reference na `forceSidebarLayout`

- **Aktualizováno:**
  - `HomeActions` komponenta - předává `handleModuleSelect` pro "Profile" tlačítko
  - Odstraněna prop `onForceSidebar` z `HomeActions`

---

### 6. Environment variables

#### `app/lib/env.ts`
**Změny:**
- Přidány nové optional environment variables:
  - `NEXT_PUBLIC_VISIDOO_API_KEY` - Visidoo API klíč
  - `GOOGLE_PLACES_API_KEY` - Google Places API klíč (server-side, doporučeno)
  - `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` - Fallback pro Google Places API klíč
  - `NEXT_PUBLIC_RUIAN_API_KEY` - Legacy RÚIAN API klíč

- Aktualizován `env` objekt:
  - `GOOGLE_PLACES_API_KEY` - podporuje fallback na `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`

---

### 7. Dokumentace

#### `docs/ADDRESS-AUTOCOMPLETE-SETUP.md`
**Účel:** Dokumentace pro nastavení address autocomplete funkcionality

**Obsah:**
- Popis doporučených API služeb (Visidoo, Google Places)
- Instrukce pro registraci a získání API klíčů
- Konfigurace environment variables
- Nastavení na Vercelu
- Ověření funkčnosti
- Řešení problémů (troubleshooting)
- Tipy a doporučení

**Aktualizace:**
- Přidány instrukce pro Google Places API (aktivace, omezení klíče)
- Přidány informace o error handling (REQUEST_DENIED, INVALID_REQUEST)
- Aktualizovány environment variable názvy (GOOGLE_PLACES_API_KEY vs NEXT_PUBLIC_GOOGLE_PLACES_API_KEY)

---

## 🔧 Technické detaily

### TypeScript typy

**Nové/upravené typy:**

1. **`MyAccountFormValue`** (MyAccountDetailForm.tsx):
   ```typescript
   {
     // ... existující pole
     login: string
     street: string
     city: string
     zip: string
     houseNumber: string
     country: string
     birthDate: string
     personalIdNumber: string
     idDocType: string
     idDocNumber: string
   }
   ```

2. **`UiUser`** (MyAccountDetailFrame.tsx, MyAccountTile.tsx):
   ```typescript
   {
     // ... existující pole
     login?: string
     street?: string
     city?: string
     zip?: string
     houseNumber?: string
     country?: string
     birthDate?: string
     personalIdNumber?: string
     idDocType?: string
     idDocNumber?: string
   }
   ```

3. **`SubjectRow`** (users.ts):
   ```typescript
   {
     // ... existující pole
     street?: string
     city?: string
     zip?: string
     house_number?: string
     country?: string
     birth_date?: Date
     personal_id_number?: string
     id_doc_type?: string
     id_doc_number?: string
   }
   ```

4. **`SaveUserInput`** (users.ts):
   ```typescript
   {
     // ... existující pole
     street?: string
     city?: string
     zip?: string
     houseNumber?: string
     country?: string
     birthDate?: string
     personalIdNumber?: string
     idDocType?: string
     idDocNumber?: string
   }
   ```

5. **`AddressSuggestion`** (AddressAutocomplete.tsx):
   ```typescript
   {
     street: string
     city: string
     zip: string
     houseNumber: string
     ruianId?: string
     fullAddress: string
   }
   ```

---

### Mapování dat

**CamelCase ↔ snake_case:**
- TypeScript/React: `houseNumber` ↔ Databáze: `house_number`
- TypeScript/React: `birthDate` ↔ Databáze: `birth_date`
- TypeScript/React: `personalIdNumber` ↔ Databáze: `personal_id_number`
- TypeScript/React: `idDocType` ↔ Databáze: `id_doc_type`
- TypeScript/React: `idDocNumber` ↔ Databáze: `id_doc_number`

**Důležité:** Všechna mapování jsou implementována v:
- `buildInitialFormValue()` - z `UiUser` do `MyAccountFormValue`
- `loadUser()` - z `SubjectRow` do `UiUser`
- `saveUser()` - z `SaveUserInput` do databázového payloadu

---

### API integrace

**Address Autocomplete:**
- **Architektura:** Client → Next.js API Route → External API
- **Důvody:**
  - Řeší CORS problémy (API klíče na serveru, ne na klientovi)
  - Bezpečné spravování API klíčů (nejsou vystaveny v browseru)
  - Centralizované error handling a logging
  - Možnost cache na serveru

**Podporované API:**
1. **Visidoo API** - specializované na české adresy (RÚIAN)
2. **Google Places API** - univerzální, spolehlivé
3. **RÚIAN endpointy** (fallback) - ruian.cuzk.cz, cuzk.ruian.cz, skaut.cz, fnx.io

**Priorita:** Visidoo > Google Places > RÚIAN fallback

---

## 🐛 Opravené chyby

### 1. TypeScript chyby

**Chyba:** `Property 'street' does not exist on type 'SaveUserInput'`  
**Oprava:** Přidány nová pole do typu `SaveUserInput` v `app/lib/services/users.ts`

**Chyba:** `Type '{ displayName: string; ... }' is missing the following properties from type 'MyAccountFormValue': street, city, zip, houseNumber, country`  
**Oprava:** Přidána nová pole do typu `MyAccountFormValue` a aktualizována `buildInitialFormValue()`

**Chyba:** `Object literal may only specify known properties, and 'street' does not exist in type 'UiUser'`  
**Oprava:** Přidána nová pole do typu `UiUser` v `MyAccountDetailFrame.tsx` a `MyAccountTile.tsx`

**Chyba:** `Object literal may only specify known properties, and 'birthDate' does not exist in type 'UiUser'`  
**Oprava:** Přidána nová pole pro osobní identifikaci do typu `UiUser`

**Chyba:** `Type error: No overload matches this call. ... Property 'Authorization' is incompatible with index signature. Type 'undefined' is not assignable to type 'string'`  
**Oprava:** Upraveno `AddressAutocomplete.tsx` - zajištěno, že `headers` objekty neobsahují `undefined` hodnoty

**Chyba:** `Type error: 'country' is declared but its value is never read`  
**Oprava:** Odstraněna nepoužívaná proměnná `country` z Google Places API parsing logiky

**Chyba:** `Type error: 'forceSidebarLayout' is declared but its value is never read`  
**Oprava:** Odstraněna nepoužívaná funkce `forceSidebarLayout` z `AppShell.tsx`

---

### 2. Databázové chyby

**Chyba:** `column subjects.zip does not exist`  
**Oprava:** Vytvořena migrace `005_add_address_to_subjects.sql` pro přidání adresních sloupců

**Chyba:** `column subjects.birth_date does not exist`  
**Oprava:** Vytvořena migrace `006_add_personal_id_fields_to_subjects.sql` pro přidání osobních identifikačních sloupců

---

### 3. RLS (Row Level Security) problémy

**Chyba:** `permission denied for table users po uložení účtu`  
**Oprava:** Upravena RLS policy v `supabase/migrations/004_fix_bank_accounts_rls_clean.sql` - odstraněn přímý přístup k `auth.users`, používá se `auth.uid()` a `auth.jwt()` pro email verification

**Chyba:** `new row violates row-level security policy for table "bank_accounts"`  
**Oprava:** Přidáno debug logování v `bankAccounts.ts` a upravena RLS policy

---

## 📝 Poznámky k implementaci

### Login field

- **Původní požadavek:** Přidat povinné přihlašovací jméno
- **Problém:** Uživatel nemá přihlašovací jméno, pouze email
- **Řešení:** Pole přijímá buď přihlašovací jméno nebo email, je vždy viditelné a povinné
- **Label:** "Přihlašovací jméno nebo email"
- **Placeholder:** "povinné (jméno nebo email)"

---

### Address Autocomplete

- **Problém:** RÚIAN API endpointy nefungují (404, CORS, fetch failed)
- **Řešení:** 
  - Vytvořena Next.js API route jako proxy
  - Přidána podpora pro Visidoo API a Google Places API
  - Implementován fallback mechanismus s více endpointy
  - Detailní error handling a debug logging

- **Aktuální stav:** 
  - Google Places API je nastaveno, ale vyžaduje aktivaci v Google Cloud Console
  - Visidoo API není nastaveno (uživatel se může zaregistrovat později)
  - Fallback RÚIAN endpointy nefungují (očekáváno)

- **Doporučení:** Pro produkci použít Visidoo API (specializované na české adresy)

---

### Personal Identification Fields

- **Přidaná pole:**
  - Datum narození (`birthDate`) - date input
  - Rodné číslo (`personalIdNumber`) - text input
  - Typ dokladu (`idDocType`) - select: OP, PAS, RP, OTHER
  - Číslo dokladu (`idDocNumber`) - text input

- **Umístění:** Sekce "Osobní údaje" v `MyAccountDetailForm`
- **Validace:** Žádná specifická validace (může být přidána později)

---

## 🚀 Nasazení

### Lokální vývoj

1. **Environment variables:**
   - Vytvoř/uprav `.env.local` v root složce
   - Přidej `GOOGLE_PLACES_API_KEY` nebo `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`
   - (Volitelně) Přidej `NEXT_PUBLIC_VISIDOO_API_KEY`

2. **Databázové migrace:**
   - Spusť migrace: `supabase migration up` (nebo přes Supabase Dashboard)
   - Ověř, že sloupce byly přidány do tabulky `subjects`

3. **Restart dev serveru:**
   - Zastav aktuální server (Ctrl+C)
   - Spusť znovu: `npm run dev`

---

### Produkce (Vercel)

1. **Environment variables:**
   - Jdi do projektu na Vercelu → Settings → Environment Variables
   - Přidej `GOOGLE_PLACES_API_KEY` (nebo `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`)
   - Nastav pro "Production", "Preview", "Development"
   - (Volitelně) Přidej `NEXT_PUBLIC_VISIDOO_API_KEY`

2. **Databázové migrace:**
   - Spusť migrace na produkční databázi (Supabase Dashboard nebo CLI)

3. **Redeploy:**
   - Automaticky se spustí po push do main branch
   - Nebo manuálně: Deployments → Redeploy

---

## ✅ Testování

### Co testovat:

1. **Login field:**
   - [ ] Pole je vždy viditelné v "Můj účet" → "Detail"
   - [ ] Pole je povinné (nelze uložit prázdné)
   - [ ] Lze zadat buď jméno nebo email
   - [ ] Hodnota se ukládá do databáze

2. **Address Autocomplete:**
   - [ ] Zobrazuje se v "Můj účet" → "Detail" → sekce "Adresa"
   - [ ] Po zadání 3+ znaků se zobrazuje "Načítám..."
   - [ ] Zobrazují se návrhy adres (pokud API funguje)
   - [ ] Po výběru návrhu se vyplní pole: street, city, zip, houseNumber
   - [ ] Pokud API nefunguje, zobrazuje se info zpráva
   - [ ] Tlačítko "✕" skryje autocomplete a umožní ruční vyplnění

3. **Personal Identification Fields:**
   - [ ] Zobrazují se v "Můj účet" → "Detail" → sekce "Osobní údaje"
   - [ ] Datum narození - date picker funguje
   - [ ] Rodné číslo - text input funguje
   - [ ] Typ dokladu - select dropdown s možnostmi: OP, PAS, RP, OTHER
   - [ ] Číslo dokladu - text input funguje
   - [ ] Všechna pole se ukládají do databáze

4. **HomeActions:**
   - [ ] Tlačítko "Sidebar" bylo odstraněno
   - [ ] Tlačítko "Profile" je viditelné
   - [ ] Kliknutí na "Profile" otevře modul "Můj účet"

---

## 📚 Související dokumentace

- `docs/ADDRESS-AUTOCOMPLETE-SETUP.md` - Nastavení address autocomplete
- `docs/01-core/subject-fields.md` - Dokumentace polí subjektu
- `supabase/migrations/005_add_address_to_subjects.sql` - Migrace pro adresy
- `supabase/migrations/006_add_personal_id_fields_to_subjects.sql` - Migrace pro osobní údaje

---

## 🔮 Budoucí vylepšení

1. **Address Autocomplete:**
   - Integrace Visidoo API (doporučeno pro produkci)
   - Získání detailních údajů (PSČ, číslo popisné) z Google Places Details API
   - Validace adres vůči RÚIAN

2. **Personal Identification:**
   - Validace rodného čísla (formát YYMMDD/XXXX)
   - Validace čísla dokladu podle typu
   - Možnost nahrání skenu dokladu

3. **Login field:**
   - Validace unikátnosti přihlašovacího jména
   - Možnost změny přihlašovacího jména

---

## 📞 Kontakt / Podpora

Pro otázky nebo problémy kontaktujte vývojový tým nebo vytvořte issue v repozitáři.

---

**Konec dokumentu**

