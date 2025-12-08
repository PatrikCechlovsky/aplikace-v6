# /docs/08-plan-vyvoje.md
## Popis: Strategický plán vývoje aplikace Pronajímatel v6 – krátkodobé, střednědobé a dlouhodobé cíle, milníky a roadmap.
---

# 08 – Plán vývoje

---

## 1. Úvod

Tento dokument popisuje plánovanou evoluci aplikace Pronajímatel v6.  
Slouží jako strategická roadmapa pro:

- technický rozvoj,
- doplňování funkcí,
- úpravy UI,
- integraci modulů,
- bezpečnostní a provozní aspekty.

---

## 2. Hlavní milníky

### Milník M1: Stabilní jádro aplikace
- plně funkční 6-sekční layout,
- přihlášení a odhlášení,
- dynamický Sidebar,
- Content engine,
- statické/částečně dynamické CommonActions.

### Milník M2: Modulární systém (v2)
- každý modul má vlastní přehled + formulář,
- module.config.js obsahuje:
  - commonActions,
  - permissions,
  - dynamické názvy,
  - typy tiles.

### Milník M3: Datový model + RLS
- hotový základ subjektů, nemovitostí, jednotek, smluv a plateb,
- definované RLS politiky,
- migrace ve verzích,
- příprava na import/export dat.

### Milník M4: Dokumenty + Komunikace
- generování PDF,
- možnost přikládat soubory,
- systém e-mailových šablon,
- ukládání odeslané komunikace do historie.

### Milník M5: Finanční modul (v1)
- předpisy plateb,
- skutečné platby,
- generování QR,
- přehled salda.

### Milník M6: Měřidla + Odečty
- evidence měřidel,
- odečty,
- přepočty služeb,
- příprava pro budoucí vyúčtování.

---

## 3. Krátkodobé cíle (0–3 měsíce)

### UI / UX
- dokončení breadcrumbs builderu,
- dynamická konfigurace CommonActions,
- jednotné UI všech modulů,
- základní validace formulářů.

### Backend / Supabase
- sjednocení datového modelu,
- doplnění auditních polí,
- RLS pokrytí všech tabulek.

### Moduly
- dokončení modulů: Nemovitosti, Jednotky, Nájemníci, Smlouvy,
- příprava modulů: Dokumenty, Komunikace.

---

## 4. Střednědobé cíle (3–12 měsíců)

### Aplikace
- interaktivní dashboard,
- reporting (výnosy, náklady, obsazenost),
- automatické notifikace.

### Integrace
- propojení s bankou (import plateb),
- nástroje pro integraci s energiemi (import odečtů).

### Mobilní UI
- lepší kompatibilita,
- responsive layout,
- rychlé akce.

---

## 5. Dlouhodobé cíle (12–36 měsíců)

- vyúčtování služeb,
- stavební/servisní modul,
- údržba a plán oprav,
- IoT integrace měřidel,
- API pro externí aplikace,
- komerční monetizace (SaaS model).

---

## 6. Prioritizační systém

### Priority:
- **P1** = nutné pro fungování systému,
- **P2** = výrazně zlepší hodnotu,
- **P3** = nice-to-have,
- **P4** = výhled > 1 rok.

Každá úloha v TODO listu má mít přiřazenou prioritu.

---

## 7. Verzovací systém

- major verze = velké změny (v6 → v7),
- minor verze = nové moduly/funkce (v6.1),
- patch verze = opravy chyb (v6.0.x),
- DB migrace musí být verzované.

---

## 8. Závěr

Tento plán vývoje popisuje směřování celé aplikace.  
Slouží jako přehled, orientační mapa i kontrolní mechanismus.  
Každý další krok vývoje musí odpovídat této roadmapě.

---

# 📜 Historické části dokumentu – PLÁN VÝVOJE  
*(zachováno pro historii, zatím minimální obsah)*

~~Původní nápad: roadmap nebudeme dělat, budeme improvizovat.~~  
Později bylo rozhodnuto, že roadmapa je nezbytná kvůli modulárnímu návrhu.

~~Zvažovalo se nemít milníky a psát vývoj „na přeskáčku“.~~  
Tento přístup byl zavržen.  

Tato sekce bude postupně růst, jakmile se budou měnit plány a vzniknou nové verze roadmapy.

