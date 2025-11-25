# UI-specifikace.md

> Konečná verze standardů pro agenty, layout a logiku modulů v aplikaci "Pronajímatel".

---

## 📘 GLOBÁLNÍ STRUKTURA UI

### 9-blokový layout (vždy aktivní)

1. **Home Button** (logo v levém horním rohu)
2. **Breadcrumbs** (cesta k aktuální entitě)
3. **Home Actions** (vyhledávání, profil, notifikace, odhlášení)
4. **Common Actions** (akce nad entitou - editace, archivace, ...)
5. **Vazby** (další související entity, zobrazované jako záložky)
6. **Tabs** (hlavní záložky detailu entity)
7. **Detail Entity** (formulář + sekce, přílohy, systém)
8. **Sidebar** (menu modulů v levém sloupci)
9. **List View** (přehled dat v modulu)

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

