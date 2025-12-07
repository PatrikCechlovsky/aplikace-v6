# /docs/archive/03-ui-notes.md
## Popis: Archiv starších úvah, rozpracovaných konceptů a nepoužitých návrhů UI.
---

# ARCHIV – UI SYSTEM (poznámky, nápady, koncepty)

Tento archiv obsahuje texty, které vznikly během vývoje UI systému, ale nepatří do finální dokumentace.  
Slouží jako historický zdroj a nikdy se nesmí mazat.

---

## 🔸 1. Původní nejasné úvahy o layoutu

- “Možná dáme CommonActions nahoru nad Breadcrumbs?”  
- “Sidebar by mohl být úplně vlevo nebo vyskakovací.”  
- “Možná potřebujeme 7 sekcí místo 6.”  

Tyto koncepty byly vyzkoušeny, ale nakonec definitivně opuštěny.

---

## 🔸 2. Nepoužité návrhy Sidebaru

### Varianta A – Sidebar vpravo  
Nikdy nebyl implementován, kolidoval by se zvyklostmi uživatelů.

### Varianta B – Sidebar jako “floating panel”  
Zvýšilo by to složitost a narušilo konzistenci.

---

## 🔸 3. Testovací návrhy ikon a stylů

- původní ikony měly pozadí, rámeček nebo barevný “bubble”  
- zkoušeli jsme emoji v názvech modulů  
- testovali jsme různé velikosti ikon v Sidebaru  

Výsledek:  
Jednotný `getIcon(name)` je nejlepší řešení.

---

## 🔸 4. UI návrhy, které byly příliš složité

- breadcrumb trail s nekonečnou šířkou  
- dvě lišty CommonActions (horní + spodní)  
- možnost přepínat layout mezi „compact“ a „spread“  
- více než 3 úrovně menu v Sidebaru  

Bylo uznáno za nadbytečné.

---

## 🔸 5. Původní úvahy o validaci formulářů

- ruční validace v jednotlivých komponentách  
- ukládání stavu formuláře do Reduxu  
- serializace každého pole do JSONu  

Výsledek:  
FormStateManager bude řešit vše centralizovaně.

---

## 🔸 6. Odmítnuté koncepty interakce

- “drag & drop” přesun dlaždic  
- reorder modulů v Sidebaru uživatelem  
- automatické ukládání každé změny  
- inline editace přímo v přehledech  

V budoucnu možné, ale nyní mimo scope.

---

## 🔸 7. Experimentální náčrty přehledů

Několik variant, které nebyly použity:

- přehledy ve stylu card-grid místo tabulek  
- timeline záznamů pro všechny entity  
- barevné zvýraznění řádků podle stavu  

Aplikace bude mít tabulkový engine ve standardní podobě.

---

## 🔸 8. Staré nápady na mobilní UI

- dvouřádkový Sidebar  
- permanentní “action bar” dole  
- swipe gesta pro CommonActions  

Nepoužito, příliš složité na implementaci.

---

## 🔸 9. Různé útržky z diskuzí během vývoje

Tyto texty jsou zachované bez úprav:

- “Breadcrumbs se mi nějak nezdají, možná udělat vertical breadcrumbs?”  
- “Ty barvy v CommonActions musí být pastelové!”  
- “Udělejme fullscreen modal pro formuláře.”  
- “UI musí být jako APERPR, ale hezčí.”  

Slouží jako historická stopa rozhodovacích procesů.

---

# 📌 Závěr archivu

Tento archiv se bude dále rozšiřovat o veškeré původní poznámky, které nepatří do hlavní dokumentace UI systému.

