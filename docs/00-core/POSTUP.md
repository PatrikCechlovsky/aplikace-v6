# aplikace-v6/docs/00-core/POSTUP.md
# POSTUP – jednotná šablona pro tvorbu modulů

## Účel dokumentu
Tento dokument definuje závazný a jednotný postup pro tvorbu jakéhokoliv modulu
v aplikaci-v6.  
Používá se pro všechny typy modulů (010–999) a zajišťuje, že:

- každý modul vzniká stejným procesem
- UI i datový model jsou konzistentní
- moduly jsou snadno udržovatelné a rozšiřitelné
- implementace v kódu odpovídá dokumentaci

Dokument slouží jako **šablona** pro každý `MODULE-TODO.md`.

---

# 1. PŘÍPRAVA MODULU (analýza)

## 1.1 Definice účelu modulu
Nejprve stručně definovat:

- k čemu modul slouží
- jakou entitu / entity spravuje
- kdo modul používá (role)
- zda je modul administrátorský, provozní nebo uživatelský

Výstup:

    1–2 odstavce popisu modulu (bez kódu)

---

## 1.2 Vytvoření datového modelu modulu
Každý modul pracuje buď:

- s existující entitou (`subject`, `property`, `unit`, `contract`…)
- nebo vytváří novou entitu (např. `equipment`, `meter`, `payment`…)

Pro entitu musí být určeno:

- tabulky (hlavní + vazební)
- vazby na jiné entity
- jestli jde o 1:N, N:N nebo výpočetní entitu
- audit, systémová pole
- archivace

Pokud modul přidává novou entitu:

    vytvořit nový dokument „entity-model.md“

---

# 2. SPECIFIKACE POLÍ (Excel / tabulka)

Každý modul *musí mít* excelovou nebo textovou tabulku všech polí své entity.

Sloupce:

    - Název pole (lidský)
    - Kód pole (system_name)
    - Typ pole (text, number, date, boolean, select, lookup, multiselect)
    - Select zdroj (fixed / generic_type / lookup)
    - Viditelnost (kdo pole vidí – role)
    - Editace (kdo pole smí měnit)
    - Validace (délka, maska, formát)
    - Poznámka

Kontrola:

- všechny selecty mají uvedený zdroj
- všechny lookupy mají uvedenou cílovou entitu
- názvy kódů jsou konzistentní

Výstup:

    „entity-fields.md“ + Excel tabulka pro daný modul

---

# 3. SELECTY A ČÍSELNÍKY

Každý select musí být jednoznačně:

- FIXED (pevně definované hodnoty)
- nebo GENERIC TYPE (uživatelsky konfigurovatelné)
- nebo LOOKUP (odkaz na jinou entitu)

Je nutné vytvořit:

1. seznam všech selectů v modulu  
2. určit jejich zdroj  
3. případně založit nový generic_type v modulu 900  

Výstup:

    sekce „Selecty“ v MODULE-TODO + případně nový tile v modulu 900

---

# 4. ROLE A OPRÁVNĚNÍ

## 4.1 Matice přístupu k modulu
Je nutné určit:

- kdo smí otevřít ListView modulu
- kdo smí otevřít DetailView
- kdo smí upravovat entity
- kdo smí mazat / archivovat
- kdo smí měnit systémové části
- kdo vidí které sekce detailu

## 4.2 Viditelnost a editovatelnost polí
Z Excel tabulky se převezme:

    role → vidí / smí editovat

Výstup:

    „permissions.md“ pro daný modul

---

# 5. UI STRUKTURA MODULU

Každý modul používá jednotnou strukturu UI, která je závazná.

---

## 5.1 ListView (hlavní seznam)

Každý ListView definuje:

- entity list (hlavní seznam)
- sloupce:
    povinné
    volitelné (ColumnPicker)
- filtry:
    text (fulltext)
    selecty
    datumy
    stav (aktivní/archiv)
- výchozí řazení
- výchozí filtr
- akce:
    CommonActions (Nový, Import, Export…)
    RowActions (Detail, Archivace, Mazání…)

Výstup:

    listview-spec.md

---

## 5.2 DetailView (hlavní detail entity)

Detail je složen z:

- EntityDetailFrame
- záložek (tabs)
- formulářů (forms)

### Povinné záložky:
1. Základní údaje
2. Vazby (pokud existují)
3. Přílohy
4. Historie
5. Systém

Každá záložka definuje:

- pole, která obsahuje
- role, které ji vidí
- zda je editovatelná nebo read-only
- validace

Výstup:

    detail-spec.md

---

## 5.3 RelationListWithDetail

Používá se, pokud modul má vazby:

- property → units  
- unit → contracts  
- subject → bank_accounts  
- subject → additional_users  

Každá vazba definuje:

- horní seznam (EntityList)
- sloupce
- výchozí filtr
- dolní detail (DetailView jiné entity)
- oprávnění

Výstup:

    relations-spec.md

---

# 6. COLUMN PICKER

Musí být definováno pro každý ListView:

- které sloupce jsou povinné
- které lze skrýt
- unikátní identifikátor pohledu (moduleId + tileId)

---

# 7. HLAVIČKY, CESTY A NÁZVY SOUBORŮ (PRAVIDLO 01–10)

Každý MD soubor **musí začínat**:
    aplikace-v6/docs/.../soubor.md
    Název dokumentu
    Účel dokumentu
    (stručný popis)

Každý modul má strukturu:
    app/modules/XXX-nazev-modulu/
    module.config.ts
    tiles/
    forms/
    components/
    services/
    MODULE-TODO.md


---

# 8. IMPLEMENTACE (až po dokončení POSTUPU)

Teprve když:

- je hotová specifikace polí
- jsou určeny role
- je určená UI struktura
- jsou určeny vazby

→ teprve potom se začne programovat.

Pořadí implementace:

1. module.config  
2. entity list (ListView)  
3. detail (DetailView + formuláře)  
4. vazby (RelationListWithDetail)  
5. selecty a číselníky  
6. validace  
7. testovací data  

Výstup:

    funkční modul v aplikaci

---

# 9. CHECKLIST PRO KAŽDÝ MODUL
    [ ] Definován účel modulu
    [ ] Vytvořena tabulka všech polí (Excel + MD)
    [ ] Určeny selecty (fixed/generic_type/lookup)
    [ ] Určeny role a oprávnění
    [ ] Navržena UI struktura (ListView + DetailView)
    [ ] Popsány vazby (RelationListWithDetail)
    [ ] Definován ColumnPicker
    [ ] Doplněny systémové sekce (Přílohy, Historie, Systém)
    [ ] Hotový MODULE-TODO
    [ ] Může začít implementace

    
---

# 10. Shrnutí POSTUPU

POSTUP definuje jednotný životní cyklus modulu:

    1) Analýza → 2) Specifikace polí → 3) Selecty → 4) Role →  
    5) UI struktura → 6) Vazby → 7) ColumnPicker →  
    8) Implementace → 9) Kontrola → 10) Hotovo.

Tento dokument musí být použit pro **každý nový modul** v systému.


