# TODO MASTER – Aplikace Pronajímatel v6

Tento dokument je:
- jediný konsolidovaný seznam všech TODO nalezených v projektu
- vznikl projitím celého ZIPu (kód, moduly, UI, dokumentace)
- slouží jako kontrolní checklist dokončení a testování

Neobsahuje žádný programový kód.

---

## 1. ZÁKLADNÍ ARCHITEKTURA A STAV APLIKACE

- [ ] Sjednotit životní cyklus všech formulářů (read / edit / create)
- [ ] Ujasnit, kde vzniká a kde se ruší „dirty state“
- [ ] Zajistit jednotné chování při opuštění rozpracovaného formuláře
- [ ] Prověřit, že všechny detaily používají stejný vzor (EntityDetailFrame)
- [ ] Odstranit dočasná řešení a poznámky typu „TODO later“

---

## 2. COMMON ACTIONS (globální tlačítka)

- [ ] Dokončit centrální engine CommonActions
- [ ] Řízení viditelnosti tlačítek podle:
  - role
  - oprávnění
  - stavu formuláře
  - výběru záznamu
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

### Pozvánky
- [ ] Oddělení pozvánky od detailu uživatele
- [ ] Kontrola již odeslaných pozvánek
- [ ] Kontrola existujícího uživatele
- [ ] Stavový model pozvánky (koncept / odeslaná / přijatá / expirovaná)
- [ ] Tlačítko pro odeslání pozvánky
- [ ] Zobrazení stavu pozvánky

---

## 8. DALŠÍ MODULY (ZÁKLADY)

- [ ] Modul 020 – Můj účet (oddělení self-edit a admin logiky)
- [ ] Modul 030 – Pronajímatel (doplnit formuláře)
- [ ] Modul 040 – Nemovitosti (datový model + UI)
- [ ] Modul 050 – Nájemníci
- [ ] Modul 900 – Nastavení jako referenční modul

---

## 9. DATA, IMPORTY A EXPORTY

- [ ] Návrh jednotného importního mechanismu
- [ ] Export vzorových šablon
- [ ] Validace dat před importem
- [ ] Přehledné hlášení chyb

---

## 10. DOKUMENTACE

- [ ] Aktualizovat dokumentaci dle reálného stavu kódu
- [ ] Doplnit CommonActions v6
- [ ] Doplnit TopMenu
- [ ] Doplnit Invite flow
- [ ] Modulová dokumentace
- [ ] Označit historické dokumenty

---

## 11. TESTOVÁNÍ A STABILITA

- [ ] Ruční testy hlavních scénářů
- [ ] Ověření chování při chybách
- [ ] Kontrola konzole (žádné chyby / warningy)
- [ ] Stabilita buildu

---

## 12. UZAVÍRÁNÍ ÚKOLŮ

- [ ] Každý bod označit jako:
  - hotovo
  - otestováno
- [ ] Nehotové body zůstávají v tomto dokumentu
- [ ] Nové úkoly se přidávají výhradně sem
