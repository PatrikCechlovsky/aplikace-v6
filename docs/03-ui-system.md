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
