# 🏗️ STAV STRUKTURY — Pronajímatel v6
Kompletní přehled aktuální struktury projektu, včetně stavu implementace jednotlivých částí.
Tento dokument slouží jako mapa projektu pro vývoj, kontrolu a další plánování.

---

# 1. STRUKTURA REPozITÁŘE

```
app/
  UI/
    HomeButton.tsx
    Sidebar.tsx
    Breadcrumbs.tsx
    HomeActions.tsx
    CommonActions.tsx
    icons.ts
  modules/
    010-sprava-uzivatelu/
    020-muj-ucet/
    030-pronajimatel/
    ...
    900-nastaveni/
  lib/
    services/
      auth.ts
    supabaseClient.ts
    uiConfig.ts
  page.tsx
  globals.css

docs/
  README.md
  CODESTYLE.md
  UI-SPECIFIKACE.md
  PREHLED-APLIKACE.md
  stav-struktury.md
  todo_list.md
```

---

# 2. STAV JEDNOTLIVÝCH SLOŽEK

| Oblast | Stav | Poznámka |
|--------|------|----------|
| UI layout (6 sekcí) | ✔ Hotovo | Plně implementováno |
| HomeButton | ✔ Hotovo | Funguje + disabled |
| Sidebar | ✔ Hotovo | Dynamické moduly |
| Breadcrumbs | ✔ Základ | Nutná dynamika (v2) |
| HomeActions | ✔ Hotovo | DisplayName + ikony |
| CommonActions v1 | ✔ Hotovo | Pevná verze |
| CommonActions v2 | ⏳ Plán | Akce podle modulu/role |
| Content engine | ✔ Hotovo | Přehled/detail/form |
| Autentizace | ✔ Hotovo | Supabase + metadata |
| Role & oprávnění | ⏳ Plán | Napojení na moduly |
| Ikony | ✔ Hotovo | Centralizované |
| Form engine | ✔ Základ | Dirty state + validace v2 |
| Moduly | ⏳ Průběžně | Základní struktura |

---

# 3. STAV MODULŮ

## 3.1 Implementované moduly (kostra)
| Modul | Stav | Poznámka |
|-------|------|----------|
| 010 – Správa uživatelů | ✔ Kostra | Bude napojena na permissions |
| 020 – Můj účet | ✔ Kostra | Metadata uživatele |
| 030 – Pronajímatel | ✔ Kostra | Základní tile |
| 040 – Nemovitost | ✔ Kostra | Bude rozšířeno o vybavení |
| 050 – Nájemník | ✔ Kostra | Form + přehled |
| 060 – Smlouva | ⏳ Kostra | Nutné pole + vztahy |
| 070 – Služby | ⏳ Čeká | Budoucí modul |
| 080 – Platby | ⏳ Čeká | Napojení na finance |
| 090 – Finance | ⏳ Čeká | Rozšíření |
| 100 – Měřidla | ⏳ Čeká | Automatické odečty v2 |
| 110 – Dokumenty | ⏳ Kostra | Šablony + generování |
| 120 – Komunikace | ⏳ Čeká | Historie zpráv |
| 900 – Nastavení | ✔ Aktivní | Obsahuje číselníky |

---

# 4. UI REALIZOVANÉ KOMPONENTY

| Komponenta | Stav | Poznámka |
|------------|------|----------|
| HomeButton | ✔ | Dokončeno |
| Sidebar | ✔ | Dynamické moduly |
| Breadcrumbs | ✔ | Statická verze |
| HomeActions | ✔ | DisplayName + ikony |
| CommonActions | ✔ | Pevná verze |
| Tabulkový přehled | ⏳ | Zatím základ v modulech |
| Form komponenty | ⏳ | Jednotný systém v přípravě |
| Ikonový systém | ✔ | Centralizovaný |

---

# 5. LOGIKA A SLUŽBY

| Služba | Stav | Poznámka |
|--------|------|----------|
| Supabase Client | ✔ | Funkční |
| Auth service | ✔ | Session + metadata |
| Module Loader | ✔ | Dynamický sidebar |
| Permission Engine | ⏳ | V přípravě |
| Actions Engine | ⏳ | Vazba na moduly |

---

# 6. BUDOUCÍ STRUKTURA (PLÁN)

## 6.1 Backend logika (services)
- authService v2  
- permissionsService  
- commonActionsEngine  
- dynamicBreadcrumbsBuilder  
- formStateManager  

## 6.2 UI
- TableView komponenta  
- FormField komponenty (text, select, boolean, multiselect)  
- modal windows  
- toaster notifikace  

## 6.3 Moduly rozšíření
- Dokumenty → generování PDF  
- Komunikace → ukládání do historie  
- Služby → šablony služeb  
- Platby → QR kódy  

---

# 7. ZÁVĚR

Tento dokument ukazuje **aktuální stav implementace i plán vývoje**.  
Slouží jako kontrolní seznam i chronologický přehled celého systému.

Všechny změny v projektu musí být následně zaznamenány zde, aby dokumentace odpovídala reálnému stavu aplikace.
