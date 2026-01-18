# aplikace-v6/docs/03-ui/ui-list-and-detail-pattern.md
# UI Pattern – ListView & DetailView

## Účel dokumentu
Tento dokument definuje jednotné UI vzory pro všechny moduly systému.
Popisuje strukturu ListView (seznamu) a DetailView (detailu entity) tak,
aby všechny moduly měly konzistentní chování a vizuální logiku.

Vzor vychází z dokumentu POSTUP.md a platí pro všechny moduly 010–999.

---

# 1. ListView – hlavní seznam entity

ListView je vstupní obrazovka většiny modulů.  
Je tvořen:

    • EntityList – hlavní tabulka
    • Filtry
    • ColumnPicker (volitelné sloupce)
    • CommonActions (akce nad seznamem)
    • RowActions (akce na řádcích)
    • DetailView – otevřený po kliknutí na řádek

ListView musí být postaven stejným způsobem ve všech modulech.

---

## 1.1 Struktura ListView

ListView obsahuje:

    1. Hlavní název tile (např. „Uživatelé“)
    2. Filtry
    3. CommonActions (např. „Nový“, „Pozvat“, „Export“)
    4. EntityList (seznam záznamů)
    5. ColumnPicker (možnost skrýt/zobrazit volitelné sloupce)
    6. RowActions (akce na řádku)
    7. Napojení na DetailView

ListView NIKDY nesmí obsahovat:

    - logiku validací (patří do formulářů DetailView)
    - úpravu dat přímo v tabulce
    - přepínání mezi různými typy entit

---

## 1.2 Filtry (Filters)

Každý ListView má definované filtry:

    • Fulltext (vyhledává v 2–4 hlavních polích)
    • Select filtry (role, status, typ, stav…)
    • Datumové filtry (od–do)
    • Filtr aktivní/archivované (pokud entita podporuje archivaci)

Každý filtr musí mít:

    Název → Sloupec → Typ filtru → Výchozí hodnotu

Filtry nesmí být dynamicky generovány bez specifikace.

---

## 1.3 Sloupce a ColumnPicker

Seznam sloupců musí být:

    • jednotně definován ve specifikaci modulu
    • rozdělen na povinné a volitelné sloupce
    • identifikován pomocí unikátního ID (module/tile)

Sloupce se dělí:

    Povinné:
        • vždy viditelné, nejdůležitější atributy

    Volitelné:
        • skryté/sladitelné přes ColumnPicker

ColumnPicker vždy respektuje pravidla v POSTUP.md.

---

## 1.4 RowActions (akce nad jednotlivými záznamy)

Na každém řádku musí být:

    • Detail (povinně)
    • Archivace / Obnovení (pokud entita podporuje)
    • Mazání (pokud entita umožňuje)
    • Vlastní akce dle modulu (např. „Odeslat upomínku“)

Pravidlo:

    RowActions musí být konzistentní napříč celým systémem.

---

## 1.5 Napojení na DetailView

Po kliknutí na řádek:

    → otevře se DetailView pro daný záznam
    → zachovají se filtry i pozice v seznamu
    → umožní návrat zpět do seznamu bez ztráty stavu

---

# 2. DetailView – detail entity

DetailView je hlavní formulář pro zobrazení a úpravu entity.

Vždy se skládá z:

    • EntityDetailFrame
    • Záložek (Tabs)
    • Formulářů uvnitř záložek
    • Kontextových akcí

Záložky jsou povinné pro všechny moduly s výjimkou modulů, které mají
pouze jednoduchý formulář (např. 020).

---

## 2.1 Povinné záložky

Všechny moduly používají tento standard:

    1. Základní údaje (profil / hlavní informace)
    2. Vazby (pokud existují)
    3. Přílohy
    4. Historie
    5. Systém

### 1. Základní údaje
Obsahuje hlavní pole entity:

    - název
    - stav
    - typ
    - klíčové kontakty
    - primární atributy

Editace závisí na rolích a oprávněních modulu.

---

### 2. Vazby (RelationListWithDetail)
Používá se, pokud entita má další podřízené záznamy:

    - jednotky u nemovitosti
    - smlouvy u jednotky
    - uživatelé domácnosti
    - měřidla
    - bankovní účty

Vzor:

    Horní část – seznam vazeb (EntityList)
    Dolní část – detail vazby (DetailView jiné entity)

---

### 3. Přílohy

Přílohy jsou jednotné pro všechny moduly, ale jsou rozdělené na 2 režimy:

- **Záložka „Přílohy“ v detailu entity** = **READ-ONLY přehled**
  - seznam (latest verze), filtr, „zobrazit archivované“, otevřít soubor
  - bez uploadu, bez verzí, bez editace metadat, bez archivace

- **📎 v CommonActions** = **samostatný TILE „Správa příloh“**
  - plná správa: přidat přílohu, nová verze, edit metadat, historie verzí, zavřít

Detailní specifikace: `docs/03-ui/attachments.md`

---

### 4. Historie

Obsahuje auditní informace:

    created_at
    created_by
    updated_at
    updated_by
    log změn (pokud existuje)

Vždy read-only.

---

### 5. Systém

Zobrazuje technické hodnoty:

    - ID entity
    - stav archivace
    - interní metadata
    - poznámky systému

Vždy read-only.

---

## 2.2 Pravidla pro formuláře (Forms)

Každý formulář musí:

    • mít jasně definovaná pole
    • respektovat viditelnost rolí
    • obsahovat validace definované v entity-fields
    • neobsahovat logiku backendu

Formulář nesmí:

    • měnit pole, která uživatel podle pravidel nesmí upravit
    • dynamicky modifikovat vlastní strukturu bez specifikace
    • obcházet audit

---

## 2.3 Editace vs. Read-only

Zásady:

    - Pokud nemá uživatel oprávnění, zobrazí se pole jako read-only.
    - Záložka může být skrytá pro určité role.
    - Pole editované pouze systémem musí být read-only.

---

# 3. Sdílené vzory chování

## 3.1 Hierarchie UI

Všechny moduly používají stejnou UI hierarchii:

    Layout
      Sidebar
      Topbar
      MainContent
        ListView → DetailView

## 3.2 Základní akce

Každý modul podporuje:

    - Nový záznam (pokud má smysl)
    - Uložit
    - Archivovat
    - Obnovit
    - Smazat (pokud je povoleno)
    - Změnit stav (např. aktivní / neaktivní)

---

# 4. Použití tohoto vzoru v modulech

## Modul 010 – Správa uživatelů
Používá:

    ListView – seznam všech uživatelů
    DetailView – detail uživatele (5 záložek)
    InviteForm – samostatná akce

## Modul 020 – Můj účet
Používá pouze:

    DetailView – detail přihlášeného uživatele
    (se stejnými záložkami, ale omezenými funkcemi)

## Ostatní moduly (030, 040, 050…)
Použijí stejnou strukturu ListView + DetailView.

---

# 5. Shrnutí UI vzoru

Všechny moduly musí dodržovat tyto zásady:

    ✔ ListView má vždy stejnou strukturu
    ✔ DetailView má vždy 5 jednotných záložek
    ✔ Formuláře se řídí pravidly viditelnosti a editovatelnosti
    ✔ Všechny tabulky lze filtrovat a mít ColumnPicker
    ✔ Navigation List → Detail musí být konzistentní v celé aplikaci
    ✔ Každý modul má přehledné rozdělení: ListView → Detail → Akce → Vazby

Tento dokument slouží jako šablona UI pro celé aplikace-v6.
