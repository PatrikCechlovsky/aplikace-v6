# /docs/01-executive-summary.md
## Popis: Komplexní shrnutí projektu Pronajímatel v6 – účel aplikace, hodnoty, moduly, technologie, architektura, UI a stav vývoje.
---

# 01 – EXECUTIVE SUMMARY  
*(Finální, sjednocená a moderní verze)*

---

# 1. ÚČEL APLIKACE

Aplikace **Pronajímatel v6** je profesionální nástroj pro:

- správu nemovitostí  
- evidenci jednotek  
- práci s nájemníky  
- správu smluv  
- sledování plateb  
- správu služeb a vyúčtování  
- evidenci dokumentů  
- systémovou komunikaci  

Cílem je poskytnout **centralizovaný, moderní a bezpečný systém**, který zjednoduší práci majitelům, správcům i nájemníkům.

Aplikace je navržená jako:

- **modulární**  
- **škálovatelná**  
- **uživatelsky konzistentní (6-sekční layout)**  
- **bezpečná (Supabase Auth + RLS)**  
- **dlouhodobě rozšiřitelná**  

---

# 2. TECHNOLOGICKÝ ZÁKLAD

Aplikace je postavená na:

- **Next.js 14 (App Router)** – moderní, rychlá architektura
- **Supabase**:
  - autentizace
  - databáze
  - role-based security (RLS)
- **TypeScript** – přísná typová kontrola
- **Modulový systém** – každý funkční celek je samostatná část
- **UI architektura v 6 sekcích** – konzistentní uživatelské prostředí

---

# 3. HLAVNÍ MODULY SYSTÉMU

Aplikace obsahuje modulární architekturu, kde každý modul má svou konfiguraci:

- **010 – Správa uživatelů**  
- **020 – Můj účet**  
- **030 – Pronajímatelé**  
- **040 – Nemovitosti**  
- **050 – Nájemníci**  
- **060 – Smlouvy**  
- **070 – Služby**  
- **080 – Platby**  
- **090 – Finance**  
- **100 – Měřidla**  
- **110 – Dokumenty**  
- **900 – Nastavení**

Další moduly lze přidat jednoduchým vytvořením složky a konfigurace.

---

# 4. UŽIVATELSKÉ ROZHRANÍ – 6 SEKČNÍ LAYOUT

Aplikace používá jednotný UI layout:

```
┌───────────────────────────────────────────────┐
│ 1–2: Sidebar + HomeButton                     │
├───────────────────────────────────────────────┤
│ 3: Horní lišta (Breadcrumbs + HomeActions)    │
├───────────────────────────────────────────────┤
│ 4: CommonActions (akce modulu/formuláře)      │
├───────────────────────────────────────────────┤
│ 5: Obsah (přehledy, detaily, formuláře)       │
└───────────────────────────────────────────────┘
```

Tento systém zajišťuje:

- konzistenci celé aplikace  
- stejné chování v každém modulu  
- rychlou orientaci pro uživatele  

Do budoucna UI počítá se:

- modal windows  
- toaster notifikacemi  
- rozšířeným breadcrumb systémem  
- responzivním layoutem pro mobilní zařízení  

---

# 5. AUTENTIZACE A ROLE

Aplikace využívá:

- **Supabase Auth**
- email + heslo  
- metadata uživatele:
  - displayName
  - role
  - případná další oprávnění

Plánované rozšíření:

- přidání role-based access  
- granular permissions  
- omezení modulů podle typu uživatele  

---

# 6. ARCHITEKTURA SYSTÉMU – PŘEHLED

Architektura je rozdělena na:

### **UI vrstvu**
- layout
- komponenty
- formuláře
- přehledy

### **Modulovou vrstvu**
- každý modul má vlastní:
  - konfiguraci
  - dlaždice
  - formuláře
  - přehledy

### **Datovou vrstvu**
- Supabase databáze + RLS
- centralizované typy
- sdílené entity

### **Backend logiku (plán)**
- services:
  - auth service
  - permissions service
  - form state manager
  - breadcrumbs builder
  - common actions engine

Cílem je:

> Kód bude čistý, logicky oddělený a snadno rozšiřitelný.

---

# 7. AKTUÁLNÍ STAV APLIKACE

### 🔹 Hotové části:
- Sidebar  
- HomeButton  
- Breadcrumbs (základní verze)  
- HomeActions  
- CommonActions (verze 1)  
- Základní rendering obsahu  
- Modulový engine  

### 🔸 Rozpracované:
- dynamické CommonActions  
- dynamické Breadcrumbs  
- rozšíření modulů  
- role & permissions  
- komplexní form engine  

---

# 8. ROADMAPA (SHRNUTÍ)

### Krátkodobé:
- vázání akcí na moduly  
- dynamické breadcrumb cesty  
- RLS pravidla  
- stav formulářů (dirty, clean)  

### Střednědobé:
- modul Dokumenty  
- modul Komunikace  
- modul Služby  
- table view engine  
- modal windows  

### Dlouhodobé:
- notifikační centrum  
- automatická generace dokumentů  
- plná uživatelská komunikace  
- mobilní optimalizace  

---

# 9. ODKAZY NA OSTATNÍ DOKUMENTY

- **02 – Architecture:** hluboký technický popis  
- **03 – UI System:** detailní UI specifikace  
- **04 – Modules:** konfigurace a struktury modulů  
- **05 – Auth & RLS:** bezpečnost a přihlášení  
- **06 – Data Model:** entity a tabulky  
- **07 – Deployment:** hosting a build pipeline  
- **08 – Plán vývoje:** roadmapa  
- **09 – Pravidla projektu:** sjednocení kódu a dokumentace  
- **10 – Slovník pojmů:** vysvětlení termínů  

---

# 10. ZÁVĚR

Tento dokument poskytuje **kompletní přehled celého projektu**.  
Slouží:

- vývojářům  
- designérům  
- architektům  
- a tobě jako vlastníkovi projektu  

k rychlé orientaci v systému.

Aplikace Pronajímatel v6 je již nyní pevným základem profesionálního řešení, které lze dále rozšiřovat a škálovat.

---

_Konec BLOKU A – hlavní verze Executive Summary._
