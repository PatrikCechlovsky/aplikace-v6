# UI-specifikace.md

> Konečná verze standardů pro agenty, layout a logiku modulů v aplikaci "Pronajímatel".

---

## 📘 GLOBÁLNÍ STRUKTURA UI

### 9-blokový layout (vždy aktivní)

1. **Home Button** (logo v levém horním rohu)
2. **Breadcrumbs** (cesta k aktuální entitě)
3. **Home Actions** (vyhledávání, profil, notifikace, odhlášení)
4. **Common Actions** (akce nad entitou - editace, archivace, ...)
5. **Sidebar** (menu modulů v levém sloupci)
6. **Content** (hlavní pracovní plocha) ve které se zobrazují:
7. ***List View*** (přehled dat v modulu)proklikem se zobrazí záložka s konkrétním detailem enity adalčí záložky vazby
8. ***Detail Entity*** jedná se o hlavní formulář určený také pro změnu entity kterou jsem vybral v List View (formulář + sekce u každého modulu jiné, přílohy, systém)
9. ***Vazby*** (další související entity, zobrazované jako záložky) kdy každá záložka kromě hlavního pohledu "detail entity" bude dále rozdělené na dvě části:
10. ****Tabs**** (seznam všech vazeb v dané entitě) 
11. ****Detail entity**** (detail entity ze seznamu Tabs) s možností přepínat další a předcchozí záznam

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

