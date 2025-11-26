// FILE: docs/stav-struktury.md

# Stav struktury aplikace – Pronajímatel v6

Tento dokument slouží jako přehled **všech komponent, modulů, formulářů, tiles a procesů**.

Stavy:
- `TODO` – zatím neexistuje
- `WIP` – rozpracováno
- `DONE` – hotovo, funkční

---

## 1. UI komponenty (TSX)

| Název          | Soubor                    | Typ        | Stav | Poznámka               |
|----------------|---------------------------|-----------|------|------------------------|
| HomeButton     | src/app/UI/HomeButton.tsx | komponenta | TODO | tlačítko + název appky |
| Sidebar        | src/app/UI/Sidebar.tsx    | komponenta | DONE | dynamicky načítá moduly z modules.index.js |
| Breadcrumbs    | src/app/UI/Breadcrumbs.tsx| komponenta | TODO | drobečková navigace    |
| HomeActions    | src/app/UI/HomeActions.tsx| komponenta | TODO | ikony vpravo nahoře    |
| CommonActions  | src/app/UI/CommonActions.tsx | komponenta | TODO | akce dle modulu (Edit, Archivovat…) |
| Tabs           | src/app/UI/Tabs.tsx       | komponenta | TODO | 10 fixních záložek     |
| DetailView     | src/app/UI/DetailView.tsx | komponenta | TODO | hlavní karta detailu   |
| ListView       | src/app/UI/ListView.tsx   | komponenta | TODO | přehled záznamů        |

---

## 2. Moduly (config = JS, každý ve své složce)

Umístění: `src/app/modules/[KOD-NÁZEV]/module.config.js`  

| Kód  | Název            | Cesta                                              | Stav | Poznámka                  |
|------|------------------|----------------------------------------------------|------|---------------------------|
| 010  | Správa uživatelů | src/app/modules/010-sprava-uzivatelu/module.config.js | DONE | základní config (id, order, label, icon) |
| 020  | Můj účet         | src/app/modules/020-muj-ucet/module.config.js        | DONE |                           |
| 030  | Pronajímatel     | src/app/modules/030-pronajimatel/module.config.js    | DONE |                           |
| 040  | Nemovitost       | src/app/modules/040-nemovitost/module.config.js      | DONE |                           |
| 050  | Nájemník         | src/app/modules/050-najemnik/module.config.js        | DONE |                           |
| 060  | Smlouva          | src/app/modules/060-smlouva/module.config.js         | DONE |                           |
| 070  | Služby           | src/app/modules/070-sluzby/module.config.js          | DONE |                           |
| 080  | Platby           | src/app/modules/080-platby/module.config.js          | DONE |                           |
| 090  | Finance          | src/app/modules/090-finance/module.config.js         | DONE |                           |
| 100  | Energie          | src/app/modules/100-energie/module.config.js         | DONE |                           |
| 120  | Dokumenty        | src/app/modules/120-dokumenty/module.config.js       | DONE |                           |
| 130  | Komunikace       | src/app/modules/130-komunikace/module.config.js      | DONE |                           |

---

## 3. Konfigurace modulů (do budoucna)

Do `module.config.js` budeme postupně doplňovat:

- `overview` – seznam přehledů (list view), sloupce, filtry
- `detail` – definice formulářových polí, sekcí, příloh, systémových informací
- `tiles` – dlaždice na přehledu modulu
- `actions` – přehled akcí (common actions) pro modul
- `tabs` – vazby mezi moduly (10 fixních záložek, případné rozšíření)

---

## 4. Formuláře

(Zatím skeleton – budeme doplňovat později.)

| Entita       | Kód formuláře      | Modul | Stav | Soubor / poznámka |
|--------------|--------------------|-------|------|-------------------|
| Pronajímatel | form_pronajimatel  | 030   | TODO |                   |
| Nemovitost   | form_nemovitost    | 040   | TODO |                   |
| Jednotka     | form_jednotka      | 0XX   | TODO |                   |

---

## 5. Tiles / dlaždice

(Zatím prázdné, budeme doplňovat, až bude základ UI hotový.)

---

## 6. Procesy / průvodci

(Zatím prázdné – později sem přibydou např. průvodce založením smlouvy, přidáním nájemníka, předávacím protokolem apod.)
