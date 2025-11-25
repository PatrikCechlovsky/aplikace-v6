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

### Záložka 1: Hlavní karta entity

* Formulář hlavních údajů (2 sloupce)
* Přílohy (foto, skeny, dokumenty)
* Systémové údaje (vytvořil, datum, čas)
* Volitelně: kontakty, metadata, štítky

### Záložky 2+ : Vazby (blok 5)

Každá záložka obsahuje:

* **nahoře seznam** (max. 10 položek + scroll)
* **dole detail** vybrané položky (formulář nebo komponenta)
* žádná záložka nikdy neobsahuje pouze seznam nebo pouze detail

---

## ⚖️ FIXNÍ POŘADÍ ZÁLOŽEK

Záložky mají ve všech modulech stejné, fixní pořadí. Příklad:

| Pozice | Obsah               |
| ------ | ------------------- |
| 1      | Hlavní karta entity |
| 2      | Vazba: Pronajímatel |
| 3      | Vazba: Nemovitosti  |
| 4      | Vazba: Jednotky     |
| 5      | Vazba: Nájemníci    |
| 6      | Vazba: Smlouvy      |
| 7      | Vazba: Platby       |
| 8      | Vazba: Finance      |

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

