# 03 – UI SYSTEM
*(Finální konsolidovaná verze – aplikace-v6)*

---

## 1. Úvod

UI systém aplikace **Pronajímatel v6** je založen na:

- jednotném layoutu aplikace,
- modulárních UI komponentách,
- striktním oddělení **list / detail / manager** režimů,
- centrálních **CommonActions**,
- minimální duplicitě logiky.

Cílem UI systému je:
- konzistence v celé aplikaci,
- předvídatelné chování pro uživatele,
- snadné rozšiřování o nové moduly,
- jasně definované odpovědnosti UI prvků.

---

## 2. 6-SEKČNÍ LAYOUT

Aplikace je vystavěná na **přísném, neměnném layoutu** složeném ze šesti částí.

### Schéma layoutu

```text
┌───────────────────────────────────────────────────────────────┐
│ 1–2: Sidebar (HomeButton + dynamické moduly)                  │
├──────────────┬───────────────────────────────────────────────┤
│              │ 3: Horní lišta                                 │
│ Sidebar      │    • Breadcrumbs vlevo                         │
│ (left)       │    • HomeActions vpravo                        │
│              ├───────────────────────────────────────────────┤
│              │ 4: CommonActions (globální akce)               │
│              ├───────────────────────────────────────────────┤
│              │ 5: Obsah (Tile / Frame)                        │
│              │    • list nebo detail                          │
│              │    • záložky                                   │
│              │    • formuláře / tabulky                       │
│              ├───────────────────────────────────────────────┤
│              │ 6: Footer / stavová lišta (volitelně)          │
└──────────────┴───────────────────────────────────────────────┘

### Scroll systém v detailu

**Základní princip**: V detailu entity scrolluje **pouze obsah**, zatímco záložky, toolbar a CommonActions zůstávají **fixně viditelné nahoře**.

#### A) Detail entity (formuláře a záložky)

**Aktivace**: Třída `.layout__content--detail-scroll` na `<main>`

**Struktura CSS**:
```
.layout__content--detail-scroll (overflow: hidden)
  └─ .content (flex: 1 1 0, min-height: 0)
      └─ .content__section (flex: 1 1 0, min-height: 0)
          └─ .tile-layout__content (flex container)
              └─ .detail-view (flex: 1 1 0)
                  ├─ .detail-tabs (flex-shrink: 0) ← fixní
                  └─ .detail-view__content (overflow-y: auto) ← scrolluje
```

**Klíčová pravidla**:
1. `.detail-view__content` má `overflow-y: auto` a `flex: 1 1 0`
2. Když obsahuje ListView, musí mít `overflow: hidden` (scroll je uvnitř ListView)
3. `.detail-form` v tomto kontextu musí mít `flex: 1 1 0` pokud obsahuje ListView
4. `.detail-form__section` s ListView musí být flex container (`flex: 1 1 0`)

**Relevantní CSS soubory**:
- `app/styles/components/DetailView.css` - hlavní scroll kontrola
- `app/styles/components/DetailForm.css` - flex propagace pro formuláře
- `app/styles/components/AppShell.css` - layout structure

#### B) ListView v detail tabech

**Princip**: Toolbar + hlavička tabulky **fixní**, scrollují **pouze řádky tabulky**.

**Struktura CSS**:
```
.detail-view__content
  └─ .detail-form (flex: 1 1 0 když má ListView)
      └─ .detail-form__section (flex: 1 1 0 když má ListView)
          └─ .listview (flex: 1 1 0, height: 100%)
              ├─ .listview__toolbar (flex-shrink: 0) ← fixní
              └─ .listview__table-wrapper (overflow: auto) ← scrolluje
                  └─ table (sticky header)
```


**Klíčová pravidla**:
1. `.listview` má `flex: 1 1 0` a `height: 100%` v `.detail-view__content`
2. `.listview__table-wrapper` má `flex: 1 1 0` a `overflow: auto`
3. Toolbar a `<thead>` mají `position: sticky` nebo `flex-shrink: 0`
4. `.detail-view__content:has(.listview)` má `overflow: hidden` (vypne vlastní scroll)

**Relevantní CSS soubory**:
- `app/styles/components/ListView.css` - table scroll kontrola

#### C) ListView v TileLayout
- `.tile-layout__content` je flex container, ListView musí vyplnit výšku.
- `.listview__table-wrapper` v tile nesmí používat viewport-based `max-height`.
- `.listview__table-wrapper` má `flex: 1 1 auto` a malý spodní gap, aby byl vždy vidět horizontální scrollbar.

#### D) Relation detail (vazby entity)

**Princip**: Horní toolbar fixní, obsah vazby (formulář nebo seznam) scrolluje.

**Struktura CSS**:
```
.tile-layout__content (height constraint)
  └─ .relation-pane (grid, height: 100%)
      ├─ .relation-pane__list (200px) ← horní seznam
      └─ .relation-pane__detail (minmax(220px, 1fr))
          └─ .relation-detail (grid, height: 100%)
              ├─ .relation-detail__toolbar (auto) ← fixní
              └─ .relation-detail__content (overflow: auto) ← scrolluje
```

**Klíčová pravidla**:
1. `.relation-pane` má `height: 100%` a `min-height: 0`
2. `.relation-detail` má `height: 100%` a `grid-template-rows: auto 1fr`
3. `.relation-detail__content` má `overflow: auto` a `display: flex; flex-direction: column`
4. Vnořený `.detail-view__content` scrolluje samostatně

**Relevantní CSS soubory**:
- `app/styles/components/Entity.css` - relation pane layout

#### D) Sub-detail záložky (služby, vybavení)

**Princip**: Záložky sub-detailu fixní nahoře, scrolluje pouze obsah záložky.

**Struktura CSS**:
```
.detail-view__content
  └─ .detail-subdetail (flex: 1 1 0)
      ├─ .detail-subdetail__header (flex-shrink: 0) ← fixní
      ├─ .detail-subdetail__tabs (flex-shrink: 0) ← fixní
      └─ .detail-subdetail__content (overflow: auto) ← scrolluje
```

**Klíčová pravidla**:
1. `.detail-subdetail` má `flex: 1 1 0` a `min-height: 0`
2. Header a tabs mají `flex-shrink: 0`
3. Content má `overflow: auto` a obsahuje scrollovatelný wrapper

**Relevantní CSS soubory**:
- `app/styles/components/DetailForm.css` - sub-detail helpers

#### F) Služby & Vybavení – seznam a detail (2026-02)

**Seznam (ListView toolbar)**
- Přepínač **Zobrazit neaktivní** je v toolbaru ListView (vedle filtru a nastavení sloupců).
- Defaultně jsou vidět jen **aktivní** položky.
- Počet v záložce se **řídí aktuálním filtrem** (aktivní vs. neaktivní).

**Aktivita a archivace**
- Aktivita služby se odvozuje z `valid_from`/`valid_to` (a `is_archived`).
- Checkbox ve sloupci **Aktivní** slouží k **archivaci** (ruční), ne k přepnutí platnosti.
- „Neaktivní“ zahrnuje **archivované** i **čekající** (platí od v budoucnu).

**Detail služby**
- Vyhledávání katalogu je dostupné **pouze při vytváření** (create). V read/edit je skryté.
- Read‑only pole **Stav** je pod daty platnosti a zobrazuje: Aktivní / Čekající / Neaktivní / Archivováno.

**Kopie služby**
- Kopie může mít stejný název jako původní, ale **nesmí se časově překrývat** s původní službou.
- Nová (nekopírovaná) služba musí mít **unikátní název** v rámci nemovitosti/jednotky.

#### E) Evidenční list – osoby a služby (2026-02-15)

**Cíl**: konzistentní UI chování v detailu evidenčního listu a správná data v tabulkách.

**Osoby (EvidenceSheetUsersTab)**
- Hlavní nájemník je **vždy započítán**.
- Zobrazení jméno/firma se řídí `subject_type`:
  - `osoba`, `osvc`, `zastupce` → vyplnit **Jméno + Příjmení**, **Název firmy** = `—`.
  - `firma`, `spolek`, `statni` → **Název firmy** = `display_name`, **Jméno/Příjmení** = `—`.
  - `osoba`, `osvc` → **Datum narození** se zobrazuje z `subjects.birth_date`.

**Služby (EvidenceSheetServicesTab)**
- Sloupec **Základní cena** používá `unit_price` z evidenčního listu (ne katalogovou cenu).
- Ukládání služeb pracuje s **celým seznamem** (save nahrazuje všechny řádky).
- Po načtení/uložení se **aktualizuje count** v záložce „Služby“.

**Toolbar (detail služby)**
- **Pořadí akcí je fixní**: předchozí → další → přidat → číst → upravit → uložit → přílohy → zavřít.
- V režimu **read** se zobrazuje jen relevantní subset (read-only).
- V režimu **edit/create** je dostupné Přidat/Upravit/Uložit dle stavu.

**Režim čtení/zápisu (EvidenceSheetModal)**
- `readOnly` se řídí režimem detailu (`vm=read`) nebo archivací.
- V read režimu nejsou dostupné akce Přidat/Upravit.

#### Diagnostika scroll problémů

Pokud scroll nefunguje správně, zkontroluj v DevTools konzoli:

```javascript
// Najdi elementy s overflow: auto/scroll a zjisti, který má scrollHeight > clientHeight
(() => {
  const all = Array.from(document.querySelectorAll('*')).map(el => {
    const style = getComputedStyle(el);
    return {
      el, tag: el.tagName.toLowerCase(), class: el.className,
      overflowY: style.overflowY, h: el.clientHeight, sh: el.scrollHeight,
      hasScroll: /(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight
    };
  });
  
  const withAuto = all.filter(x => /(auto|scroll)/.test(x.overflowY));
  console.table(withAuto.map(x => ({
    tag: x.tag, class: x.class, overflowY: x.overflowY,
    h: x.h, sh: x.sh, hasScroll: x.hasScroll
  })));
})();
```

**Typické problémy**:
- Element má `overflow: auto` ale `scrollHeight === clientHeight` → chybí omezení výšky rodiče
- Parent nemá `flex: 1 1 0` nebo `min-height: 0` → výška se nepropaguje dolů
- Element má `height: auto` místo `flex: 1` → roztáhne se na celý obsah místo containeru

... (soubor pokračuje beze změn až k sekci Přílohy)

### (5) Sekce Přílohy (povinná součást každého detailu)
## 5️⃣ Sekce Přílohy (povinná součást každého detailu)

Sekce **Přílohy** je povinnou součástí každého detailu entity v aplikaci, ale její chování je **striktně rozdělené na 2 režimy**:

1) **Záložka „Přílohy“ v detailu entity** = **READ-ONLY přehled**  
2) **📎 (sponka) v CommonActions** = **samostatný TILE „Správa příloh“** (plná práce s přílohami)

Tímto se zabrání nechtěným změnám v detailu entity a zároveň zůstane plná správa dostupná jednotným způsobem napříč aplikací.

> Detailní specifikace je v `docs/03-ui/attachments.md`.

---

### 5.1 Finální dohoda (UX pravidla)

#### A) Detail entity → záložka „Přílohy“ (READ-ONLY)
Uživatel může:
- vidět seznam příloh (latest verze),
- filtrovat (text),
- zapnout „zobrazit archivované“,
- otevřít soubor (signed URL).

Uživatel **NEMŮŽE**:
- nahrávat nové přílohy,
- přidávat nové verze,
- editovat metadata,
- pracovat s historií verzí,
- archivovat / obnovovat.

#### B) 📎 v CommonActions → „Správa příloh“ (MANAGER TILE)
Uživatel může:
- přidat přílohu (vytvoří dokument + verzi v001 + upload),
- nahrát novou verzi ke stávajícímu dokumentu,
- editovat metadata (název/popisek),
- zobrazit historii verzí,
- zavřít správu a vrátit se do detailu entity.
- nahrávat soubory do max velikosti 50 MB.

#### C) 🔗 v CommonActions → „Vazby“ (RELATIONS VIEW)
Uživatel může:
- otevřít **samostatný content** s vazbami pro vybranou entitu,
- přepínat **taby vazeb** (např. pronajímatel, nemovitost, jednotka…),
- používat **seznam nahoře + detail dole** (RelationListWithDetail),
- přecházet **předchozí / další** v detailu.

Aktuálně podporované moduly:
- Pronajímatel (030)
- Nemovitost (040)
- Jednotky (040)
- Nájemníci (050)

Uživatel **NEMŮŽE**:
- měnit data vazeb přímo z tohoto přehledu (read-only).

---

### 5.2 Základní princip (datový model)
- přílohy jsou řešeny centrálně
- přílohy se **nikdy fyzicky nemažou**
- místo mazání se používá **archivace**
- každá příloha podporuje **verzování**
- soubory jsou v Supabase Storage, DB obsahuje metadata a cesty

---

### 5.3 Dokument × verze dokumentu

**Dokument (logický celek)**  
Dokument představuje jednu přílohu z pohledu uživatele (např. „Nájemní smlouva“, „Fotodokumentace“, „Revizní zpráva“).
- má název a popis
- je navázán na konkrétní entitu (polymorfní vazba)
- může být archivovaný
- neobsahuje samotný soubor

**Verze dokumentu (konkrétní soubor)**  
Verze dokumentu představuje konkrétní nahraný soubor.
- má číslo verze (1, 2, 3, …)
- odkazuje na soubor v úložišti
- starší verze zůstávají zachovány
- aktuální (nejnovější) verze je považována za platnou

---

### 5.4 Chování při nahrávání (probíhá jen ve „Správa příloh“)
**Nová příloha**
- vytvoří se nový dokument
- automaticky se vytvoří verze 1

**Opravený soubor**
- nevzniká nový dokument
- přidá se nová verze ke stávajícímu dokumentu

---

### 5.5 Archivace
- dokumenty ani jejich verze se nikdy nemažou
- archivace znamená pouze označení příznakem „archivováno“
- archivované položky nejsou standardně zobrazovány
- lze je zobrazit přepínačem „Zobrazit archivované“

Pozn.: Archivace/obnova je „write“ operace ⇒ patří do **Správa příloh**, nikoli do read-only záložky v detailu entity.

---

### 5.6 Uložení souborů (Supabase Storage)
- soubory jsou ukládány do Supabase Storage
- používá se centrální bucket: `documents`

Struktura uložení souborů (cesta uvnitř bucketu):
- `{typ-entity}/{id-entity}/{id-dokumentu}/v{verze}/{nazev-souboru}`

Příklad:
- `contract/abc123/def456/v0003/Najemni_smlouva.pdf`

---

### 5.7 Jednotné použití v aplikaci (1 komponenta, 2 režimy)
Používá se jedna core komponenta, která umí 2 režimy:
- `variant="list"`: read-only přehled v detailu entity
- `variant="manager"`: plná správa v samostatném manager tile otevřeném přes 📎

---

### 5.8 Edge-cases (povinné chování)
- **Entita není uložená** (`entityId` neexistuje / `new`): přílohy nejsou dostupné.
- **Archivovaná entita**: manager tile se může otevřít, ale je pouze read-only (dohledání souborů).
- **Read-only role / oprávnění**: manager tile se otevře, ale je pouze read-only.
- **RLS / 401 / 403**: zobrazit srozumitelnou hlášku, žádné request stormy.

---

### 5.9 Stav řešení
- datový model příloh (documents + versions + view latest): hotovo
- read-only záložka „Přílohy“ v detailu entity: implementováno (variant `list`)
- manager tile „Správa příloh“ přes 📎: implementováno (variant `manager`)
- doplnění oprávnění (canManage) + důvod read-only: doporučeno / rozšiřuje edge-cases


### (6) Sekce Systém (technické metadata)
Každá entita má záložku „Systém“, obsahující:

- ID záznamu  
- datum vytvoření  
- datum poslední změny  
- kdo změnu provedl  
- systémové flagy (archivováno, publikováno…)  
- auditní informace (pokud budou implementované)  

---

### (7) Dirty state (neuložené změny)
EntityDetailFrame sleduje změny ve všech DetailView uvnitř.

Funkce:

- upozorní CommonActions, že je třeba uložit  
- zabraňuje opuštění stránky bez upozornění  
- zvýrazní neuložené sekce  
- ukládá stav po tabách (tab-level dirty state)

---

### (8) Role a oprávnění
EntityDetailFrame je řízen oprávněními:

- kdo může vidět detail
- kdo může editovat
- kdo může archivovat
- kdo může nahrávat přílohy
- kdo vidí finanční taby, systémové taby, servisní taby…

Dle role se mohou:

- záložky skrýt  
- sekce zobrazit jako read-only  
- akce deaktivovat  

---

### (9) Použití EntityDetailFrame v RelationListWithDetail

V případě RelationListWithDetail se EntityDetailFrame zobrazuje **v jeho dolní části**.

Rozdíly oproti hlavnímu detailu:

- typicky **readonly**  
- CommonActions se nezobrazují  
- stále obsahuje záložky a DetailView  
- používá se k rychlému náhledu související entity  
- plná editace probíhá v její vlastní hlavní záložce

---

## 3.9.3 Souhrn funkcí EntityDetailFrame

| Funkce | Hlavní detail | RelationList (dolní část) |
|--------|----------------|----------------------------|
| Editace | Ano | Obvykle ne (readonly) |
| CommonActions | Ano | Ne |
| Záložky | Ano | Ano |
| Přílohy | Ano | Ano |
| Systém | Ano | Ano |
| Dirty state | Ano | Ne |
| Oprávnění | Ano | Ano (jen read-only) |

---

# 3.10 DetailView – obsahová vrstva detailu entity

**DetailView** je obsahová komponenta, která zobrazuje konkrétní sekci (tab) detailu
jedné entity. Slouží jako vykreslovací vrstva formuláře nebo jiného obsahu sekce
a pracuje na základě definice dodané modulem (form schema).

DetailView vykresluje:
- formulářová pole (inputy, selecty, multiselecty…)
- read-only hodnoty
- validační hlášky
- stav dirty (neuložené změny)
- povinné modulové sekce (Přílohy, Historie, Systém)

DetailView samotný **neobsahuje hlavičku** ani **tlačítka CommonActions** – to je součást EntityDetailFrame.

---

## 3.10.1 Účel DetailView

DetailView zajišťuje:

- vykreslení správného obsahu aktivní sekce
- správu hodnot polí
- validace
- komunikaci dirty stavu s EntityDetailFrame
- skrývání/uzamykání polí podle role
- dynamickou logiku podle stavu entity

Neřeší přepínání tabs, neobsahuje seznamy (RelationList), neřídí akce jako „uložit“ – jen vykresluje obsah.

---

## 3.10.2 Co DetailView není

DetailView **není**:

- hlavička detailu entity  
- navigace mezi sekcemi  
- CommonActions  
- seznam vazeb (RelationListWithDetail)  
- kontrola oprávnění na úrovni celé entity  

DetailView řeší pouze obsah jedné sekce.

---

## 3.10.3 Definice formuláře (Form Schema)

Každý modul definuje svůj vlastní formulář (schema), kde určuje:

- seznam sekcí
- název sekce
- pole v sekci
- typy polí (text, select, checkbox…)
- validace
- viditelnost a role
- read-only logiku

**📖 Detailní dokumentace layoutu formulářů:** `docs/03-ui/forms-layout.md`

Příklad (bez syntaxi zvýraznění, aby se dokument nerozpadal):
{
id: "property-detail",
sections: [
{
id: "basic",
label: "Základní údaje",
fields: [
{ id: "name", type: "text", label: "Název nemovitosti", required: true },
{ id: "type", type: "select", label: "Typ", source: "property_types" },
{ id: "description", type: "textarea", label: "Popis" }
]
},
{
id: "address",
label: "Adresa",
fields: [
{ id: "street", type: "text", label: "Ulice" },
{ id: "city", type: "text", label: "Město" }
]
}
]
}


DetailView si z aktivní sekce načte její pole a vykreslí je.

---

## 3.10.4 Práce se sekcemi (tabs)

DetailView zobrazuje **pouze jednu aktivní sekci**.

EntityDetailFrame:
- přepíná sekce
- předává aktivní sekci do DetailView
- řídí role a viditelnost sekcí

V jedné sekci může být:
- formulář
- read-only informace
- tabulka
- komponenta Příloh
- komponenta Historie
- komponenta Systém

Sekce mohou být dynamické a mohou obsahovat vlastní logiku.

DetailTabs podporuje jednotný zápis počtů v záložkách:
- `DetailTabItem.count` → label se automaticky zobrazí jako „{label} (count)“.
- v DetailView lze počty předat přes `ctx.sectionCounts` (mapa `sectionId → count`).

---

## 3.10.5 Renderování polí

DetailView vykresluje pole podle typu:

- text
- textarea
- číslo
- email, telefon
- select
- multiselect
- checkbox (boolean)
- lookup (FK)
- měnové pole
- jednotkové pole (m², Kč…)
- vlastní komponenty z modulu

Každé pole má:
- label
- hodnotu
- povinné / nepovinné
- chyby validace
- viditelnost
- readonly / disabled stav

---

## 3.10.6 Dirty state (neuložené změny)

DetailView sleduje změny hodnot a:

- označuje sekci jako dirty
- upozorňuje EntityDetailFrame
- aktivuje tlačítka CommonActions (např. Uložit)
- hlídá, aby uživatel neztratil data při přepnutí sekce

Dirty state může být:
- pole → sekce → celá entita

---

## 3.10.7 Read-only režim

DetailView má dva režimy:

### ✔ Edit mode  
Používá se v hlavním detailu entity.
- pole jsou editovatelná
- dirty state aktivní
- validace aktivní

### ✔ Read-only mode  
Používá se v RelationListWithDetail (dolní část).
- pole nelze měnit
- slouží jako přehled
- CommonActions se nezobrazuje

---

## 3.10.8 Sekce „Přílohy“ (povinná součást každého modulu)

Každý modul musí mít sekci **Přílohy**.

Funkce:
- přidat přílohu
- drag & drop
- automatické přejmenování
- popis přílohy
- archivovat / obnovit
- zobrazit archivované
- stav nahrávání
- možnost více souborů

Poznámky k seznamu:
- seznam příloh zobrazuje sloupce **Typ entity** a **Entita**
- typy entit lze filtrovat pomocí checkboxů

Přílohy patří **jen k této entitě**.  
Nejde o globální modul dokumentů.

---

## 3.10.9 Sekce „Historie“

Zobrazí auditní a systémové informace:

- datum vytvoření
- datum poslední změny
- kdo změnu provedl
- změnové logy (pokud budou aktivní)

Sekce je vždy readonly.

---

## 3.10.10 Sekce „Systém“

Poslední sekce každého detailu.

Obsahuje:

- ID záznamu
- UUID
- stav archivace
- datum vytvoření
- datum poslední změny
- interní metadata

Vždy readonly.

---

## 3.10.11 Role a oprávnění

DetailView umí:

- skrýt celou sekci podle role
- zamknout pole
- zobrazit pole jen pro čtení
- povolit / zakázat nahrávání příloh
- zobrazit pouze relevantní sekce (např. Finance jen pro roli “finance”)

Role se aplikují na:
- sekce  
- pole  
- akce (přílohy, archivace, úpravy…)

---

## 3.10.12 Chování v různých kontextech

### A) Hlavní detail entity
- plná editace
- CommonActions viditelné
- dirty state aktivní
- validace aktivní

### B) RelationListWithDetail (dolní část)
- read-only
- žádné CommonActions
- sekce mohou být přepínány

### C) Nový záznam
- prázdný formulář
- validace při ukládání
- logika výchozích hodnot

---

## 3.10.13 Shrnutí

DetailView je univerzální obsahová vrstva pro jeden tab detailu entity.

| Funkce | Ano/Ne |
|--------|--------|
| Přepínání sekcí | Ne |
| Vykreslení obsahu sekce | Ano |
| Dirty state | Ano |
| Read-only režim | Ano |
| Edit režim | Ano |
| Přílohy | Ano (povinné) |
| Historie | Ano |
| Systém | Ano |
| Role a oprávnění | Ano |
| CommonActions | Ne (řeší EntityDetailFrame) |

DetailView poskytuje jednotné zobrazení obsahu sekce pro všechny entity a moduly v systému.



---

# 3.11 EntityList – základní tabulková komponenta

**EntityList** je nízkoúrovňová tabulková komponenta, která zobrazuje řádky a sloupce
bez jakékoli „nadstavby“ (filtry, akce, archivace, oprávnění…).  
Je to čistý vizuální a interakční prvek používaný:

- v horní části **RelationListWithDetail**
- uvnitř **ListView**, kde je obalen filtrem, řazením, CommonActions atd.
- v některých případech i samostatně (malé seznamy, výběry, lookup okna)

EntityList řeší pouze **zobrazení tabulky a práci s výběrem řádku**.

Veškerá logika okolo něj (filtrace, řazení, oprávnění, akce) je řízena vyššími komponentami.

---

## 3.11.1 Účel EntityList

EntityList zajišťuje:

- vykreslení řádků a sloupců
- zvýraznění aktivního řádku
- klik pro výběr řádku
- dvojklik pro otevření detailu (pokud je povoleno)
- jednoduchou vizuální prezentaci dat
- podporu dynamického generování sloupců podle modulu
- responzivní layout pro tabulku

Není zodpovědný za filtrování, řazení ani oprávnění — to zajišťují nadřazené komponenty (ListView, RelationListWithDetail).

---

## 3.11.2 Co EntityList není

EntityList **neobsahuje**:

- filtr  
- Checkbox „Zobrazit archivované“  
- CommonActions  
- řazení sloupců  
- role a oprávnění  
- API logiku  
- žádné CRUD akce  
- žádné modální okna  
- stránkování (paging)  

EntityList vše pouze **vykreslí**.

---

## 3.11.3 Struktura EntityList

EntityList má tři základní části:

### (1) Hlavička tabulky (columns)
Definována modulem.

Obsahuje:

- label sloupce
- šířku (min/max)
- zarovnání
- formátování (měna, číslo, datum…)
- ikonu (např. stav, typ)
- volitelné tooltipy

### (2) Tělo tabulky (rows)
Každý řádek:

- obsahuje hodnoty relevantní pro sloupce
- může mít specifický vizuální styl (archivované, aktivní, zvýrazněné)

### (3) Interakce
EntityList podporuje:

- **klik** pro výběr řádku
- **dvojklik** pro otevření detailu
- **keyboard navigation** (↑ ↓)
- zvýraznění vybraného řádku
- hover efekty

---

## 3.11.4 Výběr řádku

EntityList je **single-selection** komponenta:

- vždy je vybraný 0 nebo 1 řádek
- po kliknutí se řádek zvýrazní
- výběr se předává rodiči:
  - ListView  
  - RelationListWithDetail  

Vybraný řádek určuje:

- který detail se zobrazí dole (v RelationListWithDetail)
- které akce v CommonActions se povolí nebo zakážou (v ListView)

---

## 3.11.5 Definice sloupců (Column Definition)

Sloupce definuje modul.

Příklad struktury:
[
{ id: "name", label: "Název", type: "text" },
{ id: "type_label", label: "Typ", type: "badge" },
{ id: "city", label: "Město", type: "text" },
{ id: "rent", label: "Nájem", type: "currency" }
]

Možné typy vykreslení:

- text  
- číslo  
- měna  
- datum  
- badge (typ entity, stav, role…)  
- ikonka  
- boolean (✓ / —)  
- formátovaná hodnota (např. `35 m²`, `9000 Kč`)  

Sloupce mohou být:

- skryté (ListView má ColumnPicker, EntityList ne)  
- dynamicky generované podle modulu nebo definice  

---

## 3.11.6 Chování při velkém množství dat

EntityList je optimalizovaný pro:

- scrollovací režim (virtuální scroll možnost v budoucnu)
- automatické přizpůsobení šířky sloupců
- sticky header (hlavička viditelná při scrollu)
- lazy rendering

Paging (stránkování) řeší vyšší vrstva, ne EntityList.

---

## 3.11.7 Použití v různých kontextech

### Kontext A: ListView (hlavní seznam)
EntityList je obalen:

- filtrem (vlevo)
- archivovanými (vpravo)
- řazením (ListView řídí pořadí)
- CommonActions (bez nastavení sloupců)
- ColumnPicker (ikona sloupců je v tabulce hned za hledáním)

Pozn.: U vazeb **služeb a vybavení** v detailu nemovitosti/jednotky se archivace provádí
přímo v tabulce přes checkbox ve sloupci „Aktivní“ a archivované položky se v seznamu nezobrazují.

Pozn.: Záložka **Jednotky** v detailu nemovitosti používá stejný ListView jako přehled jednotek
(vyhledávání, sloupce, archivace). Detail vybrané jednotky je zde pouze read-only bez dalších záložek;
editace se dělá v přehledu jednotek.

EntityList zde vykresluje pouze tabulku.

---

### Kontext B: RelationListWithDetail (horní část)
EntityList zde slouží jako:

- seznam vazeb k entitě
- navigátor mezi záznamy
- zdroj pro výběr, který určuje, který detail se zobrazí dole

Například:

- Nemovitost → Jednotky  
  nahoře EntityList (jednotky), dole detail jednotky  
- Smlouva → Platby  
  nahoře EntityList (platby), dole detail platby  

---

### Kontext C: Mini-seznamy, lookup okna
EntityList lze použít jako:

- jednoduchý seznam k výběru položky
- malý seznam uvnitř jiných komponent
- seznam bez interakcí jako read-only výpis

---

## 3.11.8 Styly a vizuální chování

EntityList má jednotný styl napříč systémem:

- zvýraznění aktivního řádku
- hover efekt
- světlejší styl u archivovaných záznamů
- stejné fonty a spacing jako celý UI systém
- stejná výška řádku (row height)
- jednotné barvy badge / stavů dle design systému

---

## 3.11.9 Výkresová logika (rendering)

EntityList řeší:

- vykreslení buněk  
- formátování hodnot (měna, jednotky, datum)  
- badge komponenty (stav, typ…)  
- optimalizované překreslování  
- klávesové ovládání  
- přizpůsobení layoutu na menších monitorech  

Nevykresluje:

- akce  
- inputy  
- formuláře  
- filtry  

---

## 3.11.10 Architektura odpovědností

| Funkce | EntityList | ListView | RelationListWithDetail | EntityDetailFrame |
|--------|------------|----------|--------------------------|--------------------|
| Tabulka řádků | ✔ | ✔ | ✔ | ✖ |
| Filtry | ✖ | ✔ | ✖ | ✖ |
| Řazení | ✖ (jen UI) | ✔ | ✖ | ✖ |
| Výběr řádku | ✔ | ✔ | ✔ | ✖ |
| Dvojklik pro detail | ✔ | ✔ | ✖ | ✖ |
| Oprávnění | ✖ | ✔ | ✔ | ✔ |
| Dirty state | ✖ | ✖ | ✖ | ✔ |
| Detail entity | ✖ | ✖ | ✔ (Dolní část) | ✔ |

---

## 3.11.11 Shrnutí

**EntityList = čistá tabulka.**

Dělá:

- vykreslení řádků a sloupců  
- výběr řádku  
- dvojklik pro otevření detailu  
- formátování hodnot  

Nedělá:

- filtry  
- řazení  
- oprávnění  
- akce  
- přílohy  
- historii  
- přepínání sekcí  

EntityList je základní stavební prvek všech seznamů v aplikaci.  
Většina pokročilé logiky je v ListView nebo RelationListWithDetail.



---

# 3.12 ConfigListWithForm – (nahrazeno generictypetile)

---

# 3.13 ColumnPicker – výběr viditelných sloupců v seznamech

**ColumnPicker** je uživatelská funkce, která umožňuje každému uživateli nastavit,
které sloupce chce v daném seznamu vidět.  
Řeší se tím problém „každý potřebuje vidět něco jiného“ a zároveň chceme zachovat
jeden společný technický seznam.

ColumnPicker se používá nad **ListView** (hlavní přehledy a seznamy ve vazbách),
aby si uživatel mohl nastavit pořadí a viditelnost sloupců.
Pro sdílené tabulky (např. katalog ↔ vazby) používej sdílené list configy se stejným `VIEW_KEY`
(`serviceCatalogListConfig`, `equipmentCatalogListConfig`). Zaručí stejné sloupce, pořadí a šířky.
nikoliv uvnitř nízkoúrovňové komponenty EntityList.

---

## 3.13.1 Kde se ColumnPicker používá

ColumnPicker se používá:

- v hlavních přehledech (ListView) v modulech a tiles:
  - např. Seznam subjektů, Seznam nemovitostí, Seznam jednotek, Seznam smluv, Seznam plateb
- v horních seznamech RelationListWithDetail, kde dává smysl, aby si uživatel
  mohl přizpůsobit sloupce (např. seznam jednotek u nemovitosti, seznam smluv u nájemníka)

Používá se tedy **per seznam**, což v praxi znamená:

- per modul
- per tile (konkrétní seznam v modulu)
- per typ vazby (u RelationListWithDetail)
- per uživatel

EntityList o existenci ColumnPickeru „neví“ – jen vykresluje sloupce, které mu ListView předá.

---

## 3.13.2 Účel ColumnPickeru

ColumnPicker umožňuje:

- skrýt nepodstatné sloupce
- přidat další sloupce, které jsou dostupné, ale defaultně skryté
- zmenšit šířku tabulky na menších monitorech
- přizpůsobit si seznam podle typu práce (např. jiný pohled pro finance, jiný pro servis)

Cílem je:

- nezahltit začátečníka
- umožnit pokročilému uživateli vidět víc informací
- ušetřit horizontální scroll

---

## 3.13.3 Vazba na ListView a EntityList

Architektura:

- **ListView**:
  - zná všechny „dostupné“ sloupce daného seznamu
  - podle konfigurace (modul, tile, vazba, uživatel) rozhodne, které z nich jsou:
    - viditelné
    - skryté
    - povinné (nejdou skrýt)
  - při vykreslení předává výsledný seznam sloupců do EntityList

- **EntityList**:
  - vůbec neřeší, které sloupce jsou viditelné
  - vykreslí přesně to, co dostane v konfiguraci od ListView

ColumnPicker tedy patří do ListView (a do „mini-ListView“ v horní části RelationListWithDetail),
nikoli do EntityList.

---

## 3.13.4 Konfigurace ColumnPickeru

Logika ukládání:

- pro každého uživatele se ukládá jeho nastavení zvlášť
- klíč konfigurace je kombinace:
  - user_id
  - module_id
  - tile_id (nebo identifikátor seznamu ve vazbě)

Každý sloupec má:

- interní ID
- název (label)
- info, zda je:
  - povinný (musí být vždy vidět)
  - volitelný (uživatel jej může zapnout/vypnout)
- defaultní stav (zda je u nového uživatele zapnutý)

Typická pravidla:

- povinné sloupce (např. „Název“, „Typ“, „Stav“) nejdou skrýt
- volitelné sloupce (např. „Poznámka“, „Kód“, „Vytvořil“) může uživatel vypnout
- pro některé role mohou být určité sloupce **zakázané** (např. finanční údaje)

---

## 3.13.5 Uživatelské chování

Uživatel:

1. otevře seznam (ListView)
2. klikne na ovládací prvek ColumnPickeru (např. ikona „sloupečky“)
3. zobrazí se panel s:
   - seznamem všech dostupných sloupců
   - checkboxy (Zobrazit / Skrýt)
   - případně upozorněním, které sloupce jsou povinné

Při potvrzení:

- ListView uloží konfiguraci pro daného uživatele
- obnoví vykreslení EntityList jen s vybranými sloupci
- nastavení se použije při příštím otevření seznamu

---

## 3.13.6 Rozdíl mezi ColumnPickerem pro hlavní seznam a pro vazby

**Hlavní seznam (ListView v modulu):**

- typicky obsahuje více sloupců (např. 8–20)
- ColumnPicker má větší smysl – pro různé role, pracovní postupy
- konfigurace:
  - modul = např. 020-nemovitosti
  - tile = „property-list“

**Seznam ve vazbě (RelationListWithDetail – horní část):**

- obvykle obsahuje méně sloupců (3–8)
- ColumnPicker lze použít, pokud dává smysl (např. jednotky, smlouvy, platby)
- konfigurace:
  - modul = např. 020-nemovitosti
  - tile = „property-units-relation-list“

Z pohledu architektury jde pořád o ListView s vlastní identitou, jen zobrazený v horní části RelationListWithDetail.

---

## 3.13.7 Role a oprávnění

ColumnPicker respektuje oprávnění:

- některé sloupce může systém úplně skrýt (uživatel o nich neví)
- některé sloupce vidí jen určité role (např. finance)
- některé sloupce jsou vždy povinné a nelze je odškrtnout
- pro některé role může být ColumnPicker úplně vypnutý
  (uživatel má pevně daný pohled bez možnosti přizpůsobení)

Oprávnění se definují:

- na úrovni modulu
- případně jemněji na úrovni sloupců

---

## 3.13.8 UI chování a UX

Zásady:

- ColumnPicker by měl být snadno dostupný, ale ne rušivý
- změna viditelnosti sloupců by měla být okamžitě vidět
- uživatel musí mít možnost:
  - rychle resetovat na výchozí nastavení
  - pochopit, proč některé sloupce nejdou vypnout (povinné)
- na menších displejích pomáhá ColumnPicker schovat málo používané sloupce a snížit scroll

---

## 3.13.9 Shrnutí

- ColumnPicker je funkce pro **ListView** (hlavní seznamy + seznamy ve vazbách).
- EntityList je jen tabulka – neobsahuje logiku ColumnPickeru.
- Nastavení ColumnPickeru je:
  - per uživatel
  - per modul
  - per tile/seznam
- Sloupce mohou být:
  - povinné
  - volitelné
  - skryté podle role
- Cílem je umožnit uživateli přizpůsobit si přehledy bez měnění backendu a bez zásahu do kódu.

ColumnPicker je tak důležitým prvkem komfortu a použitelnosti všech seznamů v aplikaci.


---

# 4. IKONOGRAFIE

Všechny ikony jsou řešeny funkcí:

```
getIcon(name)
```

Ikony byly standardizované a odstraněny “oválné pozadí” z dřívějších verzí.

Výhody:

- jednotný vzhled  
- snadná výměna knihovny ikon  
- snadné přidání vlastních ikon  

---

# 5. BARVY A TÉMATA

Používáme systém:

- světle šedý základ  
- pastelové barvy pro typy  
- jednotné barvy pro akce (add, edit, delete, archive…)  

Plán:

- světle / tmavé téma (dark mode)  
- možné rozšíření na témata podle nájemníků, objektů atd.  

---

# 6. STAVY UI A INTERAKCE

## 6.1 Active state
Každý kliknutelný prvek musí mít:

- hover  
- active  
- focus  

## 6.2 Disabled state
UI nesmí dovolit:

- klik na tlačítko pro uživatele bez oprávnění  
- odeslat prázdný formulář  
- otevřít modul při chybějící roli  

## 6.3 Dirty state
Formuláře musí:

- označit “neuložené změny”  
- deaktivovat určité akce  
- umožnit `saveAndClose`  
- umožnit validaci před uložením  

---

# 7. TOASTERY & MODAL WINDOWS (PLÁN)

### Toastery:
- potvrzení akce  
- upozornění na chyby  
- informační hlášky  

### Modaly:
- potvrzení mazání  
- výběr položky  
- detailní podformuláře  

---

# 8. RESPONSIVE DESIGN

Aplikace bude responzivní:

- Sidebar se skryje  
- Breadcrumbs se zjednoduší  
- CommonActions se mohou přesunout do dropdownu  
- Content se přizpůsobí výšce  
- Formuláře se skládaní jinak  

---

# 9. ZÁVĚR

UI systém v této verzi definuje:

- striktní layout  
- komponenty  
- chování  
- budoucí rozšiřování  

Slouží jako základ pro celé UX aplikace Pronajímatel v6.

---

*Konec BLOKU A – finální čistá verze dokumentu 03*
---

# 📜 Historické části dokumentu (UI systém – zachováno, ale zastaralé)

Níže jsou uvedeny původní texty a nedokončené koncepty týkající se UI, které byly během vývoje vytvořeny, ale již nejsou aktuální.  
Jsou označeny jako ~~zastaralé~~, ale NESMÍ BÝT SMAZÁNY.

---

### ~~Původní hrubý popis 6-sekčního layoutu~~

~~Sidebar bude obsahovat HomeButton a nějaké akce.  
Horní lišta bude mít texty nebo možná ikony.  
CommonActions jsme zatím nevyřešili.~~  

~~Tento popis byl nahrazen plnohodnotnou specifikací v sekci „6-sekční layout“.~~

---

### ~~Staré rozdělení UI dle PREHLED-APLIKACE~~

~~“V aplikaci budou nějaké přehledy a nějaké formuláře a možná bude potřeba přidat stavové ikony.”~~

~~Toto bylo příliš vágní, proto bylo přepracováno do sekcí UI Components a Content Engine.~~

---

### ~~Původní popis Sidebaru (z doby před dynamickými moduly)~~

~~Sidebar bude statický:  
- Domů  
- Nemovitosti  
- Jednotky  
- Smlouvy~~

~~Tento koncept byl opuštěn. Dnes Sidebar načítá vše dynamicky z module.config.js.~~

---

### ~~Alternativní koncept víceúrovňového Sidebaru~~

~~Sidebar Level 1: Moduly  
Sidebar Level 2: Typy  
Sidebar Level 3: Položky~~

~~Byl nahrazen moderním konceptem modul → sekce → detail.~~

---

### ~~Původní detailní popis HomeActions~~

~~HomeActions budou mít tlačítko “Profil”, “Vyhledávání”, “Notifikace” a možná tam přidáme i nějaké nastavení nebo ikonku zvonečku.~~

~~Toto bylo nahrazeno finální verzí se strukturou sessionName + logout + placeholdery (search, notifications).~~

---

### ~~Testovací prototyp Breadcrumbs~~

~~Breadcrumbs budou možná jednoduché:  
Dashboard / Modul~~

~~Nebyl v nich plán na více úrovní.  
Dnes máme koncept až 4 úrovní – viz sekce “Breadcrumbs”.~~

---

### ~~Starý popis CommonActions (před zavedením dynamiky)~~

~~Akce budou v každém formuláři ručně přidané.  
Příklad: [Uložit] [Zavřít] [Smazat]~~

~~Tento přístup byl zcela opuštěn. CommonActions jsou nyní centrální UI prvek.~~

---

### ~~Historická poznámka o barvách~~

~~Zkusíme použít modrou, zelenou a nějakou žlutou. Nebo pastelové barvy.~~

~~Tento náhodný výběr byl nahrazen definovaným barevným systémem.~~

---

### ~~Nedokončený seznam typů polí~~

~~Text, číslo, select, multiselect, boolean, date, nějaké další…~~  
~~Později byl seznam upřesněn a doplněn o specifikaci validace a chování v UI.~~

---

### ~~Původní návrh responzivního UI~~

~~V mobilu možná vypneme Sidebar úplně. Nebo ho dáme nahoru. Nebo do modalu.~~

~~Dnes máme přesné pravidlo: Sidebar se skrývá a nahrazuje hamburger menu.~~

---

### ~~Návrh “teoretického” layoutu pro tablet, který nebyl použit~~

```
Sidebar (left)
Topbar (top)
Actions (right)
Content (center)
```

~~Nebyl použit kvůli složitému zarovnání a nekonzistentnímu UX.~~

---

### ~~Staré návrhy ikon~~

~~Používali jsme různé sady ikon, některé měly barevné pozadí nebo oválné tvary.~~

~~Dnes máme jednotný systém getIcon(name) bez pozadí.~~

---

# 📌 Konec archivních historických částí pro dokument 03 UI.

---

## DOPLNĚNÍ (2025-12-12) – Menu režimy, ikony a jednotná kostra layoutu

### 1) Kostra UI (6 bloků layoutu)
Aplikace se skládá z 6 hlavních bloků, které musí zůstat konzistentní bez ohledu na theme nebo režim menu:

1. **HomeButton** – návrat na „domů“ (dashboard)
2. **Menu** – buď Sidebar, nebo TopMenu (viz níže)
3. **Breadcrumbs** – orientace (modul → sekce → tile / detail)
4. **HomeActions** – pravý horní panel (globální akce uživatele)
5. **CommonActions** – kontextové akce (seznam/detail – např. uložit, přidat, smazat)
6. **Content** – hlavní obsah (seznamy, detaily, tiles, dashboard)

Pozn.: Implementační „zdroj pravdy“ pro skládání těchto bloků je `app/AppShell.tsx`.

---

### 2) Režim menu: Sidebar vs TopMenu
Menu má dva režimy zobrazení, ale musí používat **stejná data** (moduly/sekce/tiles) a liší se pouze rendererem:

- **Sidebar režim**
  - klasické levé menu (moduly + sekce + tiles)
  - vhodné pro detailní práci a hlubší hierarchii

- **TopMenu režim**
  - modulová lišta nahoře (nad standardními actions)
  - vhodné pro rychlé přepínání modulů
  - sekce/tiles se mohou zobrazovat odlišně (dle implementace), ale zdroj dat musí být shodný

**Pravidlo:** Sidebar a TopMenu nesmí mít „vlastní“ logiku ikon, labelů nebo enabled stavů – pouze renderují společný model.

---

### 3) Režim ikon: icons vs text
Aplikace podporuje minimálně tyto režimy zobrazení v navigaci (a případně i v akcích):

- **icons** – zobrazovat ikony + text (kde to dává smysl)
- **text** – preferovat text, ikony se mohou skrýt (nebo minimalizovat)

**Pravidlo:** Pokud je aktivní režim `text`, menu (Sidebar/TopMenu) nesmí „náhodně“ zobrazovat ikony jen někde. Rozhodnutí o zobrazení ikon musí být konzistentní.

Doporučení: rozhodnutí „zobrazit ikony“ se vyhodnocuje v jednom místě (typicky v AppShell) a předává se rendererům jako boolean (např. `showIcons`).

---

### 4) Třídy na `.layout` (theme/accent/menu/icons)
Aktuální vzhled se promítá do className na root kontejneru `.layout`, aby CSS mohlo jednotně stylovat UI.
Typicky se zde promítají:
- `theme-*` (světlý/tmavý/auto varianty dle projektu)
- `accent-*` (barevný akcent)
- `icons-mode-*` (icons/text)
- `layout--topmenu` apod. (režim menu)

**Pravidlo:** Třídy se skládají na jednom místě a CSS se opírá primárně o tyto třídy + CSS proměnné.

---

### 5) Kontrolní checklist (pro ladění)
Pokud se objeví nekonzistence (např. ikony vidět v Sidebaru, ale ne v TopMenu), ověř:
1) zda oba renderery dostávají stejný model dat (moduly/ikony/labely/enabled)
2) zda rozhodnutí `showIcons` není vyhodnocené rozdílně v různých místech
3) zda CSS pro topmenu režim nepřepisuje styly ikon (např. `display:none`, barvy v dark mode, apod.)

---

## DOPLNĚNÍ (2025-12-12) – Tok UI nastavení, layout třídy a debug

### 1) Tok UI nastavení (source → aplikace)
UI nastavení se v aplikaci aplikuje jednotným tokem:

1. **Default hodnoty** – výchozí UI config (definované v kódu)
2. **Perzistence** – uživatelské nastavení uložené v `localStorage`
3. **Kombinace** – výsledný `uiConfig` = defaulty přepsané hodnotami z `localStorage`
4. **Aplikace tříd** – `AppShell.tsx` složí `className` na root `.layout`
5. **Styly** – `globals.css` a `app/styles/**` používají:
   - CSS proměnné (tokens)
   - selektory přes `.layout` třídy (theme/accent/menu/icons)

**Pravidlo:** rozhodnutí o režimech (menu / icons / theme / accent) se vyhodnocuje centrálně a renderery (Sidebar/TopMenu/Actions) dostávají jednotný výsledek (např. `showIcons`).

---

### 2) Standardní layout třídy (na `.layout`)
Root kontejner `.layout` může nést kombinaci tříd, které řídí vzhled a rozložení.
Doporučený minimální set (dle aktuální implementace projektu):

- `theme-light` / `theme-dark` / `theme-auto` (dle projektu)
- `accent-neutral` / `accent-purple` / … (dle presetů)
- `icons-mode-icons` / `icons-mode-text`
- `layout--sidebar` / `layout--topmenu` (nebo ekvivalent dle kódu)

Pozn.: Konkrétní názvy tříd musí být jednotné napříč kódem i CSS. Pokud existuje historický název, přidat sem poznámku „legacy“.

---

### 3) Debug – rychlé konzolové příkazy
Pro rychlé ověření, co je aktuálně aplikováno:

**A) Jaké třídy má layout**
```js
document.querySelector('.layout')?.className
**B) Jaké CSS proměnné jsou aktuálně použité (výběr)
const el = document.querySelector('.layout')
el && getComputedStyle(el).getPropertyValue('--color-text')
**C) Který CSS soubor/selektor přepisuje problémový styl
- použij DevTools → Inspect → Computed → najdi vlastnost → rozklikni „kde je definovaná“
- pokud je problém s tmavým režimem: ověř selektory pod .theme-dark ...

### 4) Pravidla pro přidání nové UI volby (aby se to nerozjelo)
Když přidáme novou UI volbu (např. nový režim menu nebo nový akcent), musí být splněno:
1. Typy + default v centrálním UI configu (kód)
2. Uložení/načtení z localStorage (pokud je to user preference)
3. Aplikace tříd v AppShell.tsx (nebo jiném centrálním místě)
4. CSS podpora v globals.css / app/styles/**
5. Doplnění dokumentace:
- UI-specifikace.md (co to je a jak se to chová)
- 03-ui-system.md (tok + třídy)
- případně stav-struktury.md (kde to v kódu je)

# UI Layout – TopMenu režim a CommonActions bar

Tento dokument popisuje chování a pravidla pro rozložení aplikace v režimu **TopMenu** (`.layout--topmenu`) a související úpravy vzhledu (theme) pro **TopMenu** a jeho **popover**.

> Cíl: V režimu TopMenu mít **jasně oddělené řádky** (navigace vs akce) a zajistit **správné chování šířky** bez “utíkání za roh”, při zachování funkčního popoveru a čitelnosti v dark theme.

---

## Základní pojmy

- **Topbar** = horní řádek se stavem aplikace (breadcrumbs, HomeActions, atd.)
- **Nav řádek** = řádek s TopMenu (moduly/sekce/tiles)
- **Context řádek** = řádek s CommonActions (akce pro aktuální kontext)
- **Content** = hlavní obsah (ListView / DetailView / atd.)

---

## Pravidla rozložení v TopMenu režimu

### 1) Aktivace režimu
Režim TopMenu je aktivní, pokud má root layout třídu:

- `.layout--topmenu`

### 2) Struktura řádků
V režimu TopMenu je layout **jednosloupcový** a má **4 řádky**:

1. `layout__topbar`
2. `layout__nav` (TopMenu)
3. `layout__context` (CommonActions)
4. `layout__content`

**Důvod:** Navigace a kontextové akce musí být vizuálně oddělené, aby se nemíchaly do jednoho řádku a nevznikal “přetlak” v horní liště.

### 3) Grid a šířka (zásadní pravidlo)
V TopMenu režimu musí být layout omezen na šířku viewportu a nesmí se roztahovat podle obsahu.

Používáme:

- `grid-template-columns: minmax(0, 1fr)`

**Důvod:** Bez `minmax(0, 1fr)` může grid “nafouknout” sloupec podle obsahu (typicky Topbar/TopMenu), což vede k tomu, že UI prvky “utečou za roh” a kvůli `overflow: hidden` nejsou vidět, i když stránka globálně nemá horizontální overflow.

---

## Pravidla pro TopMenu scroll a popover

### 1) Horizontální scroll menu
- Scroll se řeší **pouze** na seznamu položek TopMenu (typicky `.topmenu__list`)
- Root `.topmenu` musí zůstat:

- `overflow: visible`

**Důvod:** Popover (rozbalovací menu) je absolutně pozicované a nesmí být “oříznuté” rodičem.

### 2) Viditelnost scrollbaru
V některých prostředích může být scrollbar “overlay” nebo málo viditelný. Pro TopMenu platí:

- scrollbar má být **viditelný** alespoň v TopMenu řádku
- použít theme tokeny pro thumb/track (viz dále)

---

## Theme pravidla pro TopMenu (čitelnost v dark)

### 1) Barvy textu v TopMenu
TopMenu musí používat theme tokeny pro text, aby nezmizelo v dark theme:

- `.topmenu` dědí `color` z `--color-text`
- `.topmenu__button` explicitně používá `--color-text`
- doplňkové prvky (např. chevron) používají `--color-text-muted` (nebo fallback na `--color-text`)

**Důvod:** Defaultní barvy (implicitní nebo hardcoded) v dark režimu často vedou k “tmavý text na tmavém pozadí”.

### 2) Popover podle theme
Popover nesmí být “natvrdo světlý”. Musí používat theme tokeny:

- pozadí: `--color-surface`
- okraj: `--color-border`
- text: `--color-text`
- hover: `--color-surface-subtle`
- active: `--color-selected-row-bg`

**Důvod:** Popover je součástí navigace a musí ladit se všemi theme preset variantami.

---

## CommonActions řádek (Context) – vizuální rytmus

### 1) Samostatný řádek
`CommonActions` se v TopMenu režimu vykresluje v:

- `.layout__context`

a má vlastní grid řádek (3).

### 2) Stejný “rytmus” jako nav řádek
Aby ikonky nebyly nalepené na horní/dolní hranu, `layout__context` má mít podobnou výšku/padding jako nav řádek.

Doporučení:
- `min-height` = stejné jako nav řádek (typicky kolem 40px)
- `padding` = stejný vertikální rytmus jako nav (např. 4px nahoře/dole)

### 3) Zarovnání doprava
Pokud má být CommonActions na pravé straně, context řádek může použít:
- zarovnání obsahu na pravý okraj (bez změny pořadí prvků)

---

## Sidebar režim – ochrana před nechtěnými změnami

Jakákoliv úprava pro TopMenu režim musí být psaná tak, aby:

- **neovlivnila sidebar režim**
- používat selektor:
  - `.layout.layout--topmenu ...`

**Důvod:** Sidebar layout je stabilní a odladěný; změny pro TopMenu se izolují do `.layout--topmenu`, aby se nerozbily grid sloupce/řádky v sidebar režimu.

---

## Kontrolní checklist po úpravách

### TopMenu režim
- [ ] Topbar/TopMenu/CommonActions/Content jsou v samostatných řádcích
- [ ] Nic “neutíká za roh” při šířce > 768px
- [ ] TopMenu má horizontální scroll, když je položek více
- [ ] Scrollbar v TopMenu je viditelný (nebo alespoň použitelný)
- [ ] Text TopMenu je čitelný v dark theme
- [ ] Popover není “světlý natvrdo” a respektuje theme tokeny

### Sidebar režim
- [ ] Nezměnilo se pořadí ani grid sloupce
- [ ] Nezhoršila se viditelnost/spacing v topbar a actions
- [ ] Nic není skryto za hranou layoutu

---

# DOPLNĚNÍ (2025-12-16) – Modul 010: Pozvat uživatele (Invite flow)

## 1. Cíl
Zavést jednotný a bezpečný způsob „pozvání uživatele do aplikace“, který:
- je oddělený od plného detailu uživatele (správa profilu),
- funguje pro existující i neexistující uživatele,
- minimalizuje povinná pole (jen to, co je nutné pro pozvánku),
- zapisuje audit a stav pozvánky,
- respektuje RLS a oprávnění.

Pozvánka není editace uživatele. Je to samostatná akce a samostatný proces.

---

## 2. Umístění v UI (010 – Správa uživatelů)

### 2.1 Seznam uživatelů (ListView)
V modulu 010 (přehled uživatelů) budou v CommonActions dostupné dvě odlišné akce:

- **Přidat uživatele**  
  → otevírá plný detail/formulář uživatele (správa profilu)

- **Pozvat uživatele**  
  → otevírá samostatný formulář „Pozvánka“ (invite flow)

Pozvání se nikdy neřeší „uvnitř“ plného detailu uživatele jako běžná editace.

---

## 3. Obrazovka „Pozvat uživatele“ (Invite)

Pozvání je řešeno jako samostatná obrazovka v rámci modulu 010:
- UI rámec odpovídá ostatním detailům (EntityDetailFrame + DetailView),
- obsah je zjednodušený,
- formulář má pouze dvě záložky.

### 3.1 Záložky
1. **Pozvánka** (editovatelná)  
2. **Systém** (read-only, audit a stav pozvánky)

Záložka „Systém“ se zobrazuje až poté, co existuje záznam pozvánky.

---

## 4. Záložka „Pozvánka“ – logika a pole

### 4.1 Režim pozvánky
Uživatel zvolí jednu ze dvou variant:
- **Pozvat existujícího uživatele**
- **Pozvat nového uživatele**

Tato volba určuje podobu formuláře i další kroky.

---

### 4.2 Varianta A – Pozvat existujícího uživatele

#### A1) Výběr uživatele
- pole: **Vybrat uživatele**
- zdroj: seznam uživatelů / subjektů

Po výběru se automaticky předvyplní:
- email
- zobrazované jméno
- aktuální role (pokud existuje)

#### A2) Upravitelné položky
- **Role** (povinné)
- **Poznámka k pozvánce** (volitelné)

Doporučení:
- Email: read-only
- Zobrazované jméno: volitelně editovatelné

#### A3) Validace
- musí být vybrán uživatel
- musí být vybraná role
- email musí existovat a být validní

---

### 4.3 Varianta B – Pozvat nového uživatele

Formulář je záměrně minimalistický.

#### B1) Povinná pole
- **Email**
- **Role**

#### B2) Volitelná pole
- **Zobrazované jméno** (fallback z emailu)
- **Poznámka k pozvánce**

#### B3) Pole, která se v invite nepoužívají
- Přihlašovací jméno (login)
- Heslo
- Osobní údaje (jméno, příjmení, tituly)

#### B4) Validace
- email je povinný a validní
- role je povinná
- unikátnost emailu řeší backend

---

## 5. Akce a chování (CommonActions)

### 5.1 Dostupné akce
- **Odeslat pozvánku**
- **Zrušit**

Pozdější rozšíření:
- Znovu odeslat pozvánku
- Zrušit pozvánku

### 5.2 Povinné chování
- při chybějících povinných polích nelze pozvánku odeslat,
- zobrazí se jasná validační hláška,
- platí pravidla dirty guardu.

---

## 6. Backend proces (konceptuálně)

### 6.1 Existující uživatel
- ověření existence uživatele
- případná aktualizace role
- vytvoření záznamu pozvánky
- odeslání emailu

### 6.2 Nový uživatel
- vytvoření minimálního subjektu (pending)
- přiřazení role
- vytvoření pozvánky
- odeslání emailu

### 6.3 Heslo
Heslo se nikdy nezadává v invite.
Uživatel si heslo nastaví sám při přijetí pozvánky.

---

## 7. Záložka „Systém“

Read-only přehled stavu pozvánky.

### 7.1 Zobrazená metadata
- ID pozvánky
- Datum vytvoření
- Kdo pozvánku odeslal
- Datum odeslání
- Stav pozvánky (čeká / přijata / expirovala / zrušena)

### 7.2 Budoucí rozšíření
- datum prvního přihlášení
- datum nastavení hesla
- audit změn role

---

## 8. Terminologie v UI

- **Zobrazované jméno** – jméno/přezdívka v aplikaci
- **Email** – primární identita uživatele
- **Přihlašovací jméno (login)** – technický identifikátor (nepoužívá se v invite)
- **Role** – oprávnění v systému

---

## 9. Oprávnění
Pozvání uživatele je administrátorská akce:
- dostupná pouze oprávněným rolím,
- chráněná RLS,
- běžný uživatel akci nevidí.

---

## 10. Shrnutí
- Pozvánka je samostatný proces.
- Minimum povinných polí.
- Oddělení správy profilu a pozvání.
- Audit a dohledatelnost.
- Konzistentní chování s UI systémem aplikace.

## Kontextové režimy UI (READ-ONLY vs MANAGER)

- UI aplikace pracuje s jasně oddělenými kontextovými režimy.
- Režim určuje, zda obrazovka pouze zobrazuje data, nebo umožňuje měnit stav systému.

### READ-ONLY režim

- Slouží výhradně k náhledu dat.
- Neumožňuje žádné změny systémového stavu.
- Neobsahuje editovatelné formuláře ani akční prvky.
- Používá se v detailech entit a přehledových obrazovkách.
- Minimalizuje riziko nechtěných změn.

### MANAGER režim

- Umožňuje aktivní práci s daty.
- Obsahuje formuláře, akce a správcovské operace.
- Změny provedené v tomto režimu se zapisují do systému.
- Používá se ve správcovských obrazovkách a akcích vyvolaných z CommonActions.

### Oddělení režimů

- READ-ONLY a MANAGER režimy se nikdy nekombinují na jedné obrazovce.
- Detail entity je vždy v READ-ONLY režimu.
- Změny dat jsou povoleny pouze v MANAGER režimu.
- Přechod mezi režimy musí být pro uživatele zřetelný.

### Vztah k CommonActions

- CommonActions slouží jako vstupní bod do MANAGER režimu.
- Akce v CommonActions nikdy nemění data přímo v detailu entity.
- Správa dat je vždy oddělena do samostatného kontextu.

### Závaznost

- Pravidla platí pro všechny moduly a entity aplikace.
- Jsou závazná i pro budoucí rozšiřování UI systému.
- Porušení těchto zásad je považováno za chybu návrhu UI.

---

## 11. Navigation Pattern: onNavigate Callback

### 11.1 Účel

Pattern **onNavigate callback** umožňuje tiles navigovat na jiné tiles v rámci stejného modulu.

**Hlavní výhody:**
- Odstranění duplicitního create kódu z list tiles
- Automatické zavírání Sidebar filtrů při navigaci
- Čistá separace UI stavů (list × create × detail)
- Centrální navigační logika v AppShell
- TypeScript type safety

### 11.2 Implementace v AppShell

AppShell předává všem tiles callback `onNavigate`:

```typescript
<TileComponent
  key={`${selection.tileId}-${tileRenderKey}`}
  onRegisterCommonActions={registerCommonActions}
  onRegisterCommonActionsState={registerCommonActionsUi}
  onRegisterCommonActionHandler={registerCommonActionHandler}
  onNavigate={(tileId: string) => {
    // Naviguj na jiný tile v rámci stejného modulu
    handleModuleSelect({ moduleId: selection.moduleId, tileId })
  }}
/>
```

**Chování:**
- Callback volá standardní `handleModuleSelect`
- URL se aktualizuje: `/module-id?t=target-tile-id`
- Sidebar se automaticky synchronizuje (zavře children)
- Force remount mechanismus funguje korektně

### 11.3 Použití v Tiles

**Pattern pro List → Add navigaci:**

```typescript
// 1. Přidat onNavigate do interface
type YourTileProps = {
  onRegisterCommonActions?: (actions: CommonActionId[]) => void
  onRegisterCommonActionsState?: (state: { viewMode: ViewMode; hasSelection: boolean; isDirty: boolean }) => void
  onRegisterCommonActionHandler?: (fn: (id: CommonActionId) => void) => void
  onNavigate?: (tileId: string) => void // ✅ Callback pro navigaci
}

// 2. Přidat do destructuringu
export default function YourTile({
  onRegisterCommonActions,
  onRegisterCommonActionsState,
  onRegisterCommonActionHandler,
  onNavigate, // ✅ Accept callback
}: YourTileProps) {

// 3. Použít v add handler
if (id === 'add') {
  onNavigate?.('create-entity-name') // ✅ Naviguj na create tile
  return
}
```

### 11.4 Výhody oproti lokálnímu create mode

**PŘED (lokální create mode):**
```typescript
if (id === 'add') {
  // 40+ řádků vytváření prázdné entity
  const newEntity: DetailEntity = {
    id: 'new',
    displayName: '',
    email: null,
    // ... 20+ dalších properties
  }
  setDetailEntity(newEntity)
  setViewMode('create')
  setSelectedId('new')
  setIsDirty(false)
  setUrl({ id: 'new', vm: 'create' }, 'push')
  return
}
```

**PO (onNavigate pattern):**
```typescript
if (id === 'add') {
  onNavigate?.('create-entity-name') // ✅ 3 řádky
  return
}
```

**Ušetřeno:**
- 40+ řádků duplicitního kódu v každém list tile
- Složitá state management logika
- Manuální URL updates
- Riziko inconsistentního chování

### 11.5 UX Flow

**Chování z pohledu uživatele:**

1. Uživatel v seznamu (např. "Přehled pronajímatelů")
2. V Sidebaru otevřené filtry (Osoba, OSVČ, Firma...)
3. Klik na **+ (Přidat)** v CommonActions
4. ✅ Seznam se zavře
5. ✅ Sidebar filtry se automaticky zavřou
6. ✅ Otevře se create tile "Přidat pronajímatele"
7. ✅ Čistá obrazovka bez otevřených sekcí

**Poznámka:** Třetí úroveň sidebaru (typové přehledy s počty) zobrazuje pouze položky s počtem ≥ 1.

**Zpět na seznam:**
- Klik na "Přehled pronajímatelů" v Sidebaru nebo breadcrumbs
- Seznam se znovu načte (včetně filtrů s počty)

### 11.6 Implementované moduly

| Modul | List Tile | Create Tile | Status |
|-------|-----------|-------------|--------|
| 030 Pronajímatelé | `landlords-list` | `create-landlord` | ✅ Implementováno |
| 050 Nájemníci | `tenants-list` | `create-tenant` | ✅ Implementováno |
| 040 Nemovitosti | `properties-list` | `create-property` | ✅ Implementováno |
| 040 Jednotky | `units-list` | `create-unit` | ✅ Implementováno |

### 11.7 Edge Cases

**⚠️ onNavigate není definováno:**
- Použití optional chaining: `onNavigate?.('tile-id')`
- Graceful fallback – nic se nestane
- Legacy kompatibilita

**⚠️ Neexistující target tile:**
- `handleModuleSelect` nenajde tile → console.error
- UI zůstane stabilní

**⚠️ Dirty state při navigaci:**
- `handleModuleSelect` volá `confirmIfDirty()`
- Pokud jsou neuložené změny → dialog potvrzení
- Uživatel může zrušit navigaci

### 11.8 Budoucí rozšíření

**Možnosti rozšíření pattern:**
- onNavigate s parametry: `onNavigate(tileId, params)`
- Edit navigace: `onNavigate('detail-tile', { id: '123', vm: 'edit' })`
- Related entities: `onNavigate('units-list', { propertyId: 'abc' })`
- Cross-module navigation (pokud bude potřeba)

### 11.9 Reference

**Detailní dokumentace:**
- [CHANGELOG-NAVIGATION-PATTERN-LIST-TO-ADD.md](changelogs/CHANGELOG-NAVIGATION-PATTERN-LIST-TO-ADD.md)

**Příklady implementace:**
- [LandlordsTile.tsx](../app/modules/030-pronajimatel/tiles/LandlordsTile.tsx)
- [TenantsTile.tsx](../app/modules/050-najemnik/tiles/TenantsTile.tsx)

**Commity:**
- `2b892f1` - feat: tlačítko Přidat naviguje na create-landlord tile
- `275b4a9` - feat: tlačítko Přidat naviguje na create-tenant tile + zavírá Sidebar přehledy

---
## DOPLNĚNÍ (2026-02-08) – Záložky „Služby“ pro Nemovitost a Jednotku

### Cíl
Sjednotit UI pro evidenci pravidelných služeb/nákladů na úrovni nemovitosti a jednotky
v souladu se systémem List/Detail a CommonActions.

---
### Detail Nemovitosti → záložka „Služby“
Použití **RelationListWithDetail**:
- **Horní seznam**: služby přiřazené k nemovitosti
- **Dolní detail**: detail vybrané služby

**Standardní chování:**
- Filtrace a hledání v horním seznamu
- ColumnPicker aktivní
- Správa příloh pouze přes 📎 (CommonActions)
- Záložka Přílohy v detailu je read‑only

---
### Detail Jednotky → záložka „Služby“
Použití **RelationListWithDetail**:
- **Horní seznam**: služby přiřazené k jednotce
- **Dolní detail**: detail vybrané služby

**Standardní chování:**
- Filtrace a hledání v horním seznamu
- ColumnPicker aktivní
- Správa příloh pouze přes 📎 (CommonActions)
- Záložka Přílohy v detailu je read‑only

---
### Společné UI zásady
- Záložky detailu vždy: **Detail / Přílohy / Systém**
- Akce přes **CommonActions** (add/edit/archive/save/reject)
- Žádné přímé mazání – pouze archivace

