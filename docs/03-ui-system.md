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
