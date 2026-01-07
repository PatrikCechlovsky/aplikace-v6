# aplikace-v6/docs/00-core/STRUKTURA-APLIKACE.md
# STRUKTURA APLIKACE – přehled modulů a komponent

## Účel dokumentu
Tento dokument poskytuje jednoduchý přehled struktury aplikace pro správu pronajímatelů.  
Ukazuje, jaké moduly existují, jaké komponenty se opakovaně používají, a jak to všechno dohromady funguje.

---

# 1. HLAVNÍ MODULY APLIKACE

Aplikace je rozdělena do modulů podle funkcí:

## 1.1 Aktivní moduly (mají konfiguraci)

| Číslo | Název | Co spravuje | Stav |
|-------|-------|-------------|------|
| **010** | Správa uživatelů | Uživatelé, role, pozvánky | ✅ Hotovo |
| **020** | Můj účet | Profil uživatele | 📝 Plán |
| **030** | Pronajímatelé | Subjekty pronajímatelů | 📝 Plán |
| **040** | Nemovitosti | Budovy, domy | 📝 Plán |
| **050** | Nájemníci | Nájemníci (subjekty) | 📝 Plán |
| **060** | Smlouvy | Nájemní smlouvy | 📝 Plán |
| **070** | Služby | Služby (voda, elektřina...) | 📝 Plán |
| **080** | Platby | Platby nájemného | 📝 Plán |
| **090** | Finance | Finanční přehledy | 📝 Plán |
| **100** | Energie | Měřidla, spotřeba | 📝 Plán |
| **120** | Dokumenty | PDF, přílohy | 📝 Plán |
| **130** | Komunikace | E-maily, zprávy | 📝 Plán |
| **900** | Nastavení | Číselníky, UI nastavení | ✅ Částečně |

## 1.2 Struktura každého modulu

Každý modul má stejnou strukturu:

```
app/modules/XXX-nazev-modulu/
  ├── module.config.js      ← Konfigurace modulu (název, ikona, pořadí)
  ├── tiles/                ← Přehledové "dlaždice" (seznamy, přehledy)
  │   └── NazevTile.tsx
  ├── forms/                ← Formuláře pro detail entity
  │   └── NazevDetailFrame.tsx
  └── MODULE-PLAN.md        ← Plán a checklist modulu
```

**Příklad:** Modul 010 (Správa uživatelů) má:
- `tiles/UsersTile.tsx` - seznam uživatelů
- `tiles/InviteUserTile.tsx` - pozvánka uživatele
- `forms/UserDetailFrame.tsx` - detail uživatele
- `forms/InviteUserFrame.tsx` - formulář pozvánky

---

# 2. SDÍLENÉ KOMPONENTY (opakovaně použitelné)

Tyto komponenty se používají ve všech modulech:

## 2.1 Hlavní UI komponenty (`app/UI/`)

### 📋 ListView
**Co dělá:** Zobrazuje seznam v tabulce (řádky, sloupce, filtry, řazení)  
**Kde se používá:** V každém modulu, který má seznam entit  
**Příklad:** Seznam uživatelů, seznam nemovitostí, seznam smluv

**Funkce:**
- Tabulka se sloupci
- Textový filtr
- Zaškrtávátko "Zobrazit archivované"
- Řazení podle sloupců
- Výběr řádků

### 📄 EntityDetailFrame
**Co dělá:** Zobrazuje detail entity (karta s nadpisem a obsahem)  
**Kde se používá:** V každém modulu pro zobrazení detailu  
**Příklad:** Detail uživatele, detail nemovitosti, detail smlouvy

**Funkce:**
- Nadpis a podtitulek
- Hlavní obsah (formulář)
- Pravý panel (přílohy, systémové info)

### 📑 DetailView
**Co dělá:** Detail s záložkami (tabs) - Základní údaje, Vazby, Přílohy, Historie, Systém  
**Kde se používá:** V modulech s komplexními detaily  
**Příklad:** Detail uživatele má záložky: Základní, Role, Přílohy, Historie

### 🔗 RelationListWithDetail
**Co dělá:** Seznam + detail vazby (např. Nemovitost → Jednotky)  
**Kde se používá:** Když modul má vazby na jiné entity  
**Příklad:** Nemovitost má seznam jednotek, Jednotka má detail nájemníka

### 🎛️ CommonActions
**Co dělá:** Tlačítka akcí (Nový, Upravit, Smazat, Archivovat, Přílohy...)  
**Kde se používá:** V každém modulu nad seznamem nebo detailem  
**Funkce:**
- Dynamické tlačítka podle kontextu
- Aktivní/neaktivní podle stavu
- Společné pro všechny moduly

### 🏠 HomeButton, Sidebar, Breadcrumbs
**Co dělá:** Navigace a layout aplikace  
**Kde se používá:** Globálně v celé aplikaci

### 📎 AttachmentsManagerFrame
**Co dělá:** Správa příloh (nahrávání, zobrazení, archivace)  
**Kde se používá:** V modulech, které mají přílohy  
**Příklad:** Uživatelé, Nemovitosti, Smlouvy

### 🎨 GenericTypeTile
**Co dělá:** Správa číselníků (typy, kategorie)  
**Kde se používá:** V modulu 900 (Nastavení)  
**Příklad:** Typy nemovitostí, Typy služeb, Role

---

## 2.2 Sdílené služby (`app/lib/services/`)

Tyto služby obsahují logiku pro práci s daty:

| Soubor | Co dělá | Kde se používá |
|--------|---------|----------------|
| `auth.ts` | Přihlášení, odhlášení, session | Globálně |
| `users.ts` | Načítání uživatelů, role | Modul 010 |
| `invites.ts` | Pozvánky uživatelů | Modul 010 |
| `permissions.ts` | Oprávnění uživatelů | Modul 010 |
| `viewPrefs.ts` | Uživatelské preference (sloupce, řazení) | Všechny moduly se seznamy |

---

# 3. JAK TO FUNGUJE DOHROMADY

## 3.1 Příklad: Modul "Nemovitosti" (040)

Když uživatel otevře modul Nemovitosti:

1. **Sidebar** zobrazí modul "Nemovitosti" (ikona, název)
2. **Klik na modul** → otevře se `tiles/PropertiesTile.tsx`
3. **PropertiesTile** používá:
   - `ListView` → zobrazí seznam nemovitostí
   - `CommonActions` → tlačítka "Nový", "Upravit", "Smazat"
4. **Klik na nemovitost** → otevře se detail
5. **Detail** používá:
   - `EntityDetailFrame` → hlavní karta
   - `DetailView` → záložky (Základní, Jednotky, Přílohy...)
   - `AttachmentsManagerFrame` → správa příloh

## 3.2 Co se opakuje v každém modulu

✅ **Stejné komponenty:**
- ListView pro seznamy
- EntityDetailFrame pro detaily
- CommonActions pro akce
- DetailView pro záložky

✅ **Stejná struktura:**
- `module.config.js` - konfigurace
- `tiles/` - přehledy
- `forms/` - formuláře

✅ **Stejný workflow:**
- Seznam → Detail → Formulář → Uložení

## 3.3 Co je specifické pro každý modul

🔹 **Různé entity:**
- Modul 010 → uživatelé
- Modul 040 → nemovitosti
- Modul 060 → smlouvy

🔹 **Různé sloupce v seznamu:**
- Uživatelé: Jméno, E-mail, Role
- Nemovitosti: Název, Adresa, Typ
- Smlouvy: Číslo, Nájemník, Datum

🔹 **Různé pole ve formuláři:**
- Každá entita má jiná pole

---

# 4. VÝHODY TÉTO STRUKTURY

## 4.1 Opakované použití komponent

✅ **Jednou naprogramováno, použito všude:**
- ListView se používá ve všech modulech se seznamy
- EntityDetailFrame se používá ve všech modulech s detaily
- CommonActions se používá všude stejně

✅ **Konzistentní chování:**
- Všechny seznamy fungují stejně
- Všechny detaily vypadají stejně
- Všechny akce se chovají stejně

## 4.2 Snadné přidávání nových modulů

Když chceš přidat nový modul (např. "Opravy"):

1. Vytvoříš složku `app/modules/110-opravy/`
2. Přidáš `module.config.js` s konfigurací
3. Vytvoříš `tiles/RepairsTile.tsx` → použiješ `ListView`
4. Vytvoříš `forms/RepairDetailFrame.tsx` → použiješ `EntityDetailFrame`
5. Hotovo! Modul funguje stejně jako ostatní

## 4.3 Jednoduchá údržba

✅ **Změna v jednom místě:**
- Upravíš `ListView` → změna se projeví ve všech modulech
- Upravíš `CommonActions` → změna se projeví všude

✅ **Konzistentní UI:**
- Všechny moduly vypadají stejně
- Uživatel se rychle zorientuje

---

# 5. SHRNUTÍ

## Co máš:

✅ **13 modulů** (010-130, 900)  
✅ **Sdílené komponenty** (ListView, EntityDetailFrame, DetailView...)  
✅ **Sdílené služby** (auth, users, viewPrefs...)  
✅ **Jednotná struktura** pro všechny moduly

## Co se opakuje:

🔄 **ListView** - ve všech modulech se seznamy  
🔄 **EntityDetailFrame** - ve všech modulech s detaily  
🔄 **CommonActions** - ve všech modulech  
🔄 **DetailView** - v modulech s komplexními detaily  
🔄 **AttachmentsManagerFrame** - v modulech s přílohami

## Co je specifické:

🔹 **Data** - každý modul má jiné entity  
🔹 **Sloupce** - každý seznam má jiné sloupce  
🔹 **Pole formuláře** - každý formulář má jiná pole  
🔹 **Vazby** - každý modul má jiné vazby na jiné entity

---

# 6. DALŠÍ KROKY

Pokud chceš:
- **Přidat nový modul** → použij šablonu z `docs/00-core/POSTUP.md`
- **Upravit existující modul** → respektuj strukturu a použij sdílené komponenty
- **Přidat novou funkci** → zvaž, jestli to nemá být sdílená komponenta

---

# 7. HISTORICKÉ ČÁSTI

*(Zatím prázdné, připravené pro budoucí úpravy)*


