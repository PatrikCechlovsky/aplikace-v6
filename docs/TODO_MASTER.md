# TODO MASTER – Aplikace Pronajímatel v6

Tento dokument je:
- jediný konsolidovaný seznam všech TODO v projektu
- „zdroj pravdy“ pro plánování, dokončování a testování
- bez programového kódu (žádné TS/JS bloky)

Pravidla:
- Nové úkoly se přidávají výhradně sem.
- Duplicitní TODO soubory se po konsolidaci smažou.
- Každý bod má stav:
  - [ ] nehotovo
  - [x] hotovo (doporučeno doplnit „otestováno“ do poznámky)

---

## 0. ZDROJE, KTERÉ BYLY SLOUČENÉ DO MASTER
- `todolist.md` (DetailView/Tabs fáze + kroky) — SLOUČENO, lze smazat
- `todo_list.md` (široký TODO napříč projektem) — SLOUČENO, lze smazat

---

## 1. ZÁKLADNÍ ARCHITEKTURA A STAV APLIKACE

- [ ] Sjednotit životní cyklus všech formulářů (read / edit / create)
- [ ] Ujasnit, kde vzniká a kde se ruší „dirty state“
- [ ] Zajistit jednotné chování při opuštění rozpracovaného formuláře (confirm)
- [ ] Prověřit, že všechny detaily používají stejný vzor (EntityDetailFrame / DetailView)
- [ ] Odstranit dočasná řešení a poznámky typu „TODO later“ (přepsat na konkrétní úkol)

---

## 2. COMMON ACTIONS (globální tlačítka)

- [ ] Dokončit centrální engine CommonActions
- [ ] Řízení viditelnosti tlačítek podle:
  - role
  - oprávnění
  - stavu formuláře
  - výběru záznamu (selection)
- [ ] Správné přepínání:
  - Detail ↔ Edit
  - Save pouze v editaci
- [ ] Reset CommonActions při změně tile
- [ ] Zamezit ztrátě neuložených dat při navigaci
- [ ] Otestovat CommonActions ve všech modulech

---

## 3. TOP MENU (horní navigace)

- [ ] Napojit TopMenu na stejný výběrový model jako Sidebar
- [ ] Aktivní stav modulu
- [ ] Aktivní stav sekce
- [ ] Aktivní stav tile
- [ ] Reset výběru při přepnutí modulu
- [ ] Chování modulů bez sekcí
- [ ] Zavírání podmenu klikem mimo
- [ ] Konzistence chování se Sidebarem
- [ ] Otestovat přepínání Sidebar ↔ TopMenu

---

## 4. LAYOUT A UI CHOVÁNÍ

- [ ] Správné rozložení `layout__actions` v režimu TopMenu
- [ ] Oddělení TopMenu a CommonActions do dvou řádků
- [ ] Konzistence CSS mezi moduly
- [ ] Sjednocení ListView vzhledu
- [ ] Odstranění duplicitních nebo konfliktních stylů
- [ ] Ověřit ikonový vs textový režim

---

## 5. AUTENTIZACE A UŽIVATEL

- [ ] Editace profilu přihlášeného uživatele (Můj účet)
- [ ] Avatar uživatele
- [ ] Prověřit načítání session při startu
- [ ] Ověřit reakce aplikace na změnu auth stavu
- [ ] Připravit auditní stopy (základ)

---

## 6. ROLE A OPRÁVNĚNÍ

- [ ] Opravit přečíslování rolí (duplicitní order)
- [ ] Zajistit atomický reorder
- [ ] Konzistence mezi rolemi a permission types
- [ ] Ověřit chování archivovaných rolí
- [ ] Prověřit oprávnění v UI (skrývání akcí)

---

## 7. MODUL 010 – SPRÁVA UŽIVATELŮ

### Uživatel
- [ ] Kompletní formulář napojený na databázi
- [ ] Správné mapování DB ↔ UI
- [ ] Rozlišení read / edit / create
- [ ] Kontrola archivace

### Pozvánky (Invite flow)
- [x] Samostatná obrazovka „Pozvat uživatele“
- [x] Pozvání existujícího uživatele z detailu
- [x] Pozvání nového uživatele
- [x] Respektovat can_send_invite + first_login_at
- [x] Systémová data pozvánky (odeslal, kdy, platnost, status)
- [ ] UI doladění formuláře pozvánky
- [ ] Uživatelský text pozvánky (spolupráce / nemovitosti)
- [ ] Přemapovat akci „Save“ → „Odeslat pozvánku“
- [ ] Rozhodnout chování po odeslání (zůstat / zavřít)
- [ ] Audit log pozvánek (minimální verze)

### Detail uživatele
- [x] DetailView se sekcemi (detail, role, invite, přílohy, systém)
- [ ] Přílohy: READ-ONLY tab v detailu entity + 📎 manager tile (upload/verze/historie), včetně edge-cases:
  - [ ] archivovaná entita = manager read-only
  - [ ] read-only role = manager read-only
  - [ ] RLS / 401 / 403 = srozumitelná chyba, žádné request stormy
- [x] Invite sekce pouze pro existující uživatele
- [x] System sekce s invite informacemi
- [ ] UX doladění sekcí (šířky, copy, pořadí)

### Navigace / UX
- [x] Close = krok zpět (list ← detail ← invite)
- [x] Menu klik = okamžitý přechod (dirty confirm)
- [ ] Sjednotit chování Home button

### Koncepční (010)
- [ ] Definovat typy pozvánek (spolupráce / plátce)
- [ ] Role-based invite policy
- [ ] Expirace pozvánek (cron / job)

---

## 8. DETAILVIEW / SEKCE / TABS (konsolidace z todolist.md)

### Stav (hotovo)
- [x] DetailTabs (ouška) + aktivní přepínání sekcí
- [x] Registry sekcí v DetailView + resolveSections
- [x] UserDetailFrame jako „konfigurace“ (bez vlastní tab logiky)

### Zbývá dodělat
- [ ] Nic nemazat: při nahrazování přesouvat staré věci do `docs/archive/` nebo označit jako archive (procesní pravidlo)
- [ ] Entity detail tile vzhled:
  - [ ] vytvořit/aktivovat CSS pro rám detailu (`EntityDetailFrame.css`)
  - [ ] import do AppShell
  - [ ] zrušit 2-sloupcový layout, odstranit „prázdný sloupec“, sjednotit padding/radius
- [ ] Naplnit reálný obsah sekcí (ne placeholder):
  - [ ] `roles` (role, oprávnění, skupiny)
  - [ ] `attachments` (READ-ONLY tab + manager tile přes 📎)
  - [ ] `system` (audit: createdAt/updatedAt/archivace + jednotný formát času)
  - [ ] `accounts`
  - [ ] `users`
  - [ ] `equipment`

### Reuse na dalších entitách
- [ ] Nájemník: sekce `users`, `accounts`
- [ ] Jednotka: sekce `users`, `equipment`, `accounts`
- [ ] Subjekt: sekce `accounts`

---

## 9. MODULY (rozšíření – konsolidace z todo_list.md)

- [ ] Modul 020 – Můj účet (oddělit self-edit a admin logiku)
- [ ] Modul 030 – Pronajímatel (doplnit formuláře)
- [ ] Modul 040 – Nemovitosti (datový model + UI)
- [ ] Modul 050 – Nájemníci (formuláře + vazby)
- [ ] Modul Smlouvy (datový model, validace období, vazby)
- [ ] Modul Platby / Finance (platební kalendář, QR, filtry období)
- [ ] Modul Měřidla (evidence, import odečtů, vyúčtování v2)
- [ ] Modul Dokumenty (archiv dokumentů, šablony e-mailů, generování PDF)
- [ ] Modul Komunikace (historie zpráv, štítky, automatizace)

---

## 10. LOGIKA & SERVICES

- [ ] Permission service
- [ ] DynamicBreadcrumbs builder
- [ ] FormState manager
- [ ] Centralizace všech datových validací

---

## 11. DATA, IMPORTY A EXPORTY

- [ ] Návrh jednotného importního mechanismu
- [ ] Export vzorových šablon
- [ ] Validace dat před importem
- [ ] Přehledné hlášení chyb

---

## 12. DOKUMENTACE

- [ ] Aktualizovat dokumentaci dle reálného stavu kódu
- [ ] Doplnit CommonActions v6
- [ ] Doplnit TopMenu
- [ ] Doplnit Invite flow
- [ ] Modulová dokumentace (každý modul)
- [ ] Označit historické dokumenty (archive)

---

## 13. TESTOVÁNÍ A STABILITA

- [ ] Ruční testy hlavních scénářů
- [ ] Ověření chování při chybách
- [ ] Kontrola konzole (žádné chyby / warningy)
- [ ] Stabilita buildu

---

## 14. INFRA & TECH (konsolidace z todo_list.md)

- [ ] Optimalizace buildů
- [ ] CI/CD GitHub Actions
- [ ] Logování chyb v produkci
- [ ] Testy (unit + integration)

---

## 15. BUDOUCNOST / PLÁN (informativní)

- [ ] Workflow engine (automatizace procesů)
- [ ] Napojení na email API (SendGrid / Postmark)
- [ ] Mobilní aplikace (v2)
- [ ] Zabezpečení přístupu k modulům (fine-grained)
- [ ] Externí API rozhraní

---

## 16. UZAVÍRÁNÍ ÚKOLŮ (proces)

- [ ] Každý bod označit jako:
  - hotovo
  - otestováno (doporučeno doplnit do poznámky)
- [ ] Nehotové body zůstávají v tomto dokumentu
- [ ] Nové úkoly se přidávají výhradně sem

---

## 17. UX / UI CONSISTENCY – sjednocení datumů a časů

Sjednotit zobrazení datumů a časů v celé aplikaci (UI layer)

Popis:
V celé aplikaci se aktuálně na některých místech zobrazují databázové hodnoty timestamptz přímo ve formátu ISO
(např. 2025-12-16T07:47:26.728831+00:00), což není vhodné pro koncového uživatele.

Cíle:
- zobrazovat pouze datum + čas (bez mikrosekund a bez explicitního timezone)
- mít jednotný formát napříč celou aplikací
- zachovat plnou přesnost v databázi

Rozsah:
- Detail entity → záložka Systém
- Přílohy (Nahráno / Změněno)
- Pozvánky
- Audit / historie změn
- Jakékoliv další systémové nebo read-only zobrazení času

Akceptační kritéria:
- v UI se nikde nezobrazuje znak „T“, mikrosekundy ani „+00:00“
- prázdná hodnota → zobrazí se „—“
- databázová struktura zůstává beze změny
