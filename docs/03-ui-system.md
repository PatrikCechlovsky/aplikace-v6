# /docs/03-ui-system.md
## Popis: Detailní specifikace UI systému, layoutu, komponent a pravidel vizuálního chování aplikace Pronajímatel v6.
---

# 03 – UI SYSTEM  
*(Finální konsolidovaná verze)*

---

# 1. ÚVOD

UI systém aplikace Pronajímatel v6 je založen na:

- **jednotném 6-sekčním layoutu**,  
- **modulárních UI komponentách**,  
- **dynamickém načítání modulů**,  
- **konsistentních vzorech interakce**,  
- **minimální duplikaci UI logiky**.

Cílem UI systému je zajistit:

- konzistenci v celé aplikaci  
- předvídatelné chování pro uživatele  
- snadné rozšiřování o nové moduly a formuláře  
- jasně definované odpovědnosti UI prvků  

---

# 2. 6-SEKČNÍ LAYOUT

Aplikace je vystavěná na přísném, neměnném layoutu:

```
┌───────────────────────────────────────────────────────────────┐
│ 1–2: Sidebar (HomeButton + dynamické moduly)                  │
├──────────────┬───────────────────────────────────────────────┤
│              │ 3: Horní lišta                                 │
│ Sidebar      │    • Breadcrumbs vlevo                         │
│ (left)       │    • HomeActions vpravo                        │
│              ├───────────────────────────────────────────────┤
│              │ 4: CommonActions — lišta obecných akcí         │
│              ├───────────────────────────────────────────────┤
│              │ 5: Content — přehled / detail / formulář       │
└──────────────┴───────────────────────────────────────────────┘
```

Každá sekce má pevně definované chování.

## 2.1 Sekce 1–2: Sidebar

Sidebar zajišťuje:

- výběr modulu  
- zobrazení hierarchie modul / sekce / typ / položka  
- aktivní stav (zvýraznění vybraného modulu nebo sekce)  
- podporu pro ikony modulů  
- dynamické načítání obsahu ze `module.config.js`

Sidebar obsahuje tyto prvky:

- **HomeButton** (sekce 1)  
- **Seznam modulů** (sekce 2)  

Sidebar je responzivní — na mobilních zařízeních může být skrytý.

---

## 2.2 Sekce 3: Horní lišta

Horní lišta obsahuje:

- **Breadcrumbs** vlevo  
- **HomeActions** vpravo  

Horní lišta je statická podle layoutu, ale obsah dynamicky reaguje na:

- vybraný modul  
- otevřenou dlaždici  
- otevřený detail  
- otevřený formulář  

---

## 2.3 Sekce 4: CommonActions

Cílem CommonActions je:

- nabídnout relevantní akce podle stavu UI  
- být jednotné pro všechny moduly  
- eliminovat duplikaci tlačítek v každém formuláři

Aktuální verze:

- statický seznam akcí  
- základní UI

Budoucí verze:

- **dynamicky generované akce podle modulu**  
- **filtrace podle role a oprávnění uživatele**  
- **stavové podmínky (requiresDirty, requiresSelection, requiresDetailOpen)**

---

## 2.4 Sekce 5: Content

Content zobrazuje:

- přehled (overview)  
- detail položky  
- formulář  
- systémové obrazovky (login, 404…)  

Content engine bude řídit:

- refresh modulů  
- přepínání vnitřních částí modulů  
- předávání dat Breadcrumbs a CommonActions  

---

# 3. KLÍČOVÉ UI KOMPONENTY

## 3.1 HomeButton

Funkce:

- přesměrování na “Dashboard”  
- deaktivace, pokud není uživatel přihlášen  
- obsahuje ikonu domů a název aplikace  

## 3.2 Sidebar

Sidebar je plně dynamický:

- načítá moduly z `MODULE_SOURCES`  
- moduly třídí podle `order`  
- zobrazuje ikonu + název  
- rozlišuje aktivní modul  

Budoucí rozšíření:

- více úrovní (sekce → typ → záznam)  
- rozbalovací skupiny  
- animace  
- ikony kategorií  

---

## 3.3 Breadcrumbs

Aktuální verze:

- “Domů / Dashboard”

Budoucí inteligentní breadcrumb builder:

- úroveň 1 = modul  
- úroveň 2 = dlaždice / sekce  
- úroveň 3 = detail entity  
- úroveň 4 = formulář / editace  

Breadcrumbs budou generovány na základě:

- aktivního modulu  
- otevřené dlaždice  
- kontextového stavu  

---

## 3.4 HomeActions

Obsahuje:

- jméno uživatele  
- ikonu profilu  
- vyhledávání  
- notifikace  
- odhlášení  

Zobrazuje z `session.user_metadata.display_name`.

---

## 3.5 CommonActions

Aktuální seznam dostupných akcí:

```
add
edit
view
duplicate
attach
archive
delete
save
saveAndClose
cancel
```

Budoucí definice akcí bude v:

```
module.config.js
```

Např.:

```js
commonActions: {
  overview: ['add', 'delete'],
  detail: ['edit', 'archive'],
  form: ['save', 'cancel'],
}
```

---

## 3.6 UI – typy polí formulářů

Aplikace používá standardizované komponenty:

- text input  
- number input  
- select  
- multiselect  
- checkbox / boolean  
- date picker  
- email / phone  
- JSON editor (v budoucnu)  

Každé pole má definované:

- komponentu  
- validaci  
- chování v UI  
- integraci s formStateManagerem  

# 3.7 ListView – specifikace přehledové obrazovky

**ListView** je hlavní komponenta používaná pro zobrazování přehledů entit  
(např. seznam subjektů, seznam nemovitostí, seznam nájemníků).  
Obsahuje uživatelské ovládací prvky (filtr, řazení, archivace, akce)  
a uvnitř používá komponentu **EntityList** jako tabulku.

ListView tvoří kompletní přehledovou obrazovku.

---

## 3.7.1 Filtrace
- Obsahuje globální fulltextový filtr („Filtrovat…“).
- Fulltext hledá:
  - ve všech **viditelných sloupcích**
  - i v **neviditelných sloupcích** označených jako *searchable*
- Filtrace se aplikuje okamžitě a kombinuje se s dalšími filtry.

---

## 3.7.2 Zobrazit archivované
- Uživatel může přepnout checkbox „Zobrazit archivované“.
- Modul si určuje chování:
  - zobrazit aktivní + archivované
  - nebo zobrazit pouze archivované
- Archivované záznamy mohou být vizuálně odlišeny.

---

## 3.7.3 Typ entity v prvním sloupci (barevný badge)
- První sloupec může zobrazovat typ entity jako **barevný štítek** (PO, FO, nájemník…).
- Barva, název i pořadí badge se načítají z číselníku (např. „Typy subjektů“).
- Každá změna v číselníku se automaticky projeví v ListView.

---

## 3.7.4 Výchozí řazení
- Při prvním načtení je seznam seřazen podle logiky modulu  
  (např. podle `subject_type.order`).
- Toto výchozí řazení se aplikuje, dokud uživatel neklikne na jiný sloupec.

---

## 3.7.5 Řazení sloupců
- Každý viditelný sloupec lze seřadit:
  - A → Z  
  - Z → A  
- Ikona šipky označuje aktivní stav řazení.
- Konfigurace může podporovat i „reset“ na výchozí řazení.

ListView deleguje vykreslení tabulky na **EntityList**, ale logiku řazení řídí samo.

---

## 3.7.6 Vazba na CommonActions
ListView sdílí s CommonActions informace o:

- aktivním řádku (vybraná entita)
- prázdném výběru

Díky tomu CommonActions může:

- aktivovat / deaktivovat akce (editace, mazání, archivace…)
- skrývat akce podle role uživatele
- reagovat na dirty state (u detailů)

---

## 3.7.7 Role a oprávnění
ListView respektuje oprávnění uživatele:

Tlačítka akcí mohou být:
- **aktivní**, pokud má uživatel permission
- **zašedlé**, pokud permission nemá
- **skrytá**, pokud akce pro danou roli neexistuje

---

## 3.7.8 ColumnPicker – volitelné nastavení viditelnosti sloupců
- Uživatel může zapnout/vypnout viditelnost sloupců.
- Povinné sloupce lze trvale uzamknout.
- Nastavení lze ukládat:
  - lokálně (localStorage)
  - nebo později do profilu uživatele

ColumnPicker je součástí ListView, nikoli EntityList.

---# 3.8 RelationListWithDetail – seznam vazeb + detail vybrané položky

**RelationListWithDetail** je dvoučástová komponenta používaná v záložkách, které zobrazují
vztahy (vazby) mezi entitami. Umožňuje zároveň:

- nahoře zobrazit **seznam všech souvisejících záznamů**
- dole zobrazit **detail právě vybraného záznamu**

Slouží pro případy, kdy uživatel otevřel jednu entitu (např. Nemovitost) a v dalších záložkách se chce dívat na záznamy, které k ní patří (Pronajímatel, Jednotky, Nájemníci, Smlouvy, Platby…).

Pořadí záložek (Pronajímatel → Nemovitost → Jednotka → …) je pevné a nejenže se nemění, ale také neurčuje „hlavní detail“. Hlavní detail je pouze ta záložka, která odpovídá typu právě otevřené entity.

---

## 3.8.1 Kdy se RelationListWithDetail používá

RelationListWithDetail se používá ve **všech záložkách kromě té, která odpovídá typu aktuálně otevřené entity**.

Příklad – otevřená Nemovitost K1:

- **Záložka 2 – Nemovitost**  
  → jen **detail nemovitosti K1** (EntityDetailFrame + DetailView)  
  → *bez RelationListWithDetail*

- **Záložka 1 – Pronajímatel**  
  → RelationListWithDetail  
  → nahoře seznam pronajímatelů (u nemovitosti vždy 1 řádek)  
  → dole detail vybraného pronajímatele

- **Záložka 3 – Jednotka**  
  → RelationListWithDetail  
  → nahoře seznam jednotek v nemovitosti  
  → dole detail vybrané jednotky

Tento vzor pokračuje i pro další záložky.

---

## 3.8.2 Struktura komponenty

RelationListWithDetail se skládá ze dvou hlavních částí:

### Horní část – seznam souvisejících záznamů  
Používá se `EntityList` nebo `ListView`.

Funkce:

- zobrazení všech vazeb k aktuální entitě
- výběr jednoho záznamu
- scroll při velkém počtu položek
- možnost pohybu „Předchozí / Další“
- volitelné filtrování, řazení, zobrazování archivovaných položek

### Dolní část – detail vybrané položky  
Používá se `EntityDetailFrame + DetailView`.

Funkce:

- zobrazí detail právě vybraného řádku z horní části
- obsahuje všechny sekce dané entity (např. Základní údaje, Kontakty, Nájem, Systém…)
- obvykle je **readonly**, protože plná editace probíhá v hlavní záložce dané entity  
  (např. plná editace pronajímatele se dělá jen ve „záložce Pronajímatel“, ne v záložce Nemovitost)

---

## 3.8.3 Příklad: otevřená Nemovitost K1

### Záložka 2 – Nemovitost (hlavní detail)
- Zobrazuje **jen detail nemovitosti K1**  
- Komponenta: `EntityDetailFrame + DetailView`  
- Plně editovatelný formulář  
- RelationListWithDetail se zde **nepoužívá**

---

### Záložka 1 – Pronajímatel (Nemovitost → Pronajímatel)
Horní část:
- `EntityList` se seznamem pronajímatelů této nemovitosti  
- běžně 1 řádek (jedna nemovitost = jeden pronajímatel)

Dolní část:
- detail vybraného pronajímatele  
- komponenta: `EntityDetailFrame + DetailView` pronajímatele  
- sekce např.:
  - Základní údaje  
  - Kontakty  
  - Bankovní účty  

*(Sekce Finance sem nepatří – je samostatná záložka č. 8.)*

---

### Záložka 3 – Jednotka (Nemovitost → Jednotky)
Horní část:
- `EntityList` se všemi jednotkami v této nemovitosti  
- může být 0, 1 nebo mnoho jednotek  
- scroll při větším počtu položek  
- možnost přepínání mezi jednotkami

Dolní část:
- `EntityDetailFrame + DetailView` dané jednotky  
- sekce např.:
  - Základní údaje  
  - Nájem  
  - Systém  

Kliknutí na jiný řádek v seznamu přepne detail na jinou jednotku.

---

## 3.8.4 Obecný vzor chování

Pro každou entitu otevřenou z přehledu platí:

- **její vlastní záložka** (např. Nemovitost u nemovitosti)  
  → zobrazí čistý detail s možností editace

- **ostatní záložky**  
  → zobrazují vazby pomocí RelationListWithDetail  
  → nahoře seznam těchto vazeb  
  → dole detail vybrané položky

Tím je zajištěno:

- jednotné chování aplikace  
- přehlednost  
- minimalizace zbytečného přepínání mezi obrazovkami  
- možnost postupného procházení vazeb (Pronajímatel → Nemovitost → Jednotka → Nájemník → Smlouva → Platby…)

---

## 3.8.5 Chování v horní části seznamu

Horní `EntityList` slouží jako navigátor mezi souvisejícími položkami.

Podporuje:
- výběr řádku
- filtrování (pokud je aktivováno ListView)
- řazení
- zobrazení archivovaných
- přepínání „Předchozí / Další“ (uživatelsky pohodlné při velkém množství položek)

---

## 3.8.6 Chování detailu v dolní části

Dolní `EntityDetailFrame + DetailView`:

- reaguje na výběr řádku v horní části
- ukazuje kompletní detail položky včetně všech jejích sekcí
- obvykle je **readonly**, protože plná editace se provádí v její „hlavní“ záložce  
  (např. jednotka se plně edituje v záložce Jednotka, ne v záložce Nemovitost)

---

## 3.8.7 Oprávnění

RelationListWithDetail respektuje:

- oprávnění uživatele pro zobrazení vazeb
- oprávnění k editaci nebo jen čtení detailu položek
- dostupnost akcí v CommonActions (např. přidání, odebrání vazby)

Uživatel vidí vždy jen to, k čemu má roli a oprávnění.


---

# 3.9 EntityDetailFrame – hlavní rám detailu entity

**EntityDetailFrame** je hlavní kontejner pro zobrazení a úpravu detailu libovolné entity  
(Pronajímatel, Nemovitost, Jednotka, Nájemník, Smlouva, Platba, …).

Je to „velká detailová karta“, která:

- definuje strukturu detailu (header, akce, záložky, obsah)
- obsahuje logiku pro editaci, zobrazení, přílohy a systémové informace
- je použitá jak v hlavním detailu entity, tak jako readonly náhled v RelationListWithDetail

---

## 3.9.1 Účel EntityDetailFrame

EntityDetailFrame zajišťuje:

- jednotný vzhled všech detailových obrazovek v aplikaci
- správu interakcí s detailem entity
- podporu editace (hlavní detail) nebo jen zobrazení (readonly náhled)
- předávání stavu do CommonActions (uložit, zrušit…)
- zobrazení jednotlivých sekcí entity pomocí záložek (tabs)
- podporu systémových informací a příloh

---

## 3.9.2 Struktura EntityDetailFrame

EntityDetailFrame se skládá z těchto částí:

### (1) Header (Hlavička)
Obsahuje:

- ikonu entity (např. dům, osoba, smlouva…)
- název entity (např. „Nemovitost K1“)
- volitelný barevný badge typu entity
- hlavní stav entity (aktivní, archivovaná…)
- metadata (např. ID, kód, datum vytvoření)

Chrome hlavičky může být přizpůsobené podle typu entity.

---

### (2) CommonActions (Horní tlačítka)
Zobrazují se **pouze v hlavním detailu entity** (ne při zobrazení v RelationListWithDetail).

Typické akce:

- **Uložit**
- **Uložit a zavřít**
- **Zrušit**
- **Archivovat**
- **Smazat**
- **Duplikovat**
- **Otevřít v samostatném okně**

CommonActions reagují na:

- dirty state (neuložené změny)
- oprávnění uživatele (některé akce mohou být skryté nebo zašedlé)
- stav entity (např. archivované entity nelze editovat)

---

### (3) Tabs (Záložky)
Každá entita má definované své sekce:

Příklad Nemovitosti:

- Základní údaje  
- Adresa  
- Jednotky (vazba → RelationListWithDetail)  
- Dokumenty / Přílohy  
- Systém  

Příklad Pronajímatele:

- Základní údaje  
- Kontakty  
- Bankovní účty  
- Dokumenty / Přílohy  
- Systém  

Příklad Smlouvy:

- Parametry smlouvy  
- Platby (vazba → RelationListWithDetail)  
- Dokumenty / Přílohy  
- Systém  

V první záložce se typicky zobrazuje hlavní **DetailView** entity.

---

### (4) Obsah záložek – DetailView
Každá záložka obsahuje vlastní **DetailView**:

- formuláře  
- read-only sekce  
- tabulky  
- výběry  
- specifická logika pro danou entitu  

DetailView zajišťuje:

- validaci polí
- řízení dirty stavu
- propojení s databází / API
- napojení na CommonActions

---

### (5) Sekce Přílohy (povinná součást každého detailu)
Každý EntityDetailFrame obsahuje záložku **Přílohy**, i když entita není dokument.

Sekce Přílohy umožňuje:

- nahrát libovolný soubor (PDF, CSV, JPG, XLSX…)
- automaticky přejmenovat soubory (pokud je aktivní volba)
- zobrazit archivované přílohy
- přidat popis přílohy
- archivovat / obnovit přílohu
- uložit stav přílohy

Komponenta je jednoduchá a jednotná pro všechny entity.

Přílohy jsou **vázané na ID entity** a nejsou sdílené mezi entitami.

*(Pozn.: Modul „Dokumenty“ slouží k jinému účelu – k agregaci a vyhledávání.)*

---

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



---

# 3.10 DetailView – (bude doplněno později)

---

# 3.11 EntityList – specifikace tabulkové komponenty (bude doplněno)
*Placeholder – EntityList je jednoduchá tabulka bez filtrů a bez logiky akcí.*

---

# 3.12 ConfigListWithForm – (bude doplněno později)

---

# 3.13 ColumnPicker – (bude doplněno později)

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
