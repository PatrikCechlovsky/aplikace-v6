# /docs/archive/04-modules-notes.md
## Popis: Archiv starých plánů, návrhů, diskusí a konceptů modulového systému Pronajímatel v6.
---

# ARCHIV – MODULES (původní poznámky a koncepty)

Tento archiv obsahuje starší verze návrhů modulů, rozpité myšlenky, testovací úvahy a alternativní architektury, které byly během vývoje projektu vytvořeny, ale nepatří do finální specifikace modulového systému.

NIC zde nesmí být smazáno.

---

## 🔸 1. Původní seznam modulů (verze 0.1)

Toto je úplně první návrh z počáteční fáze projektu:

```
Nemovitosti
Jednotky
Smlouvy
Nájemníci
Finance
Servis
Dokumenty
Uživatelé
Nastavení
```

Tehdy ještě moduly:

- neměly číselné prefixy,  
- neměly pořadí,  
- nebyly modulární,  
- byly definovány jen slovně.

---

## 🔸 2. Alternativní struktura modulů, která nebyla použita

Text z počátku vývoje:

> „Moduly by mohly být volitelné a mohly by se načítat přes pluginový systém…“

Tato varianta počítala s:

```
modules/
  real-estate/
  tenants/
  contracts/
```

Důvod opuštění:

- absence třídění  
- nedostatečná přehlednost  
- slabá integrace s UI layoutem  

---

## 🔸 3. Myšlenka modulů jako micro-frontends

Uvažovaná, ale opuštěná:

```
Každý modul by mohl být samostatná aplikace,
která se do hlavního systému připojí jako iframe nebo remote bundle.
```

Důvod opuštění:

- extrémní komplexita  
- zbytečné pro tým o 1–3 lidech  
- náročné na údržbu  
- nekompatibilní s App Routerem  

---

## 🔸 4. Staré poznámky o konfiguračním systému modulů

Původní návrh `module.config.js`:

```
{
  id: 'nemovitosti',
  page: '/nemovitosti'
}
```

Později jsme doplnili:

- názvy  
- ikonky  
- pořadí  
- enabled  
- definice akcí  
- budoucí permissions  

---

## 🔸 5. Nepoužitý návrh „mega modulu“

Jedna z raných úvah:

> „Možná dáme smlouvy, nájemníky a platby do jednoho velkého modulu, aby to bylo jednodušší.“

Nakonec bylo rozhodnuto:

- každý logický celek musí být samostatný  
- UI musí být přehledné  
- moduly nesmí být přetížené  

---

## 🔸 6. Poznámky k plánování modulů v chatu

Různé útržky, které jsme si během vývoje psali:

- „Moduly musí jít vypnout/zapnout.“  
- „Musí se načítat dynamicky podle configu.“  
- „Každý modul musí mít uniformní strukturu kvůli generování.“  
- „V budoucnu můžeme přidat modul Stavební deník.“  
- „Dokumenty budou možná propojené s Komunikací.“  
- „Sloučení modulů by byla chyba, všechno musí být oddělené.“

Všechny tyto úvahy jsou zachované zde.

---

## 🔸 7. Staré testovací schéma modulů pro Sidebar

```
Sidebar:
  - Domů
  - Entities
      - Real estate
      - Tenants
      - Units
  - System
      - Settings
      - Users
```

Dnes máme modulový systém s číselným prefixem:

```
010-user
020-account
030-pronajimatele
040-nemovitosti
...
900-nastaveni
```

---

## 🔸 8. Koncept modulových šablon (generátor modulů)

Původní poznámka:

> „Bylo by super mít generátor modulů, který vytvoří strukturu, formuláře, tiles a overview.“

Tento koncept stále dává smysl, ale zatím není implementovaný.

Archivováno pro budoucí využití.

---

## 🔸 9. Stará myšlenka modulových akcí

Původní nápad:

> „Akce budou definované v každém souboru zvlášť.“

Důvody opuštění:

- neudržitelné  
- rozbitá konzistence  
- nutnost generovat CommonActions dynamicky  

---

## 🔸 10. Další historické poznámky

Úryvky textu:

- „Moduly by mohly mít vlastní mini-dashboard.“  
- „Dokumenty mohou být modul i služba.“  
- „Měřidla budou asi potřebovat napojení na IoT.“  
- „Stavby a opravy by mohly být modul Údržba.“  
- „Moduly mohou být propojené přes Graph API.“  

Vše zatím v archivu.

---

# 📌 Závěr archivu

Tento archiv uchovává kompletní historii návrhů modulového systému.  
Slouží jako zdroj inspirace a dokumentace rozhodnutí, která nás vedla k finální podobě modulů.

