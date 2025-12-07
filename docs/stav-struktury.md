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
