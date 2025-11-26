# UI-specifikace.md

> Konečná verze standardů pro agenty, layout a logiku modulů v aplikaci "Pronajímatel".

---

## 📘 GLOBÁLNÍ STRUKTURA UI


### 🧱 9-blokový layout aplikace (vždy aktivní rozvržení)

Rozhraní aplikace je jednotné napříč celým systémem. Všechna zobrazení pracují s touto pevnou strukturou:

1. **Home Button** – logo aplikace v levém horním rohu (slouží jako návrat na hlavní přehled)
2. **Sidebar** – vertikální menu modulů (např. Uživatelé, Pronajímatel, Nemovitosti…)
3. **Breadcrumbs** – zobrazení aktuální cesty (např. Domů > Nemovitosti > Detail)
4. **Home Actions** – uživatel, notifikace, vyhledávání, odhlášení (vpravo nahoře)
5. **Common Actions** – akce vztahující se k entitě (např. editace, archivace, export)
6. **Content** – hlavní pracovní plocha, ve které se zobrazuje buď přehled, nebo detail entity

---

### 🔁 Pracovní obsah `Content` (část 6)

V rámci hlavního pracovního prostoru se zobrazují vždy tyto typy obsahu:

#### 7. **List View**

* Přehled záznamů v modulu (tabulka)
* Funkce: filtrování, řazení, hledání, kliknutí na řádek otevře detail entity

#### 8. **Detail Entity**

* Hlavní formulář entity (např. Nemovitost, Smlouva)
* Obsahuje vlastní sekce (formulář, přílohy, systémové info…)

#### 9. **Vazby (Relations)**

* Záložky zobrazující související entity (např. jednotky, nájemníci, smlouvy…)
* **Každá záložka má dvě části**:

  * **Tabs (seznam)** – horní část se seznamem max. 10 záznamů + scroll
  * **Detail** – spodní část s detailem právě vybraného záznamu
  * Lze přepínat mezi záznamy (např. šipkami)


📐 Základní rozložení (desktop)

Podle obrázku máme 6 hlavních bloků:

Blok 1 – Logo / Home button („Pronajímatel“)

Vlevo nahoře.

Kliknutí vždy přejde na „Domů“ (výchozí přehled podle role).

Stejný na všech stránkách.

Blok 2 – Sidebar (seznam modulů)

Levý sloupec aplikace.

Obsahuje seznam modulů (Uživatelé, Můj účet, Pronajímatel, Nemovitosti, Nájemník, Smlouvy, Služby, Platby, Finance, Energie, Dokumenty, Komunikace).

Sidebar je dynamický – moduly se načítají z modules.index.js a jednotlivých module.config.js.

Aktivní modul je zvýrazněný.

Blok 3 – Breadcrumbs (drobečková navigace)

V horní části nad contentem, pod logem.

Zobrazuje cestu:
Domů › [Modul] › [Přehled / Formulář] › [Konkrétní entita].

Vždy je vidět, kde se uživatel právě nachází.

Blok 4 – Home actions (uživatel, hledání, notifikace, odhlášení)

Vpravo nahoře.

Obsahuje:

jméno uživatele,

ikonku lupy (globální hledání),

upozornění (notifikace),

uživatelský profil,

tlačítko Odhlásit.

Stejné chování na všech stránkách.

Blok 5 – Common actions (akční lišta aktuální entity)

Lišta pod breadcrumbs, nad hlavním obsahem.

Obsahuje kontextové akce pro aktuální modul/detail (Nový, Uložit, Upravit, Archivovat, Přílohy, Tisk…).

Je dynamická – akce se budou načítat z konfigurace modulu (do budoucna z module.config.js).

Blok 6 – Content (hlavní obsah obrazovky)

Největší část vpravo dole.

Podle stavu aplikace se zde zobrazuje:

přihlašovací obrazovka,

přehled (tabulka),

detail entity s 10 záložkami a vazbami,

průvodci, formuláře, dashboardy.

V tuto chvíli sem chceme vložit přihlašovací formulář.

Tento nový popis navazuje na předchozí v5/v6 specifikaci UI (10 záložek, hlavní karta, vazby) , ale je zjednodušený na 6 bloků layoutu pro první verzi.

📱 Chování na mobilu

Stejné bloky, ale jinak poskládané:

Horní lišta (blok 1 + 4 dohromady)

Vlevo: ☰ (otevření sidebaru), logo / název aktuálního modulu.

Vpravo: uživatelské akce (hledání, notifikace, profil, odhlášení v menu).

Sidebar (blok 2)

Skrytý jako „hamburger menu“.

Po kliknutí na ☰ se otevře přes celou obrazovku.

Po výběru modulu se sidebar zavře.

Breadcrumbs (blok 3)

Jeden řádek pod horní lištou.

Horizontální scroll, zkrácený tvar (např. … › Nemovitosti › A-101).

Common actions (blok 5)

Krátká lišta pod breadcrumbs.

Akce v podobě ikon + krátký text.

Když je málo místa, může se schovat pod tlačítko „⋯“.

Content (blok 6)

Zobrazuje buď:

přihlašovací formulář,

přehled (list) – přes celou obrazovku,

nebo detail (formulář) – přes celou obrazovku.

U vazeb (list + detail) se na mobilu používá režim nejdřív list → pak detail, ne dva panely vedle sebe.
---

### 🎨 Ikony (standardizace UI)

Aplikace používá **jediný centrální zdroj ikon**, který je uveden v souboru:
📁 [`icon.md`]

Tento soubor definuje:

* seznam dostupných ikon (emoji) pro všechny moduly,
* použití ikon v tlačítkách, přehledech i formulářích,
* jednotný styl – každá akce nebo entita má přiřazenou svou ikonu.

Ikony jsou součástí návrhu UI a nejsou nahrazovány SVG knihovnami.

Pro přidávání ikon do modulů a komponent používejte pouze ikony z tohoto seznamu.


---

## 🔍 STRUKTURA DETAILU ENTITY

### část 8: Hlavní karta s detailem entity kterou jsem vybral ve view

* Formulář hlavních údajů (více sloupců podle šíře obrazovky)
* Volitelně: kontakty, metadata, štítky 
* Přílohy (foto, skeny, dokumenty)
* Systémové údaje (vytvořil, datum, čas)

### ostatní záložky 2+ : Vazby (blok 9)

Každá záložka obsahuje:

* **nahoře seznam** (max. 10 položek + scroll)
* **dole detail** vybrané položky (formulář nebo komponenta)
* žádná záložka nikdy neobsahuje pouze seznam nebo pouze detail

---

## ⚖️ FIXNÍ POŘADÍ ZÁLOŽEK

Záložky mají ve všech modulech stejné, fixní pořadí. Příklad:

| Pozice | Obsah               |
| ------ | ------------------- |
| 1      | Vazba: Pronajímatel |
| 2      | Vazba: Nemovitosti  |
| 3      | Vazba: Jednotky     |
| 4      | Vazba: Nájemníci    |
| 5      | Vazba: Smlouvy      |
| 6      | Vazba: Platby       |
| 7      | Vazba: Finance      |
později možná další...



---

## 👥 VAZBY MEZI ENTITAMI

| Entita       | Vazby (1:N)                         | Pravidla                                    |
| ------------ | ----------------------------------- | ------------------------------------------- |
| Pronajímatel | Nemovitosti                         | Každý pronajímatel má 1+ nemovitostí        |
| Nemovitost   | Jednotky, Měřidla, Finance, Přílohy | Každá nemovitost má 0+ jednotek, 0+ měřidel |
| Jednotka     | Nájemník                            | Každá jednotka má 0 nebo 1 nájemníka        |
| Nájemník     | Smlouvy                             | Každý nájemník má 1+ smluv                  |
| Smlouva      | Služby, Platby, Dokument, Přílohy   | Vždy navázána na jednotku i nájemníka       |
| Služba       | Měřidlo nebo jiný výpočet ceny      | Možno propojit s měřidlem                   |
| Platba       | Smlouva                             | Každá platba přísluší ke smlouvě            |
| Dokument     | Generován ze smlouvy (do budoucna)  | Aktuálně ruční příloha                      |
| Přílohy      | U každé entity                      | Nelze mazat, lze archivovat                 |

---

## 📂 CHOVÁNÍ PŘÍLOH

* Každá entita může mít 0+ příloh
* Podporované typy: JPG, PNG, PDF, Word, Excel...
* Nelze mazat, pouze archivace
* Budoucí podpora verzování
* Zobrazováno v sekci "Přílohy" v hlavní kartě

---

## 🌐 DALŠÍ GLOBÁLNÍ PRAVIDLA

* Sidebar se nikdy nemění, jen zvýrazní aktivní modul
* CommonActions se vždy vztahují k aktuální entitě
* Breadcrumbs ukazuje vždy celou cestu a aktivní podzáložku
* Formulář je dvousloupcový, rozdělený do sekcí (profil, systém, ...)
* Vždy kombinace seznam + detail (nikdy jen jedno)

---

## 📊 ZÁVĚR

Tato specifikace je jednotný základ pro tvorbu modulů, UI komponent i logiky vazeb. Může být importována jako `UI-specifikace.md` do root složky Git repozitáře nebo nástroje jako Codex.

Další verze bude rozšířena o komponenty, styly a vazby na API (Supabase).
## 🧱 Rozložení aplikace – UI layout (verze 2025)

Tato aplikace používá jednotné 9-blokové rozhraní. Všechny obrazovky mají fixní strukturu, která se nemění mezi moduly.

### 🔢 Rozdělení do 9 částí:

```
1. Home button       (logo aplikace, návrat na přehled)
2. Sidebar           (menu modulů)
3. Breadcrumbs       (navigace Domů > Entita > Detail)
4. Home actions      (uživatel, notifikace, hledání, odhlášení)
5. Common actions    (akce pro danou entitu – export, mazání, archivace…)
6. Content           (hlavní pracovní plocha)
7. Přehled           (seznam záznamů – tabulka)
8. Detail entity     (formulář s více částmi – vždy po kliknutí na řádek)
9. Vazby             (záložky s přehledy jiných modulů)
```

---

## 🔍 Detailní chování částí

### 7. Přehled (list)

* Zobrazuje výpis záznamů jako tabulku
* Vždy umožňuje:

  * Fulltextové hledání
  * Filtrování podle sloupců
  * Seřazení každého sloupce
* První sloupec je **typový** – má barvu podle typu
* Dvojklik na řádek → přechod do detailu (část 8)

---

### 8. Detail entity

* Zobrazí se po výběru z přehledu
* Skládá se z více záložek (viz část 9)
* První záložka = **hlavní karta** (vlastnosti entity)
* Každá část má:

  * Hlavní formulář (dvousloupcový)
  * Přílohy (upload souborů)
  * Systémové údaje (vytvořil, datum atd.)

---

### 9. Vazby (Connections)

* Vazby jsou ZÁLOŽKY v detailu entity

* Každá záložka má:

  * Nahoře **seznam** (max. 10 položek + posuvník)
  * Dole **detail první položky** (formulář nebo komponenta)
  * Možnost přepínat šipkami (předchozí / další)

* Typické vazby:

  * Pronajímatel → Nemovitosti
  * Nemovitost → Jednotky
  * Jednotka → Nájemník
  * Nájemník → Smlouvy
  * Smlouva → Platby
  * Smlouva → Dokumenty

---

## 🔄 Přílohy

* Každý formulář má možnost nahrávat přílohy (sekce)
* Formáty: PDF, DOCX, obrázky, XLS, atd.
* Přílohy:

  * **nejdou mazat** – jen **archivovat**
  * V budoucnu: možnost verzování

---

## 🧾 Fixní pozice záložek

Pořadí záložek (část 9) se **nikdy nemění** – např.:

1. Hlavní karta (detail aktuální entity)
2. Vazba 1 (např. Jednotky)
3. Vazba 2 (např. Nájemníci)
4. Vazba 3 (např. Smlouvy)
5. Vazba 4 (např. Platby)
6. Vazba 5 (např. Dokumenty)

