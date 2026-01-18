# 📍 Nastavení autocomplete pro adresy

Tento dokument popisuje, jak nastavit autocomplete pro české adresy v aplikaci.

## 🎯 Doporučené API služby

### 1. **Visidoo API** (Doporučeno pro české adresy) ⭐

**Výhody:**
- Specializované na české adresy (RÚIAN)
- Přesná data přímo z RÚIAN
- Podporuje PSČ, číslo popisné, a další detaily
- Čeština je primární jazyk

**Registrace:**
1. Navštivte: https://www.visidoo.cz/
2. Zaregistrujte se a požádejte o API klíč
3. Dokumentace: https://www.visidoo.cz/docs/autocomplete

**Nastavení:**
Přidejte do `.env.local`:
```bash
NEXT_PUBLIC_VISIDOO_API_KEY=váš_visidoo_api_klíč
```

**Cena:** Kontaktujte Visidoo pro ceník

---

### 2. **Google Places API** (Spolehlivé, univerzální) ⭐

**Výhody:**
- Velmi spolehlivé a rychlé
- Široké pokrytí (včetně českých adres)
- Dobrá dokumentace
- Dostupné free tier (100 USD kredit měsíčně)

**Registrace:**
1. Vytvořte projekt v Google Cloud Console: https://console.cloud.google.com/
2. Aktivujte "Places API" (nový) nebo "Places API (Legacy)"
3. Vytvořte API klíč v sekci "Credentials"
4. Omezte klíč na "Places API" (bezpečnost)
5. Dokumentace: https://developers.google.com/maps/documentation/places/web-service/autocomplete

**Nastavení:**
Přidejte do `.env.local` (doporučeno bez `NEXT_PUBLIC_` prefixu, protože se používá pouze na serveru):
```bash
GOOGLE_PLACES_API_KEY=váš_google_places_api_klíč
```

**Poznámka:** Pokud máte klíč již nastavený jako `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`, bude fungovat i nadále (fallback).

**Cena:** 
- 100 USD kredit měsíčně (zdarma)
- Autocomplete: $17 per 1000 requests (po vyčerpání free tieru)
- Ceník: https://mapsplatform.google.com/pricing/

**⚠️ Poznámka:** Google Places Autocomplete vrací pouze popis adresy. Pro získání detailních údajů (PSČ, číslo popisné) by bylo potřeba další request na Places Details API.

---

## 🔧 Konfigurace

Aplikace podporuje obě API služby současně. Priorita:

1. **Visidoo API** (pokud je nastaven `NEXT_PUBLIC_VISIDOO_API_KEY`)
2. **Google Places API** (pokud je nastaven `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`)
3. Ostatní RÚIAN endpointy (fallback - pravděpodobně nefungují)

### Nastavení environment variables

1. Vytvořte nebo upravte `.env.local` v root složce projektu:
```bash
# Visidoo API (doporučeno pro české adresy)
NEXT_PUBLIC_VISIDOO_API_KEY=váš_visidoo_klíč

# NEBO Google Places API (spolehlivé, univerzální)
# Použijte bez NEXT_PUBLIC_ prefixu (server-side proměnná):
GOOGLE_PLACES_API_KEY=váš_google_places_klíč
# (Fallback: NEXT_PUBLIC_GOOGLE_PLACES_API_KEY také funguje)
```

2. Na Vercelu přidejte environment variables:
   - Jděte do projektu → Settings → Environment Variables
   - Přidejte `GOOGLE_PLACES_API_KEY` (nebo `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`)
   - Nastavte pro "Production", "Preview", a "Development"

3. Redeploy aplikace (nebo počkejte na automatický deploy)

**⚠️ Důležité pro Google Places API:**
- Musíte aktivovat **"Places API"** v Google Cloud Console (nebo "Places API (Legacy)")
- V sekci "Credentials" → "API restrictions" omezte klíč pouze na "Places API" (bezpečnost)
- V sekci "Application restrictions" můžete nastavit IP adresy nebo HTTP referrery (volitelné)

---

## ✅ Ověření funkčnosti

Po nastavení API klíče:

1. Otevřete "Můj účet" → záložka "Detail"
2. Klikněte na pole "Adresa (autocomplete)"
3. Začněte psát alespoň 3 znaky (např. "Praha" nebo "Pivovarská")
4. Měly by se zobrazit návrhy adres

---

## 🔍 Řešení problémů

### Autocomplete nefunguje

1. **Zkontrolujte konzoli prohlížeče (F12):**
   - Měly by se zobrazit debug logy
   - Podívejte se na chyby v konzoli

2. **Zkontrolujte environment variables:**
   - Je API klíč správně nastaven v `.env.local`?
   - Je API klíč správně nastaven na Vercelu?
   - Byla aplikace redeployována po přidání klíče?

3. **Zkontrolujte API klíč:**
   - Je API klíč aktivní a platný?
   - Máte dostatečný kredit/quota?
   - **Pro Google Places API:**
     - Je aktivní "Places API" v Google Cloud Console? (APIs & Services → Enabled APIs)
     - Má klíč správně nastavená omezení? (Credentials → Edit → API restrictions → vyberte "Places API")
     - Pokud vidíte chybu "REQUEST_DENIED", zkontrolujte, že je Places API aktivní
     - Pokud vidíte chybu "INVALID_REQUEST", zkontrolujte formát klíče v `.env.local`

4. **Zkontrolujte server logy (Vercel):**
   - Podívejte se na logy API route `/api/address-search`
   - Měly by se zobrazit zkoušené endpointy a chyby

---

## 📚 Další zdroje

- **Visidoo API dokumentace:** https://www.visidoo.cz/docs/autocomplete
- **Google Places API dokumentace:** https://developers.google.com/maps/documentation/places/web-service/autocomplete
- **RÚIAN API (open-source):** https://github.com/jindrichskupa/ruian-api

---

## 💡 Tipy

- Pro produkci doporučujeme **Visidoo API** (specializované na české adresy)
- Pro testování můžete použít **Google Places API** (free tier)
- Obě API můžete mít nastavené současně - aplikace použije prioritu (Visidoo > Google Places)

