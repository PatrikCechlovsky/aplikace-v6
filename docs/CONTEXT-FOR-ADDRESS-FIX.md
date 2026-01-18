# 🔧 CONTEXT: Oprava AddressAutocomplete

**Datum:** 15. ledna 2026  
**Status:** ⚠️ AddressAutocomplete nefunguje nebo se nezobrazuje  
**Priorita:** Střední

---

## ✅ Co už funguje

### Validace a povinná pole
- Všechny validace pro osobní údaje (jméno, příjmení, rodné číslo, datum narození, doklad)
- Všechny validace pro firemní údaje (IČO, DIČ, název společnosti)
- Validace adresy (ulice, město, PSČ, číslo popisné)
- Validace emailu a telefonu
- Real-time validace s chybovými hláškami
- Validace se spouští při blur a před uložením

### Role a systém subjektů
- Polymorfní Subject model s 6 typy: `osoba`, `osvc`, `firma`, `spolek`, `statni`, `zastupce`
- Role: `isUser`, `isLandlord`, `isLandlordDelegate`, `isTenant`, `isTenantDelegate`, `isMaintenance`, `isMaintenanceDelegate`
- Type-specific validace (různá povinná pole pro osoby vs. firmy)
- Seed data: 10 testovacích pronajímatelů (2x každý typ)

### UI a formuláře
- 6-sekční layout (HomeButton, Sidebar, TopBar, CommonActions, Content, Footer)
- EntityDetailFrame s tabs (Detail, Vztahy, Přílohy)
- DetailView pro read-only zobrazení
- LandlordDetailForm pro editaci
- MyAccountDetailForm pro uživatelský profil

### ARES integrace
- Funguje načítání dat z ARES podle IČO
- API route: `/api/ares/route.ts`
- Automatické předvyplnění firemních údajů a adresy

---

## ⚠️ Problém: AddressAutocomplete

### Popis
AddressAutocomplete komponenta se buď nezobrazuje nebo nefunguje správně v těchto formulářích:
- `app/modules/030-pronajimatel/forms/LandlordDetailForm.tsx` (řádek 673)
- `app/modules/020-muj-ucet/forms/MyAccountDetailForm.tsx` (řádek 319)

### Symptomy
- Komponenta se možná vůbec nevykresluje
- Nebo se vykresluje, ale autocomplete dropdown se neotevírá
- Nebo se dropdown otevírá, ale žádné výsledky se nezobrazují
- Nebo API volání selhávají

---

## 📍 Klíčové komponenty k prověření

### 1. AddressAutocomplete.tsx
**Umístění:** `app/UI/AddressAutocomplete.tsx`

**Props interface:**
```typescript
export type AddressAutocompleteProps = {
  street: string
  city: string
  zip: string
  houseNumber: string
  country: string
  onAddressChange: (address: {
    street: string
    city: string
    zip: string
    houseNumber: string
    country: string
  }) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}
```

**Funkce:**
- Vyhledává adresy v RÚIAN pomocí `/api/address-search`
- Debounce 500ms před vyhledáváním
- Minimum 3 znaky pro spuštění vyhledávání
- Funguje pouze pro `country === 'CZ'`
- Zobrazuje dropdown s návrhy
- Po kliknutí na návrh volá `onAddressChange()` s kompletní adresou

**Možné problémy:**
- ❓ Komponenta se nevykresluje (CSS problém?)
- ❓ Dropdown se neotevírá (`isOpen` state?)
- ❓ API volání selhávají
- ❓ Binding k formulářovým polím nefunguje

### 2. API Route
**Umístění:** `app/api/address-search/route.ts`

**Funkce:**
- Proxy pro různá RÚIAN API (řeší CORS)
- Podporuje více endpointů:
  1. **Visidoo API** (nejlepší, ale vyžaduje API klíč)
  2. **Google Places API** (spolehlivé, vyžaduje API klíč)
  3. Fallback RÚIAN endpointy (možná nefungují)

**Environment variables:**
```bash
NEXT_PUBLIC_VISIDOO_API_KEY=váš_klíč
GOOGLE_PLACES_API_KEY=váš_klíč
NEXT_PUBLIC_RUIAN_API_KEY=váš_klíč
```

**Možné problémy:**
- ❓ Chybí API klíče v `.env.local`
- ❓ Žádný endpoint nevrací data
- ❓ CORS problémy (i přes proxy?)
- ❓ Timeout (5s limit pro každý endpoint)
- ❓ Transformace dat selhává

### 3. Binding v LandlordDetailForm
**Umístění:** `app/modules/030-pronajimatel/forms/LandlordDetailForm.tsx` (řádky 670-695)

**Aktuální implementace:**
```tsx
<AddressAutocomplete
  street={val.street}
  city={val.city}
  zip={val.zip}
  houseNumber={val.houseNumber}
  country={val.country}
  onAddressChange={(address) => {
    update({
      street: address.street,
      city: address.city,
      zip: address.zip,
      houseNumber: address.houseNumber,
      country: address.country,
    })
  }}
  placeholder="Začněte psát adresu (např. 'Praha, Václavské náměstí')"
  className="detail-form__input"
  disabled={readOnly}
/>
```

**Možné problémy:**
- ❓ Props se nepropagují správně
- ❓ `update()` funkce nefunguje
- ❓ Re-render po změně address nefunguje
- ❓ Conditional rendering (`country === 'CZ'`) je splněn?

### 4. Binding v MyAccountDetailForm
**Umístění:** `app/modules/020-muj-ucet/forms/MyAccountDetailForm.tsx` (řádek 319)

**Pravděpodobně podobná implementace jako v LandlordDetailForm.**

---

## 🎯 Diagnostické kroky

### Krok 1: Vizuální kontrola
1. Otevřít aplikaci v prohlížeči
2. Přejít na editaci pronajimatele (modul 030)
3. Zkontrolovat, zda se komponenta AddressAutocomplete vykresluje:
   - ✅ Vidím input field?
   - ✅ Input má správný placeholder?
   - ✅ Input je editovatelný?

### Krok 2: Console debugging
1. Otevřít Developer Tools (F12)
2. Zkontrolovat konzoli:
   - ❓ Jsou nějaké chyby (červené hlášky)?
   - ❓ Jsou nějaké varování (žluté hlášky)?
3. Začít psát do input fieldu (např. "Praha Václav")
4. Sledovat konzoli:
   - ✅ `🔍 Searching RÚIAN addresses for: Praha Václav`
   - ✅ `🔍 Loading suggestions for query: Praha Václav`
   - ✅ `✅ API response: [...]`
   - ✅ `✅ Received X suggestions`
   - ❌ `❌ API route returned: 404` (API route neexistuje?)
   - ❌ `❌ Error fetching RÚIAN addresses` (síťová chyba?)
   - ❌ `⚠️ No suggestions found` (žádné výsledky)

### Krok 3: Network tab
1. Otevřít Network tab v Developer Tools
2. Začít psát do input fieldu
3. Zkontrolovat XHR/Fetch requesty:
   - ✅ Vidím request na `/api/address-search?q=...`?
   - ✅ Request má status 200?
   - ❌ Request má status 404 (API route neexistuje?)
   - ❌ Request má status 500 (serverová chyba?)
   - ❌ Request trvá příliš dlouho (timeout?)
4. Kliknout na request a zkontrolovat:
   - **Response**: Co API vrátilo? (JSON pole návrhů?)
   - **Headers**: Jsou nějaké debug hlavičky? (`X-Debug-Errors`)

### Krok 4: API route test
1. Otevřít terminál
2. Spustit curl test:
   ```bash
   curl "http://localhost:3000/api/address-search?q=Praha%20Václavské%20náměstí"
   ```
3. Zkontrolovat output:
   - ✅ Vrací JSON pole návrhů?
   - ❌ Vrací chybu?
   - ❌ Timeout?

### Krok 5: Environment variables
1. Zkontrolovat `.env.local`:
   ```bash
   cat .env.local | grep -i "api_key\|places"
   ```
2. Ověřit, zda jsou nastaveny některé API klíče:
   - `NEXT_PUBLIC_VISIDOO_API_KEY`
   - `GOOGLE_PLACES_API_KEY` nebo `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`
   - `NEXT_PUBLIC_RUIAN_API_KEY`
3. Pokud chybí, získat API klíče:
   - **Visidoo**: https://www.visidoo.cz/ (registrace)
   - **Google Places**: https://console.cloud.google.com/ (vytvořit projekt + aktivovat Places API)

---

## 🔨 Možná řešení

### Řešení A: API klíče chybí
**Problém:** Všechny API endpointy vyžadují autentizaci.

**Řešení:**
1. Získat API klíč pro Google Places API (doporučeno):
   - https://console.cloud.google.com/
   - Vytvořit projekt
   - Aktivovat "Places API"
   - Vytvořit API klíč v "Credentials"
   - Omezit klíč na "Places API" (bezpečnost)
2. Přidat do `.env.local`:
   ```bash
   GOOGLE_PLACES_API_KEY=váš_google_places_api_klíč
   ```
3. Restartovat dev server: `npm run dev`

### Řešení B: Komponenta se nevykresluje
**Problém:** CSS třída nebo struktura DOM je chybná.

**Řešení:**
1. Zkontrolovat CSS pro `.detail-form__input`
2. Přidat debug styling přímo do komponenty:
   ```tsx
   <AddressAutocomplete
     {...props}
     style={{ border: '2px solid red' }} // Debug: červený border
   />
   ```
3. Zkontrolovat, zda se komponenta skutečně vykresluje v React DevTools

### Řešení C: Dropdown se neotevírá
**Problém:** `isOpen` state se nenastavuje na `true` i když existují suggestions.

**Řešení:**
1. Přidat console.log do `AddressAutocomplete.tsx`:
   ```typescript
   console.log('Suggestions:', suggestions.length, 'isOpen:', isOpen)
   ```
2. Zkontrolovat, zda se `isOpen` mění na `true` po obdržení výsledků
3. Zkontrolovat CSS pro dropdown (možná je skrytý kvůli z-index nebo overflow)

### Řešení D: API route vrací prázdné pole
**Problém:** Transformace dat z API selhává nebo žádný endpoint nefunguje.

**Řešení:**
1. Přidat více console.log do `app/api/address-search/route.ts`:
   ```typescript
   console.log('Trying endpoint:', endpoint.name)
   console.log('Response status:', response.status)
   console.log('Response data:', data)
   ```
2. Zkontrolovat, zda některý endpoint vrací data
3. Pokud ne, zkusit jiný endpoint nebo získat API klíč

### Řešení E: Binding nefunguje
**Problém:** `onAddressChange` nevolá `update()` nebo `update()` nefunguje.

**Řešení:**
1. Přidat console.log do `onAddressChange`:
   ```tsx
   onAddressChange={(address) => {
     console.log('Address changed:', address)
     update({
       street: address.street,
       city: address.city,
       zip: address.zip,
       houseNumber: address.houseNumber,
       country: address.country,
     })
   }}
   ```
2. Zkontrolovat, zda se log zobrazuje po kliknutí na návrh
3. Zkontrolovat, zda se formulářová pole aktualizují

---

## 📚 Dokumentace

### Relevantní soubory
- [AddressAutocomplete.tsx](app/UI/AddressAutocomplete.tsx)
- [address-search/route.ts](app/api/address-search/route.ts)
- [LandlordDetailForm.tsx](app/modules/030-pronajimatel/forms/LandlordDetailForm.tsx)
- [MyAccountDetailForm.tsx](app/modules/020-muj-ucet/forms/MyAccountDetailForm.tsx)
- [ADDRESS-AUTOCOMPLETE-SETUP.md](docs/ADDRESS-AUTOCOMPLETE-SETUP.md)

### Externí zdroje
- **Google Places API**: https://developers.google.com/maps/documentation/places/web-service/autocomplete
- **Visidoo API**: https://www.visidoo.cz/docs/autocomplete
- **RÚIAN**: https://ruian.cuzk.cz/

---

## ✅ Checklist pro opravu

- [ ] Zkontrolovat, zda se komponenta vykresluje (vizuálně)
- [ ] Zkontrolovat console (chyby, varování)
- [ ] Zkontrolovat Network tab (XHR/Fetch requesty)
- [ ] Otestovat API route přímo (curl nebo browser)
- [ ] Zkontrolovat `.env.local` (API klíče)
- [ ] Přidat debug console.log do komponenty
- [ ] Přidat debug console.log do API route
- [ ] Zkontrolovat binding v LandlordDetailForm
- [ ] Zkontrolovat binding v MyAccountDetailForm
- [ ] Otestovat flow: psaní → vyhledávání → výběr → update formuláře

---

## 🎯 Očekávaný výsledek po opravě

1. ✅ AddressAutocomplete se vykresluje v obou formulářích
2. ✅ Po napsání 3+ znaků se zobrazí dropdown s návrhy adres
3. ✅ Po kliknutí na návrh se formulářová pole automaticky vyplní
4. ✅ Adresy jsou ve formátu: "Ulice, číslo, město, PSČ"
5. ✅ Konzole neobsahuje chyby
6. ✅ API route vrací validní JSON s návrhy

---

## 📝 Poznámky pro další práci

- Pokud API klíče nejsou dostupné, zvážit fallback na manuální zadávání
- Možná přidat loading indikátor během vyhledávání
- Možná přidat "Žádné výsledky" hlášku když API nic nenajde
- Zvážit caching výsledků pro stejné dotazy
- Možná přidat podporu pro jiné země (ne jen CZ)
