# /docs/09-project-rules.md
## Popis: Tento dokument definuje pravidla projektu, styl psaní kódu, strukturu dokumentace, názvosloví a sjednocené workflow aplikace Pronajímatel v6.
---

# 09 – Pravidla projektu (Project Rules)

Tento dokument stanovuje jednotný způsob práce na projektu Pronajímatel v6.  
Všichni vývojáři i spolupracující osoby musí tato pravidla dodržovat.

Cíle pravidel:
- sjednotit kód,
- zajistit přehlednou dokumentaci,
- udržet stabilitu architektury,
- umožnit škálování projektu do budoucna.

---

# 1. Pravidla dokumentace

## 1.1 Povinné tři řádky na začátku každého souboru

Každý dokument v `/docs` MUSÍ začínat tímto formátem:

```
# /docs/<název-souboru>.md
## Popis: Tento dokument obsahuje <stručný popis>.
---
```

### Význam:

- **řádek 1** – přesná cesta a název souboru → přehlednost  
- **řádek 2** – jednovětý popis obsahu  
- **řádek 3** – oddělení metadat od obsahu dokumentu

Toto pravidlo je závazné a neměnné.

---

## 1.2 Struktura dokumentace

Dokumentace se skládá z následujících souborů:

```
01-executive-summary.md
02-architecture.md
03-ui-system.md
04-modules.md
05-auth-rls.md
06-data-model.md
07-deployment.md
08-plan-vyvoje.md
09-project-rules.md
10-glossary.md (bude vytvořen)
```

Každý dokument má předem definované téma a obsahuje jen věci, které tam patří.

---

## 1.3 Pravidla pro aktualizaci dokumentace

- nic se NESMÍ mazat → vše se **přeškrtává** a nechává se v dokumentu  
- vše nové se vkládá **pod správné sekce**  
- co není kam dát → přesouvá se do `todo_list.md → sekce "k zařazení"`

Dokumentace je stejně důležitá jako samotný kód.

---

# 2. Pravidla pro strukturu projektu

Základní struktura aplikace:

```
app/
  UI/
  modules/
  layout/
  (budoucí) services/
docs/
scripts/
public/
```

## 2.1 Složka `app/UI/`

Obsahuje pouze:
- znovupoužitelné UI komponenty  
- žádná business logika  
- žádný přístup k databázi ani Supabase  

## 2.2 Složka `app/modules/`

Každý modul má strukturu:

```
module.config.js
overview/
forms/
tiles/
```

Moduly obsahují:
- business logiku,
- přehledy,
- formuláře,
- detailní komponenty,
- konfiguraci akcí (v2).

## 2.3 Složka `services/` (budoucí)

Sem bude přesouvána:
- logika načítání dat,
- transformace dat,
- práce s Supabase dotazy,
- validace,
- centralizované operace.

---

# 3. Pravidla psaní kódu (CodeStyle)

## 3.1 Základní principy

- komponenty pojmenováváme **PascalCase**
- proměnné, props a funkce: **camelCase**
- události:  
  - handler uvnitř komponenty → `handleXxx`  
  - prop události → `onXxx`
- žádné funkce nebo hooky uvnitř JSX  
- vše potřebné je definováno **nad `return`**

## 3.2 Ikony

Ikony se povinně získávají přes:

```
getIcon('name')
```

Zakazuje se:
- importovat ikonové komponenty přímo,
- používat náhodné emoji mimo definovaný systém.

## 3.3 Formuláře

- každý formulář musí používat jednotnou strukturu:
  - název
  - popis
  - sekce polí
  - spodní CommonActions
- validaci řešit v services vrstvách (po vytvoření)
- žádné inline validace v UI bez sjednocení

## 3.4 CommonActions – standardy

Sada akcí je jednotná:

```
add, edit, view, duplicate, attach,
archive, delete,
save, saveAndClose, cancel
```

### Pravidla:

- ikonky musí odpovídat definicím projektu  
- akce se zobrazují na sekci 4 (layout)  
- modul si definuje, které akce chce používat (v2)  
- systém kontroluje:
  - roli uživatele,
  - výběr položky,
  - stav formuláře (dirty/clean),
  - stav modulu.

---

# 4. Pravidla pro UI design

## 4.1 Layout

Aplikace používá **přesně definovaný 6-sekční layout**:

1. Sidebar – část 1 a 2  
2. Horní lišta (Breadcrumbs + HomeActions)  
3. CommonActions  
4. Content oblast  

Nic nesmí měnit význam těchto sekcí.

---

## 4.2 Sidebar

Musí být dynamický:  
- načítá moduly z registry  
- zobrazuje ikony + názvy  
- má aktivní stav modulu  
- podporuje více úrovní (modul → sekce → položky)

---

## 4.3 Formuláře

Formuláře mají jednotný styl:

- titulek  
- popis  
- pole  
- záložky (pokud je více částí)  
- CommonActions dole  

---

# 5. Workflow pravidla

## 5.1 Git workflow

- hlavní větev: `main`  
- feature větve: `feature/<název>`  
- žádné změny přímo do `main`  
- každá změna musí mít:
  - commit message,
  - popis změny v dokumentaci (pokud se týká dokumentace).

## 5.2 Každá úprava musí být zdokumentována

Pokud upravíme:
- modul,
- UI komponentu,
- datový model,
- akce,
- ikonky,
- logiku,

→ musí se to propsat do příslušného `/docs/*.md`.

---

# 6. Naming konvence (názvosloví)

## 6.1 Soubory

- React komponenty: `NázevKomponenty.tsx`
- Formy: `SomethingForm.tsx`
- Tiles: `SomethingTile.tsx`
- Přehledy: `SomethingList.tsx`

## 6.2 Proměnné

- boolean → `isX`, `hasX`, `canX`
- čísla → `countX`, `totalX`
- string → `textX`, `labelX`

## 6.3 Moduly

Názvy modulů začínají číselným prefixem:

```
010-user
020-account
030-subjects
040-properties
050-units
060-tenants
070-contracts
080-payments
090-finance
100-meters
110-documents
120-communication
900-settings
```

---

# 7. Roadmap pravidel (budoucí verze 2)

- přidat pravidla pro testování  
- přidat pravidla pro datové migrace  
- přidat pravidla pro Page/Tile/Form engine  
- sjednotit styl komentářů  
- pravidla pro generování PDF  

---

# 8. Poznámky (nic se nemaže)

- některá pravidla bude třeba doplnit po dokončení CommonActions v2  
- datový standard pro služby bude doplněn později  
- budoucí modul „Integrace“ si vyžádá nové naming konvence  

---

# 9. Závěr

Tento dokument definuje základní i pokročilá pravidla projektu.  
Musí být dodržován, aby byla zajištěna kvalita, konzistence a dlouhodobá udržitelnost aplikace.

