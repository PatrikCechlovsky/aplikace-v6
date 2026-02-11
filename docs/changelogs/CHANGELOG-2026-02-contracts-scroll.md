# 📝 CHANGELOG – Únor 2026: Smlouvy + Scroll systém

**Datum:** 9.–11. 2. 2026  
**Oblast:** Modul 060 Smlouvy, DetailView scroll systém, UI komponenty

---

## 1️⃣ Přehled změn

### Modul 060 – Smlouvy
- **Vytvořen kompletní modul pro správu nájemních smluv**
- Detail smlouvy s tabs: Detail / Uživatelé / Zástupci / Účty / Služby / Přílohy / Systém
- Vazba smlouvy na jednotku → automaticky se doplní nemovitost a pronajímatel
- Výběr uživatelů nájemníka pro konkrétní smlouvu (tab Uživatelé)
- Výběr zástupců nájemníka/pronajímatele (tab Zástupci, povinné pro firmy/spolky)
- Výběr bankovních účtů nájemníka/pronajímatele (tab Účty, povinné pro aktivaci)
- Tab Služby zobrazuje služby z jednotky a výpočet součtu do „Výše nájmu"
- Periodicita nájmu používá `service_periodicities` (shodné s periodicitou služeb)

### Scroll systém v DetailView
- **Kompletní redesign scroll logiky v aplikaci**
- DetailView má nyní fixed header s tabs a scrollovatelný content
- ListView v tabs má fixed toolbar a header, scrolluje se pouze tabulka
- Správné propagování flex heightu do vnořených komponent
- Oprava scroll containmentu v RelationListWithDetail
- CSS třída `.layout__content--detail-scroll` pro koordinaci scroll chování

### Bug Fixes
- Oprava nekonečné smyčky v ContractDetailForm (stabilizace callbacků)
- Oprava render loopu při změně hodnot formuláře
- Odstranění `useEffect` pro `onValueChange` v ContractDetailForm
- Stabilizace `onDirtyChange` a `onValueChange` přes `useCallback`

---

## 2️⃣ Databázové změny

### Migrace
- **094_add_subject_delegate_flags.sql**
  - Přidány příznaky `is_landlord_delegate`, `is_tenant_delegate`, `is_maintenance_delegate` do `subjects`
  
- **095_create_contracts.sql**
  - Tabulka `contracts` s poli:
    - základní údaje (číslo, stav, datumy, periodicita, den platby)
    - vazby na property, unit, landlord, tenant
    - vazby na účty: `landlord_account_id`, `tenant_account_id`
    - vazby na zástupce: `landlord_delegate_id`, `tenant_delegate_id`
    - finance (nájem, kauce)
    - metadata (created_at, updated_at, is_archived)
  - RLS policies pro contracts
  - Triggery pro updated_at

- **096_create_handover_protocols.sql**
  - Tabulka `handover_protocols` (předávací protokoly)
  - Vazba na smlouvu (`contract_id`)
  - Typy a stavy protokolů

- **097_align_contract_periodicities.sql**
  - Sjednocení periodicity smluv se service_periodicities
  - Odstranění duplicitních stavů
  - Seed generic_types pro contract_statuses, contract_types, handover_protocol_types/statuses

- **098_add_contract_relations.sql**
  - Tabulka `contract_users` pro vazbu smlouva → uživatelé nájemníka
  - Rozšíření `contracts` o sloupce: `landlord_account_id`, `tenant_account_id`, `landlord_delegate_id`, `tenant_delegate_id`
  - RLS policies pro contract_users
  - Trigger pro updated_at

---

## 3️⃣ Service layer

### Nové služby
- **`app/lib/services/contracts.ts`**
  - `listContracts()` – seznam smluv s filtrem, archivací, limitováním
  - `getContractById()` – detail smlouvy
  - `saveContract()` – vytvoření/editace smlouvy
  - Typy: `ContractRow`, `ContractDetailRow`, `SaveContractInput`, `UiContract`

- **`app/lib/services/contractUsers.ts`**
  - `listContractUsers()` – seznam uživatelů přiřazených ke smlouvě
  - `setContractUsers()` – nastavení výběru uživatelů (diff add/remove)

### Rozšíření existujících služeb
- **`app/lib/services/tenantUsers.ts`**
  - Export typu `TenantUser` pro použití v contract_users

- **`app/lib/services/tenants.ts`**
  - `getTenantDelegates()` – načtení delegátů nájemníka

- **`app/lib/services/landlords.ts`**
  - `getLandlordDelegates()` – načtení delegátů pronajímatele

---

## 4️⃣ UI komponenty

### Modul 060 – Smlouvy
- **`app/modules/060-smlouva/tiles/ContractsTile.tsx`**
  - Seznam smluv (ListView) s filtrem, archivací, řazením
  - Detail smlouvy s režimy: read / edit / create
  - Vazba na ContractDetailFrame
  - Column preferences (ukládání šířek, pořadí, skrytých sloupců)

- **`app/modules/060-smlouva/tiles/CreateContractTile.tsx`**
  - Rychlé vytvoření smlouvy (wrapper okolo ContractDetailFrame v create módu)

- **`app/modules/060-smlouva/forms/ContractDetailFrame.tsx`**
  - Frame pro detail smlouvy
  - Integrace s DetailView (tabs: detail, users, delegates, accounts, services, attachments, system)
  - Načítání lookupů (jednotky, nemovitosti, pronajímatelé, nájemníci)
  - Validace (povinné účty a delegáti pro aktivaci smlouvy)
  - Počet uživatelů z contract_users (nájemník + vybraní uživatelé)
  - Výpočet součtu služeb do „Výše nájmu"

- **`app/modules/060-smlouva/forms/ContractDetailForm.tsx`**
  - Formulář pro základní údaje smlouvy
  - Sekce: Základní údaje / Vazby / Finance / Poznámky
  - Auto-fill nemovitosti a pronajímatele při výběru jednotky
  - Výpočet poměru plochy k nemovitosti
  - Read-only pole pro výši nájmu (přebírá se z služeb)

- **`app/modules/060-smlouva/components/ContractUsersTab.tsx`**
  - Tab pro výběr uživatelů nájemníka
  - Checkbox list s možností vybrat/odvybrat uživatele
  - Hlavní nájemník je vždy zahrnut (+ 1 v počtu)
  - Tlačítka: Vybrat všechny / Vyčistit výběr / Uložit výběr

- **`app/modules/060-smlouva/components/ContractDelegatesTab.tsx`**
  - Tab pro výběr zástupců nájemníka a pronajímatele
  - Selecty načítající delegáty z tenant/landlord služeb
  - Zobrazení povinnosti pro firmy/spolky

- **`app/modules/060-smlouva/components/ContractAccountsTab.tsx`**
  - Tab pro výběr bankovních účtů nájemníka a pronajímatele
  - Selecty načítající účty z bankAccounts služby
  - Formátování účtů: číslo/IBAN + kód banky + label

- **`app/modules/060-smlouva/contractsColumns.ts`**
  - Definice sloupců pro ListView smluv
  - Exportované `CONTRACTS_BASE_COLUMNS` pro column preferences

### DetailView & Scroll systém
- **`app/UI/DetailView.tsx`**
  - Přidána podpora pro custom content v tabs: `usersContent`, `accountsContent`, `delegatesContent`
  - Extended `DetailViewCtx` o tyto nové vlastnosti
  - Podpora pro `sectionCounts` (zobrazení počtu v tabu)
  - Fixed header s tabs, scrollovatelný content

- **`app/UI/EntityDetailFrame.tsx`**
  - Aktualizace pro podporu nových custom tabs

- **`app/styles/components/DetailView.css`**
  - Nové CSS pravidlo: `.layout__content--detail-scroll` pro koordinaci scroll logiky
  - DetailView má `display: flex; flex-direction: column; height: 100%`
  - `.detail-view__content` má `flex: 1; overflow-y: auto`
  - Tabs zůstávají fixed, scrolluje se pouze content

- **`app/styles/components/TileLayout.css`**
  - Oprava flex grow pro `.tile-layout` v režimu detail scroll
  - Změna z `flex: 1 1 auto` na `flex: 1 1 0` pro správný height constraint

- **`app/styles/components/AppShell.css`**
  - `.layout__content--detail-scroll` má `overflow: hidden` (scroll je pouze uvnitř DetailView)

- **`app/styles/components/ListView.css`**
  - Scroll pouze v `.list-view__table-wrapper`, toolbar a header jsou fixed
  - Oprava height propagace přes flex layout

### Modul 040 – Nemovitosti
- **`app/modules/040-nemovitost/components/UnitServicesTab.tsx`**
  - Tab služeb pro jednotku (použitý i v ContractDetailFrame)
  - Callback `onCountChange` pro hlášení počtu služeb

---

## 5️⃣ Dokumentace

- **`docs/modules/060-contracts/README.md`**
  - Kompletní dokumentace modulu smluv
  - Popis entit, vazeb, číselníků
  - UI komponenty a jejich účel

- **`docs/06-data-model.md`**
  - Aktualizace sekce Smlouvy
  - Popis tabulky `contract_users`
  - Rozšíření `contracts` o nové sloupce (accounts, delegates)

- **`docs/03-ui-system.md`**
  - Nová sekce o scroll systému v DetailView
  - Pravidla pro flex layout a height propagation
  - CSS třídy pro koordinaci scroll chování

---

## 6️⃣ Bug Fixes

### Render loop v ContractDetailForm
- **Problém:** Nekonečná smyčka způsobená nestabilními callbacky `onDirtyChange` a `onValueChange`
- **Řešení:**
  - Stabilizace callbacků v `ContractDetailFrame` přes `useCallback`
  - Odstranění `useEffect` pro `onValueChange` v `ContractDetailForm`
  - `onValueChange` se volá přímo v `update()` funkci

### Scroll v DetailView
- **Problém:** DetailView se scrolloval celý včetně tabs
- **Řešení:**
  - Tabs jsou fixed (flex-shrink: 0)
  - Content má flex: 1 a overflow-y: auto
  - Layout propaguje height constraints přes flex: 1 1 0

### ListView v tabs
- **Problém:** ListView se scrolloval celý včetně toolbaru a headeru
- **Řešení:**
  - Scroll pouze v `.list-view__table-wrapper`
  - Toolbar a header jsou fixed

---

## 7️⃣ Deployment checklist

- [x] Spustit migrace 094–098 na produkci
- [x] Ověřit vytvoření smlouvy a výběr jednotky
- [x] Ověřit tab Uživatelé – výběr uživatelů nájemníka
- [x] Ověřit tab Zástupci – výběr delegátů (povinné pro firmy/spolky)
- [x] Ověřit tab Účty – výběr účtů (povinné pro aktivaci)
- [x] Ověřit tab Služby – zobrazení služeb jednotky a výpočet součtu
- [x] Ověřit scroll v DetailView (tabs fixed, content scrollable)
- [x] Ověřit scroll v ListView v tabs (toolbar/header fixed, tabulka scrollable)

---

## 8️⃣ Testing

- ✅ Vytvoření smlouvy (create mode)
- ✅ Editace smlouvy (edit mode)
- ✅ Výběr jednotky → auto-fill nemovitost, pronajímatel
- ✅ Výběr nájemníka → načtení uživatelů nájemníka
- ✅ Tab Uživatelé – výběr/odvýběr uživatelů, uložení
- ✅ Tab Zástupci – výběr delegátů, validace pro firmy/spolky
- ✅ Tab Účty – výběr účtů, validace povinnosti
- ✅ Tab Služby – zobrazení služeb jednotky, výpočet součtu
- ✅ Validace při aktivaci smlouvy (účty + delegáti pro firmy/spolky)
- ✅ Scroll v DetailView – tabs fixed, content scrollable
- ✅ Scroll v ListView v tabs – toolbar/header fixed, tabulka scrollable
- ✅ Column preferences – ukládání šířek, pořadí, skrytých sloupců

---

## 9️⃣ Poznámky

### Smlouvy
- **1 smlouva = 1 jednotka** (potvrzeno uživatelem)
- Počet uživatelů smlouvy = 1 nájemník + vybraní uživatelé z tenant_users
- Výše nájmu se automaticky vypočítá ze služeb jednotky
- Periodicita nájmu používá stejný číselník jako periodicita služeb (`service_periodicities`)

### Scroll systém
- DetailView používá **inside scroll pattern** – obsah scrolluje, header je fixed
- ListView v tabs používá **inside scroll pattern** – toolbar/header fixed, tabulka scrolluje
- `.layout__content--detail-scroll` třída koordinuje scroll chování mezi parent a child komponentami
- Flex layout propaguje height constraints: `flex: 1 1 0` + `min-height: 0` + `overflow: hidden/auto`

### Další kroky
- Modul 080 Platby – generování předpisů plateb ze smluv
- Modul 090 Finance – vyúčtování služeb a záloh
- Modul 100 Energie – odečty měřidel a vyúčtování
- Předávací protokoly – vazba na smlouvy, správa stavu předání/převzetí
