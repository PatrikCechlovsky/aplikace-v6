# /docs/04-modules.md
## Popis: Tento dokument popisuje modulární systém aplikace, strukturu modulů, jejich účel, konfiguraci a stav implementace.
---

# 04 – Modulový systém

## 1. Úvod: Proč moduly?

Aplikace Pronajímatel v6 je navržena jako modulární systém, kde každá funkční oblast (Subjekty, Nemovitosti, Smlouvy, Platby…) existuje jako samostatný modul.

Díky tomu:
- UI je přehledné
- vývoj může probíhat nezávisle
- oprávnění se dají řídit na úrovni modulů
- modul lze zapnout/vypnout
- systém je připravený na budoucí rozšíření

---

## 2. Struktura modulu (filesystem)

Každý modul se nachází v cestě:

```
app/modules/<id>-<nazev>/
```

Obsahuje minimálně:

```
module.config.js
overview/
forms/
tiles/
```

### Význam složek

- **module.config.js** – hlavní konfigurační soubor
- **overview/** – seznamy, přehledy
- **forms/** – formuláře
- **tiles/** – detailní pohledy, typy, nastavení

Modul může obsahovat jen to, co potřebuje. Flexibilní architektura.

---

## 3. module.config.js – povinný základ modulu

Každý modul musí obsahovat konfigurační objekt:

```
export default {
  id: '040-nemovitosti',
  label: 'Nemovitosti',
  icon: 'building',
  order: 40,
  enabled: true,

  // připravené rozšíření:
  // commonActions: { overview: [...], detail: [...], form: [...] }
}
```

### Účel vlastností

| Vlastnost | Význam |
|----------|--------|
| `id` | Unikátní identifikátor modulu |
| `label` | Zobrazený název |
| `icon` | Ikona v sidebaru |
| `order` | Určuje pořadí v navigaci |
| `enabled` | Aktivace/deaktivace modulu |
| `commonActions` | (V2) akce pro seznamy, detaily a formuláře |

---

## 4. Dynamické načítání modulů

Moduly se nenačítají staticky.

Sidebar načítá:
1. registry modulů,
2. filtruje `enabled === true`,
3. třídí podle `order`,
4. zobrazuje ikonu a název.

Klik → změní `activeModuleId` → Content Engine načte přehled/detaily/formuláře modulu.

Díky tomu UI neví nic o konkrétních modulech — funguje jako framework.

---

## 5. Seznam modulů 010–900

### 010 – Správa uživatelů
- identity, metadata
- role uživatele
- do budoucna: nastavení profilu, audit log

### 020 – Můj účet
- základní informace o uživateli
- změna hesla, 2FA (budoucí)

### 030 – Pronajímatelé (Subjekty)
- fyzické a právnické osoby
- kontaktní údaje
- role subjektu
- napojení na další moduly

### 040 – Nemovitosti
- budovy, domy, objekty
- základní údaje
- propojení na jednotky, měřidla

### 050 – Jednotky
- byty, kanceláře, komerční prostory
- kapacita, dispozice
- propojení na nájemníky

### 060 – Nájemníci
- osoby nebo firmy
- kontakt, vztah k jednotce
- možnost více nájemníků na jednotku

### 070 – Smlouvy
- nájemní smlouvy
- dodatky, ukončení
- plán: automatická PDF generace

### 080 – Platby
- nájemné, zálohy, úhrady
- QR platba (v přípravě)
- účetní exporty

### 090 – Finance
- předpisy plateb
- vyúčtování
- agregace dat z měřidel a služeb

### 100 – Měřidla
- typy měřidel
- odečty
- návaznost na jednotky a služby

### 110 – Dokumenty
- ukládání PDF, obrázků
- emailové šablony
- auditní stopa komunikace

### 120 – Komunikace
- historie emailů
- připravované automatické notifikace

### 900 – Nastavení
Nejrozsáhlejší modul, aktuálně ve vývoji:

- typy a číselníky
- pořadí položek
- barevné schéma
- ikony
- konfigurace UI
- GenericTypeTile komponenta

Modul 900 je centrální místo pro nastavení celé aplikace.

---

## 6. Napojení modulů na UI

Moduly se automaticky napojují na:

- Sidebar — navigace
- Breadcrumbs — kontext
- CommonActions — akce podle typu obrazovky
- Content Engine — přehled/detaily/formuláře

Modul dodává pouze logiku a obrazovky.  
UI framework zajistí zbytek.

---

## 7. Budoucí rozšíření modulů

### 7.1 CommonActions v2
Moduly si budou moci definovat:
- akce v přehledu,
- akce v detailu,
- akce ve formuláři,
- podmínky viditelnosti (role, výběr záznamu, dirty state).

### 7.2 Nové moduly v plánu
- **Helpdesk / Servisní požadavky**
- **Integrace (banky, energie)**
- **Reporty (PDF generátor)**
- **Workflow (automatické procesy)**

---

## 8. Poznámky k zařazení (uchováváme vše)

- modul Dokumenty bude sdílet UI pro emaily
- některé moduly jsou závislé na datovém modelu (unit_types, subject_types…)
- GenericTypeTile bude používán v modulech jako standardní formulář typů
- modulární systém je navržen pro multi-tenant provoz

---

## 9. Závěr

Modulový systém je klíčový stavební prvek aplikace.

Umožňuje:
- rychlý vývoj,
- jasnou strukturu,
- lepší bezpečnost (oprávnění),
- postupné rozšiřování,
- oddělení UI od logiky.

Tento dokument slouží jako přehled a referenční příručka pro všechny moduly v systému.
