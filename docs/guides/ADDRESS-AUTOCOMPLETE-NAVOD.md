# 🎯 JAK POUŽÍVAT ADDRESSAUTOCOMPLETE - JEDNODUCHÝ NÁVOD

## ❓ Problém: "Nejde to, píšu do špatného pole?"

**ODPOVĚĎ:** Ne, píšeš správně! Ale jsou tam **DVĚ různá pole pro adresu**:

---

## 📍 Struktura formuláře - CO VIDÍŠ:

### SEKCE 1: **"Adresa (autocomplete)"** 
```
┌─────────────────────────────────────────────┐
│ Adresa (autocomplete)                       │ ← NADPIS SEKCE
├─────────────────────────────────────────────┤
│ Adresa (autocomplete)                       │ ← LABEL
│ ┌─────────────────────────────────────────┐ │
│ │ Začněte psát adresu...                  │ │ ← DO TOHOTO POLE PÍŠEŠ
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```
**👆 DO TOHOTO pole píšeš "Praha" nebo "Brno" nebo "Václav"**

Když napíšeš minimálně **3 znaky**, objeví se dropdown seznam s návrhy:
```
┌─────────────────────────────────────────────┐
│ Pra█                                        │ ← Píšeš zde
├─────────────────────────────────────────────┤
│ ⚠️ Testovací data - Nakonfigurujte API...   │ ← Žlutý warning (normální)
├─────────────────────────────────────────────┤
│ ▶ Václavské náměstí 1, Praha 1, 11000      │ ← Klikni na některou
│ ▶ Václavské náměstí 28, Praha 1, 11000     │
│ ▶ Václavské náměstí 56, Praha 1, 11000     │
│ ▶ Karlovo náměstí 13, Praha 2, 12000       │
│ ▶ Náměstí Míru 1, Praha 2, 12000           │
└─────────────────────────────────────────────┘
```

**Po kliknutí na nějakou adresu** → automaticky se vyplní normální pole níže! ✨

---

### SEKCE 2: **Normální pole (pod autocomplete)**
```
┌─────────────────────────────────────────────┐
│ Ulice *                   │ Číslo popisné * │
│ ┌───────────────────────┐ │ ┌─────────────┐ │
│ │ Václavské náměstí     │ │ │ 1           │ │ ← AUTOMATICKY vyplněno
│ └───────────────────────┘ │ └─────────────┘ │
├─────────────────────────────────────────────┤
│ Město / Obec *            │ PSČ *           │
│ ┌───────────────────────┐ │ ┌─────────────┐ │
│ │ Praha 1               │ │ │ 11000       │ │ ← AUTOMATICKY vyplněno
│ └───────────────────────┘ │ └─────────────┘ │
└─────────────────────────────────────────────┘
```

**👇 DO TĚCHTO polí NEMUSÍŠ psát** - vyplní se automaticky po výběru z autocomplete!

(Ale můžeš je upravit ručně, pokud chceš.)

---

## ✅ JAK TO FUNGUJE - KROK ZA KROKEM:

### Krok 1: Spusť server
```bash
npm run dev
```

### Krok 2: Otevři aplikaci
```
http://localhost:3000
```

### Krok 3: Přihlas se
- Email + heslo

### Krok 4: Přejdi na Pronajimatele
- Boční menu → **Pronajímatelé**
- Klikni na nějakého pronajimatele → **Detail**
- Vpravo nahoře → **Editovat** (ikona tužky)

### Krok 5: Najdi sekci "Adresa (autocomplete)"
- Scrolluj dolů ve formuláři
- Najdeš nadpis **"Adresa (autocomplete)"**
- Pod ním je velké input pole s placeholderem: *"Začněte psát adresu..."*

### Krok 6: Začni psát
```
Napíš: Praha
```
**Co se stane:**
- Po 0.5 sekundě se objeví "Načítám..."
- Za chvíli se otevře dropdown s návrhy
- Vidíš žlutý banner: "⚠️ Testovací data..."  ← To je OK! Mock data fungují.

### Krok 7: Vyber adresu
- Klikni na nějakou adresu z dropdownu
- Např.: **"Václavské náměstí 1, Praha 1, 11000"**

### Krok 8: Zkontroluj, že se vyplnila pole
- Scrolluj trochu dolů
- Pole **Ulice**, **Číslo popisné**, **Město**, **PSČ** by měla být automaticky vyplněná! ✨

---

## 🐛 TROUBLESHOOTING

### "Nevidím žádný dropdown!"
**Možné důvody:**
1. **Napsal jsi méně než 3 znaky** → Zkus napsat "Pra" nebo "Praha"
2. **Server neběží** → Zkontroluj terminál: `npm run dev`
3. **Čekáš na dropdown?** → Počkej 0.5 sekundy (debounce)

### "Vidím jen 'Načítám...' a pak nic"
**Možné důvody:**
1. **API endpoint nefunguje** → Zkontroluj konzoli prohlížeče (F12)
2. **Server error** → Zkontroluj terminál s `npm run dev`

### "Dropdown se nezobrazuje vůbec"
**Debug kroky:**
1. Otevři DevTools (F12)
2. Zakládka **Console**
3. Napiš do autocomplete pole "Praha"
4. Sleduj konzoli:
   ```
   🔍 Loading suggestions for query: Praha
   ✅ Received 3 suggestions (mock data)
   ```
5. Pokud vidíš chyby (červené), pošli mi screenshot

### "Dropdown se otevře, ale nic tam není"
**Mock data nenalezena** → Zkus jiný dotaz:
- "Praha" → funguje
- "Brno" → funguje
- "Ostrava" → funguje
- "Plzeň" → funguje
- "Václav" → funguje
- "xyz123" → nenajde nic (mock data to neobsahují)

---

## 🎬 VIDEO TUTORIAL (Slovní popis)

```
00:00 - Spustím npm run dev
00:05 - Otevřu http://localhost:3000
00:10 - Přihlásím se
00:15 - Kliknu na "Pronajímatelé" v menu
00:20 - Kliknu na prvního pronajimatele
00:25 - Kliknu na "Editovat" (ikona tužky)
00:30 - Scrolluju dolů k sekci "Adresa (autocomplete)"
00:35 - Vidím velké input pole s placeholderem
00:40 - Kliknu do pole
00:42 - Píšu "P" → nic se neděje (méně než 3 znaky)
00:44 - Píšu "Pr" → nic se neděje (stále méně než 3)
00:46 - Píšu "Pra" → vidím "Načítám..."
00:48 - Objeví se dropdown s 5 adresami z Prahy
00:50 - Vidím žlutý banner: "⚠️ Testovací data..."
00:52 - Kliknu na "Václavské náměstí 1, Praha 1, 11000"
00:54 - Dropdown se zavře
00:56 - Scrolluju dolů
00:58 - Vidím vyplněná pole:
        - Ulice: "Václavské náměstí"
        - Číslo: "1"
        - Město: "Praha 1"
        - PSČ: "11000"
01:00 - Hotovo! ✅
```

---

## 📸 CO MÁŠ VIDĚT (slovní popis screenshotů)

### Screenshot 1: Autocomplete pole (PRÁZDNÉ)
```
┌─────────────────────────────────────────────┐
│ Adresa (autocomplete)                       │
│ ┌─────────────────────────────────────────┐ │
│ │ Začněte psát adresu...            [✕]  │ │ ← Prázdné pole s placeholderem
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Screenshot 2: Píšu "Praha" → Loading
```
┌─────────────────────────────────────────────┐
│ Adresa (autocomplete)                       │
│ ┌─────────────────────────────────────────┐ │
│ │ Praha                       Načítám... │ │ ← Vidím "Načítám..."
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Screenshot 3: Dropdown s návrhy
```
┌─────────────────────────────────────────────┐
│ Adresa (autocomplete)                       │
│ ┌─────────────────────────────────────────┐ │
│ │ Praha                              [✕] │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ ⚠️ Testovací data - Nakonfigurujte Google   │ ← Žlutý warning
│    Places API pro skutečné adresy           │
├─────────────────────────────────────────────┤
│ 🔵 Václavské náměstí 1, Praha 1, 11000     │ ← Hover efekt (tmavší)
│    Václavské náměstí 28, Praha 1, 11000    │
│    Václavské náměstí 56, Praha 1, 11000    │
│    Karlovo náměstí 13, Praha 2, 12000      │
│    Náměstí Míru 1, Praha 2, 12000          │
└─────────────────────────────────────────────┘
```

### Screenshot 4: Po výběru - vyplněná pole
```
┌─────────────────────────────────────────────┐
│ Adresa (autocomplete)                       │
│ ┌─────────────────────────────────────────┐ │
│ │ Václavské náměstí 1, Praha 1, 11000   │ │ ← Celá adresa
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

┌──────────────────────────┬──────────────────┐
│ Ulice *                  │ Číslo popisné *  │
│ ┌──────────────────────┐ │ ┌──────────────┐ │
│ │ Václavské náměstí    │ │ │ 1            │ │ ← Automaticky vyplněno!
│ └──────────────────────┘ │ └──────────────┘ │
├──────────────────────────┴──────────────────┤
│ Město / Obec *            │ PSČ *           │
│ ┌──────────────────────┐ │ ┌──────────────┐ │
│ │ Praha 1              │ │ │ 11000        │ │ ← Automaticky vyplněno!
│ └──────────────────────┘ │ └──────────────┘ │
└─────────────────────────────────────────────┘
```

---

## 🔍 KONZOLE PROHLÍŽEČE (F12)

Pokud to stále nefunguje, otevři **Developer Tools** (F12) a sleduj **Console** tab:

### Očekávaný output:
```javascript
🔍 Searching RÚIAN addresses for: Praha
✅ API response: [Array(5)]
Data type: array
Results count: 5
ℹ️ Using mock data: Using mock data - configure Google Places API key...
🔍 Loading suggestions for query: Praha
✅ Received 5 suggestions (mock data)
```

### Pokud vidíš chyby:
```javascript
❌ API route returned: 404
❌ Error fetching RÚIAN addresses: Failed to fetch
```
→ Pošli mi screenshot konzole!

---

## 💡 ZKRATKA - RYCHLÝ TEST

```bash
# 1. Spusť server
npm run dev

# 2. V druhém terminálu otestuj API přímo:
curl "http://localhost:3000/api/address-search?q=Praha"

# Měl bys vidět JSON s adresami:
[
  {
    "street": "Václavské náměstí",
    "city": "Praha 1",
    "zip": "11000",
    "houseNumber": "1",
    "ruianId": "mock-0",
    "fullAddress": "Václavské náměstí 1, Praha 1, 11000"
  },
  ...
]
```

Pokud vidíš tento JSON output → API funguje! → Problém je ve frontendu (komponenta).

---

## 📞 JEŠTĚ NĚCO NEFUNGUJE?

**Pošli mi:**
1. Screenshot formuláře (kde píšeš)
2. Screenshot konzole (F12 → Console tab)
3. Text, který jsi napsal do pole
4. Co se stalo (nebo nestalo)

**A já to opravím!** 🔧
