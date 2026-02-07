# 🔧 AddressAutocomplete - Oprava a nastavení

## ✅ Co bylo opraveno

### 1. **Zjednodušení logiky komponenty**
- Odstraněn problematický `buildQuery()` fallback v input value
- Query state se nyní inicializuje správně z aktuální adresy
- Odstraněna zbytečná `handleInputFocus` logika

### 2. **Mock data pro development**
- Když není dostupný Google Places API klíč, používají se testovací data
- Mock data obsahují realistické české adresy (Praha, Brno, Ostrava, Plzeň, Olomouc)
- Vizuální indikátor upozorní uživatele na mock mode

### 3. **Oprava API route**
- Preferování server-side API klíčů (bez `NEXT_PUBLIC_` prefixu)
- Lepší error handling a logging
- Priorita: Google Places > Visidoo > ostatní RÚIAN API

### 4. **Oprava .env.local**
- Odstraněn neplatný Google Places API klíč
- Přidány komentáře s odkazy na registraci
- Očištěná struktura

## 🚀 Jak použít

### Option A: Použít mock data (development)
Komponenta funguje okamžitě s testovacími daty. Stačí ji použít ve formuláři:

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
  placeholder="Začněte psát adresu..."
  disabled={readOnly}
/>
```

### Option B: Nakonfigurovat Google Places API (production)

**Krok 1: Získat API klíč**
1. Přejít na https://console.cloud.google.com/
2. Vytvořit nový projekt (nebo vybrat existující)
3. Aktivovat "Places API" (nebo "Places API (New)")
4. V sekci "Credentials" vytvořit API klíč
5. Omezit klíč na "Places API" (bezpečnost)

**Krok 2: Přidat do .env.local**
```bash
# V souboru .env.local
GOOGLE_PLACES_API_KEY=váš_skutečný_api_klíč_zde
```

**Krok 3: Restartovat server**
```bash
npm run dev
```

**Cena Google Places API:**
- První 100 USD kreditu měsíčně ZDARMA (cca 28 000 requestů)
- Pak $17 za 1000 requestů (pro autocomplete)
- Více info: https://developers.google.com/maps/billing/gmp-billing

### Option C: Nakonfigurovat Visidoo API (česká alternativa)

**Krok 1: Registrace**
1. https://www.visidoo.cz/
2. Zaregistrovat se a získat API klíč

**Krok 2: Přidat do .env.local**
```bash
VISIDOO_API_KEY=váš_visidoo_api_klíč
```

**Krok 3: Restartovat server**
```bash
npm run dev
```

## 📊 Mock data

Když žádné API není nakonfigurované, komponenta vrací tyto testovací adresy:

- **Praha:** Václavské náměstí 1, 28, 56; Karlovo náměstí 13; Náměstí Míru 1; Hlavní 123
- **Brno:** Masarykova 1; Palackého 44
- **Ostrava:** Krátká 5
- **Plzeň:** Dlouhá 10
- **Olomouc:** Nová 8

Mock data se filtrují podle zadaného dotazu (case-insensitive).

## 🔍 Debugging

### Konzole prohlížeče
Komponenta loguje do konzole:
```
🔍 Loading suggestions for query: Praha
✅ Received 3 suggestions (mock data)
ℹ️ Using mock data: Using mock data - configure Google Places API key...
```

### Network tab
- Request: `GET /api/address-search?q=Praha`
- Response headers:
  - `X-Debug-Mode: mock` (pokud používáte mock data)
  - `X-Debug-Message: ...` (info zpráva)

### Vizuální indikátory
- **Mock mode warning:** Žlutý banner nad výsledky: "⚠️ Testovací data - Nakonfigurujte Google Places API..."
- **Žádné výsledky:** "Mock data nenalezena. Vyplňte adresu ručně níže."

## 📝 Technické detaily

### Komponenta: AddressAutocomplete.tsx
- **Props:** street, city, zip, houseNumber, country, onAddressChange, disabled, placeholder
- **State:** query, suggestions, isOpen, loading, isMockMode
- **Debounce:** 500ms před vyhledáváním
- **Minimum:** 3 znaky pro spuštění vyhledávání
- **Pouze pro:** country === 'CZ'

### API Route: /api/address-search/route.ts
- **Method:** GET
- **Query param:** q (search query)
- **Response:** JSON pole objektů { street, city, zip, houseNumber, ruianId, fullAddress }
- **Headers:** X-Debug-Mode, X-Debug-Message, X-Debug-Errors

### Environment variables
```bash
# Server-side klíče (doporučeno)
GOOGLE_PLACES_API_KEY=...
VISIDOO_API_KEY=...
RUIAN_API_KEY=...

# Fallback (funguje, ale méně bezpečné)
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=...
NEXT_PUBLIC_VISIDOO_API_KEY=...
NEXT_PUBLIC_RUIAN_API_KEY=...
```

## ✅ Hotovo!

AddressAutocomplete nyní funguje v obou režimech:
1. **Mock mode** - okamžitě funkční s testovacími daty
2. **Production mode** - s Google Places API nebo Visidoo API pro skutečné adresy

Komponenta automaticky detekuje dostupné API klíče a přepíná mezi režimy.
