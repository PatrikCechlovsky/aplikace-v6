# Modul – TODO šablona (pracovní návod pro každý modul)

> Tento soubor si zkopíruj do složky každého modulu jako  
> `MODULE-TODO.md` (např. `app/modules/020-nemovitosti/MODULE-TODO.md`)  
> a postupně si v něm odškrtávej, co je hotové.

---

## 1. Účel tohoto návodu

- Mít **stejný postup** pro všechny moduly (Subjekty, Nemovitosti, Jednotky, Smlouvy, …).
- Udržet **UI logiku konzistentní**:
  - ListView
  - EntityList
  - EntityDetailFrame
  - DetailView
  - RelationListWithDetail
  - ColumnPicker
- Průběžně sem můžeme doplňovat další pravidla (verze 2, 3…).

---

## 2. Vzorová struktura složek modulu

Doporučená struktura (může se lehce lišit podle typu modulu, ale základ držet):

- `app/modules/XXX-nazev-modulu/`
  - `module.config.ts` nebo `module.config.js`  
    – registrace modulu, tiles, ikon, pořadí v menu
  - `tiles/`
    - soubory pro jednotlivé tiles (seznamy / konfigurace)
      - např. `PropertyListTile.tsx`
      - např. `PropertyTypesTile.tsx` (číselníky)
  - `forms/`
    - definice formulářů pro DetailView
      - např. `propertyDetailForm.ts`
      - např. `propertyFiltersForm.ts` (pokud bude)
  - `components/`
    - případné specifické UI komponenty pro modul
      - např. `PropertyHeader.tsx`
  - `services/` (volitelné)
    - datová logika, API funkce
  - `MODULE-TODO.md`
    - tento soubor – pracovní checklist

Pokud bude potřeba další podsložka (např. `hooks/`), vždy ji doplnit i do popisu tady.

---

## 3. Krok 1 – Specifikace polí (Excel / tabulka)

1. Vytvořit / doplnit Excel tabulku pro entitu/entit v modulu:

   - Název pole (lidský název)
   - Kód pole (system name, např. `property_name`)
   - Typ pole (text, select, date, boolean, lookup…)
   - Délka (max. délka pro text)
   - Maska / validace (např. IČ, PSČ, telefon)
   - Select zdroj:
     - `fixed` – pevně dané hodnoty v aplikaci
     - `generic_type:…` – konfigurovatelné přes GenericTypeTile
     - `lookup:…` – vazba na jinou tabulku
   - Viditelnost (které role / typy)
   - Editovatelnost (kdo může měnit)
   - Poznámka (např. „jen pro interní použití“, „pouze pro finance“…)

2. Zkontrolovat, že:
   - jsou doplněna **všechna** pole, která v modulu budeme potřebovat
   - jsou rozmyšlené zdroje pro všechny selecty

> Checklist:
> - [ ] Excel/tabulka pro entitu je hotová  
> - [ ] U každého pole je typ, select zdroj, role, poznámka

---

## 4. Krok 2 – Selecty a číselníky

Rozdělit selecty na:

1. **Pevné (hard-coded)**  
   Např. stav vybavení:  
   - nové  
   - běžné  
   - poškozené  
   - k výměně

2. **Konfigurovatelné (generic types)**  
   Např. kategorie vybavení jednotek:  
   - kuchyně  
   - koupelna  
   - elektro  
   - nábytek  
   - … (uživatel může doplnit)

Postup:

- pro každý konfigurovatelný select rozhodnout název generic typu  
  (např. `equipment_category`, `property_type`, `contract_type`)
- zapsat tento název:
  - do Excelu (sloupec Select zdroj)
  - do configu modulu (aby věděl, co má načítat)
- v modulu 900 (Nastavení) připravit/zkontrolovat příslušný GenericTypeTile

> Checklist:
> - [ ] Rozdělené pevné vs. konfigurovatelné selecty  
> - [ ] Pro každý konfig. select existuje generic type (`generic_type:…`)  
> - [ ] V Excelu je u každého selectu uveden správný zdroj

---

## 5. Krok 3 – Role a oprávnění (matice)

Pro modul vytvořit jednoduchou matici rolí:

- Sloupce: role (admin, pronajímatel, servis, finance, nájemník…)  
- Řádky: hlavní entity a akce (vidět seznam, vidět detail, upravovat, mazat, archivovat)

Příklad (jen pro představu, ne striktní):

- admin – vše
- pronajímatel – vidí a upravuje své záznamy
- servis – vidí technické části, ale ne finance
- finance – vidí finanční části, ale ne servisní detaily

Dále:

- v Excelu u polí doplnit:
  - kdo pole vidí
  - kdo ho může editovat
- v dokumentaci 05-auth-rls k modulu dopíšeme konkrétní pravidla později

> Checklist:
> - [ ] Matice rolí vs. akce existuje (aspoň v základní podobě)  
> - [ ] U polí v Excelu je viditelnost / editovatelnost podle role

---

## 6. Krok 4 – UI struktura modulu (ListView, detail, vazby)

### 6.1 ListView – hlavní přehled

Definovat pro modul:

- název hlavního přehledu (např. „Přehled nemovitostí“)
- sloupce:
  - povinné (nejdou skrýt v ColumnPickeru)
  - volitelné
- výchozí řazení (např. podle názvu, podle typu…)
- výchozí filtr (aktivní, nearchivované)
- pohledy v sidebaru (přednastavené filtry), např.:
  - Přehled všech
  - Rodinný dům
  - Bytový dům
  - Průmyslový
- chování při:
  - kliknutí na řádek (vybrat)
  - dvojkliku (otevřít hlavní detail / EntityDetailFrame)

> Checklist:
> - [ ] Seznam sloupců pro ListView je definovaný  
> - [ ] Určené výchozí řazení a filtr  
> - [ ] Definované pohledy v sidebaru (pokud dává smysl)  
> - [ ] Rozhodnuto, co dělá dvojklik (otevření hlavního detailu)

---

### 6.2 EntityDetailFrame + DetailView – hlavní detail / edit

Pro hlavní entitu modulu sepsat sekce (tabs):

- např. pro Nemovitosti:
  - Základní údaje
  - Adresa
  - Jednotky (tady je už RelationListWithDetail)
  - Přílohy
  - Historie
  - Systém

U každé sekce:

- jaká pole z Excelu sem patří
- kdo sekci vidí (role)
- kdo ji může editovat

Platí pravidlo:

- poslední 3 sekce jsou **standardizované**:
  - Přílohy (povinné)
  - Historie
  - Systém

> Checklist:
> - [ ] Definované sekce hlavního detailu  
> - [ ] U každé sekce je seznam polí  
> - [ ] Přílohy, Historie, Systém jsou zahrnuty

---

### 6.3 RelationListWithDetail – vazby

Sepsat, jaké vazby modul používá:

- např. modul Nemovitosti:
  - Nemovitost → Jednotky
  - Nemovitost → Smlouvy (později)
- modul Jednotky:
  - Jednotka → Smlouvy
- modul Smlouvy:
  - Smlouva → Platby

U každé vazby:

- jaké sloupce budou v horním EntityList
- zda se používá ColumnPicker
- jaký detail se zobrazí dole (DetailView které entity)
- zda je dolní detail readonly nebo editovatelný

> Checklist:
> - [ ] Seznam vazeb pro modul je sepsaný  
> - [ ] Pro každou vazbu je definovaný horní seznam a dolní detail

---

## 7. Krok 5 – ColumnPicker pro seznamy

Pro každý **ListView** (hlavní i „vazebný“):

- určit, zda bude mít ColumnPicker
- u sloupců určit:
  - povinné (nelze skrýt)
  - volitelné
- připravit identifikátor pohledu pro uložení nastavení
  - modul ID
  - tile / view ID

> Checklist:
> - [ ] Rozhodnuto, kde ColumnPicker bude  
> - [ ] U sloupců označeno, co je povinné / volitelné

---

## 8. Krok 6 – Implementace v kódu (až po specifikaci)

Teprve po vyplnění předchozích kroků:

- doplnit / vytvořit `module.config`
- vytvořit / upravit ListView komponentu pro modul
- nadefinovat Detail form schema (soubor ve složce `forms/`)
- nadefinovat vazby pro RelationListWithDetail
- připojit generic typy pro selecty
- přidat případné testovací data (seed)

> Checklist:
> - [ ] module.config doplněný / upravený  
> - [ ] ListView pro modul použitelný  
> - [ ] Detail form schema připravené  
> - [ ] Vazby (RelationListWithDetail) fungují aspoň v základní podobě

---

## 9. Místo pro poznámky a další pravidla

Sem piš cokoliv, na co narazíme u tohoto konkrétního modulu:

- co bylo potřeba udělat speciálně
- jaké vychytávky / omezení jsme zavedli
- TODO pro druhé kolo (performance, RLS, optimalizace…)

Např.:

- TODO: doplnit automatické filtry podle vlastníka
- TODO: přidat logiku pro „archivované“ v seznamu
- TODO: vymyslet zobrazení ikon stavů v seznamu

---
