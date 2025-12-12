# 🏗️ STAV STRUKTURY — Pronajímatel v6
Verze dokumentu: 2025-12-07  
Tento dokument popisuje reálný stav složek, komponent a modulů projektu „aplikace-v6“.

---

# 1. STRUKTURA REPOZITÁŘE

aplikace-v6/
    app/
    docs/
    scripts/
    .env.local
    .gitignore
    next.config.mjs
    package.json
    tsconfig.json
    README.md

---

# 1.1 Struktura `app/`

app/
    AppShell.tsx
    layout.tsx
    page.tsx
    globals.css

    UI/
        AppIcon.tsx
        Breadcrumbs.tsx
        CommonActions.tsx
        ConfigListWithForm.tsx
        DetailView.tsx
        EntityDetailFrame.tsx
        EntityList.tsx
        GenericTypeTile.tsx
        HomeActions.tsx
        HomeButton.tsx
        ListView.tsx
        LoginPanel.tsx
        MfaSetupPanel.tsx
        RelationListWithDetail.tsx
        Sidebar.tsx
        Tabs.tsx
        icons.ts
        supabase.js

    lib/
        colorPalette.ts
        supabaseClient.ts
        themeSettings.ts
        uiConfig.ts

        services/
            auth.ts

    modules.index.js

    modules/
        010-sprava-uzivatelu/
            module.config.js
            RolesConfigPanel.tsx

        020-muj-ucet/
            module.config.js

        030-pronajimatel/
            module.config.js

        040-nemovitost/
            module.config.js

        050-najemnik/
            module.config.js

        060-smlouva/
            module.config.js

        070-sluzby/
            module.config.js

        080-platby/
            module.config.js

        090-finance/
            module.config.js

        100-energie/
            module.config.js

        120-dokumenty/
            module.config.js

        130-komunikace/
            module.config.js

        900-nastaveni/
            module.config.js

            sections/
                IconSettingsSection.tsx
                ThemeSettingsSection.tsx
                TypesSettingsSection.tsx

            tiles/
                SubjectTypesTile.tsx
                ThemeSettingsTile.tsx

            services/
                subjectTypes.ts

---

# 1.2 Struktura `docs/`

docs/
    CODESTYLE.md
    PREHLED-APLIKACE.md
    UI-specifikace.md
    layout_auth_ui.md
    stav-struktury.md
    todo_list.md

---

# 2. STAV HLAVNÍCH OBLASTÍ

| Oblast | Stav | Poznámka |
|--------|------|----------|
| AppShell layout | ✔ Hotovo | 6-blokový layout |
| Autentizace | ✔ Hotovo | login, logout, session |
| MFA UI | ✔ UI | logika MFA později |
| Sidebar | ✔ Hotovo | dynamické moduly |
| Breadcrumbs | ⏳ Základ | v2 bude dynamická |
| HomeActions | ✔ | uživatel + logout |
| CommonActions | ✔ v1 | v2 podle rolí čeká |
| List/Detail/Tabs | ✔ Základ | připraveno pro moduly |
| GenericTypeTile | ✔ Aktivní | modul 900 |
| ConfigListWithForm | ✔ | konfigurace číselníků |
| Moduly 010–130 | ✔ Kostra | UI bude doplňováno |
| Modul 900 | ✔ Aktivní | typy, motivy, ikony |

---

# 3. UI KOMPONENTY

## 3.1 Navigace a layout
- AppShell.tsx  
- Sidebar.tsx  
- Breadcrumbs.tsx  
- HomeButton.tsx  
- HomeActions.tsx  
- CommonActions.tsx  
- Tabs.tsx  
- AppIcon.tsx  

## 3.2 Seznamy a detaily
- ListView.tsx  
- EntityList.tsx  
- DetailView.tsx  
- EntityDetailFrame.tsx  
- RelationListWithDetail.tsx  

## 3.3 Konfigurační a typové formuláře
- ConfigListWithForm.tsx  
- GenericTypeTile.tsx  

## 3.4 Autentizace UI
- LoginPanel.tsx  
- MfaSetupPanel.tsx  
- supabase.js  

---

# 4. MODULY — PŘEHLED

| Modul | Stav | Poznámka |
|-------|-------|----------|
| 010 Správa uživatelů | ✔ Kostra | RolesConfigPanel |
| 020 Můj účet | ✔ Kostra | metadata |
| 030 Pronajímatel | ✔ Kostra | základ |
| 040 Nemovitost | ✔ Kostra | budoucí rozšíření |
| 050 Nájemník | ✔ Kostra | formuláře čekají |
| 060 Smlouva | ✔ Kostra | vztahy později |
| 070 Služby | ✔ Kostra | vyúčtování |
| 080 Platby | ✔ Kostra | QR kódy později |
| 090 Finance | ✔ Kostra | cashflow |
| 100 Energie | ✔ Kostra | měřidla |
| 120 Dokumenty | ✔ Kostra | šablony |
| 130 Komunikace | ✔ Kostra | email/SMS historie |
| 900 Nastavení | ✔ Aktivní | typy, motivy, ikony |

---

# 5. SLUŽBY A KONFIGURACE

- supabaseClient.ts — centrální klient  
- auth.ts — login, logout, session  
- uiConfig.ts — globální UI nastavení  
- colorPalette.ts — barevná paleta aplikace  
- themeSettings.ts — správa témat  

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
- Modal okna  
- Toaster notifikace  

## 6.3 Moduly a funkce (rozšíření)
- Modul Dokumenty → generování PDF  
- Modul Komunikace → ukládání e-mailů a zpráv  
- Modul Služby → katalog + výpočty služeb  
- Modul Platby → generování QR kódů, párování plateb  
- Modul Energie → automatizované odečty  

---

# 7. ZÁVĚR

Tento dokument ukazuje:
- aktuální stav projektu  
- přehled struktur  
- přehled komponent  
- plán budoucího vývoje  

Slouží jako kontrolní seznam i chronologická mapa projektu.

Všechny změny v aplikaci musí být následně aktualizovány zde, aby dokumentace odpovídala skutečnému stavu systému.

---

## DOPLNĚNÍ (2025-12-12) – Mapa reality UI (layout, menu, theme, ikony)

### 1) Root layout – zdroj pravdy
- `app/AppShell.tsx`
  - skládá hlavní UI kostru (HomeButton, Menu, Breadcrumbs, HomeActions, CommonActions, Content)
  - aplikuje výsledné `className` na root `.layout` (theme / accent / icons / menu režim)
  - rozhoduje o režimu menu (Sidebar vs TopMenu) dle UI configu

- `app/layout.tsx` + `app/page.tsx`
  - Next.js vstupní vrstvy (routing + render root stránky)
  - UI kostru neřeší (to je úloha AppShell)

---

### 2) UI config – realita ukládání a aplikace
- Definice a typy UI nastavení: `app/lib/uiConfig.ts` (nebo ekvivalent dle projektu)
- Perzistence uživatelských voleb: `localStorage`
- Aplikace tříd: probíhá při renderu root `.layout` (typicky v `AppShell.tsx`)
- CSS: opírá se o třídy na `.layout` a CSS proměnné

Doporučená runtime kontrola:
- `document.querySelector('.layout')?.className`

---

### 3) Navigace (Menu) – renderery
Menu existuje ve dvou režimech, ale musí používat společný model dat:

- Sidebar renderer: `app/UI/Sidebar.tsx`
- TopMenu renderer: `app/UI/TopMenu.tsx` (pokud existuje)
- Společná data (moduly / sekce / tiles):
  - model se skládá centrálně (typicky v `AppShell.tsx`)
  - renderer nesmí mít vlastní logiku ikon, labelů nebo enabled stavů

Pravidlo:
- pokud Sidebar zobrazuje ikony a TopMenu ne, je chyba v:
  1. předávání `showIcons` / UI configu
  2. CSS selektorech pro topmenu režim
  3. nebo v tom, že TopMenu nedostává `icon` z modelu

---

### 4) UI komponenty – aktuálně klíčové
- `app/UI/HomeButton.tsx` – levý horní prvek (domů)
- `app/UI/Breadcrumbs.tsx` – drobečková navigace
- `app/UI/HomeActions.tsx` – pravý horní panel (globální akce)
- `app/UI/CommonActions.tsx` – kontextové akce (list/detail)
- `app/UI/AppIcon.tsx` + `app/UI/icons.ts` – jednotný systém ikon

---

### 5) CSS a theme – kde hledat realitu
- `app/globals.css` – základní tokens a globální styly
- `app/styles/**` – komponentové / layout / theme styly (přepisy dle tříd na `.layout`)

Typický problém:
- v tmavém režimu mizí šipky nebo ikony → ověř selektory pod `.theme-dark ...` a barvy ikon

---

### 6) Debug checklist (rychlý)
1. ověř třídy na `.layout`:
   - `document.querySelector('.layout')?.className`
2. ověř, že rozhodnutí `showIcons` je centrální (AppShell)
3. ověř, že CSS pro topmenu režim neschovává ikony (display / opacity / color)
