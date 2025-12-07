# /docs/04-modules.md
## Popis: Kompletní specifikace modulového systému, struktury modulů, konfigurace, načítání, dynamiky a pravidel.
---

# 04 – MODULES  
*(Finální konsolidovaná verze)*

---

# 1. ÚVOD

Modulový systém je jedním z nejdůležitějších pilířů aplikace **Pronajímatel v6**.  
Každá funkční oblast aplikace existuje jako *samostatný modul*, který:

- má vlastní adresář,  
- vlastní konfiguraci,  
- vlastní formuláře a přehledy,  
- vlastní dlaždice,  
- a může mít i vlastní logiku.

Cílem této architektury je:

- snadné přidávání nových funkcí,  
- přehlednost,  
- oddělení jednotlivých částí aplikace,  
- možnost budoucího rozšíření,  
- a jasná kontrola nad CommonActions a oprávněními.

---

# 2. STRUKTURA MODULŮ

Každý modul má vlastní složku ve formátu:

```
app/modules/<id>-<nazev-modulu>/
```

Příklad:

```
app/modules/040-nemovitosti/
```

Uvnitř modulu najdeme:

```
module.config.js
tiles/
forms/
overview/
```

---

## 2.1 module.config.js

Každý modul má vlastní konfiguraci ve formě:

```js
export default {
  id: '040-nemovitosti',
  label: 'Nemovitosti',
  icon: 'building',
  order: 40,
  enabled: true,

  // Budoucí rozšíření:
  // commonActions: { overview: [...], detail: [...], form: [...] }
  // permissions: { roleA: [...], roleB: [...] }
}
```

### Povinné prvky:

- **id** – unikátní identifikátor modulu  
- **label** – název modulu  
- **icon** – ikona použitá v Sidebaru  
- **order** – pořadí v Sidebaru  
- **enabled** – zda je modul aktivní  

### Nepovinné / plánované prvky:

- `commonActions` – dynamická konfigurace akcí  
- `permissions` – restrikce podle role  
- `sections` – vnitřní části modulu  

---

## 2.2 tiles/

Složka obsahuje:

- definice dlaždic modulu  
- seznamy typů  
- přehledy typů  
- vizuální vstupní bod pro modul  

Dlaždice představují hlavní „výchozí akce“.

---

## 2.3 forms/

Obsahuje:

- detailní formuláře  
- editovací formuláře  
- logiku validace  
- konektory pro formStateManager  

---

## 2.4 overview/

Obsahuje:

- tabulkové přehledy  
- seznamy  
- filtry  
- napojení na CommonActions (requiresSelection)  

---

# 3. SEZNAM VŠECH MODULŮ (AKTUÁLNÍ STAV)

Z aplikace:

```
010 – Správa uživatelů
020 – Můj účet
030 – Pronajímatelé
040 – Nemovitosti
050 – Nájemníci
060 – Smlouvy
070 – Služby
080 – Platby
090 – Finance
100 – Měřidla
110 – Dokumenty
900 – Nastavení
```

Každý z těchto modulů bude mít vlastní dokumentaci (ve /docs/modules/), až dokončíme hlavní systém dokumentace.

---

# 4. MODULOVÝ ENGINE

Modulový engine:

- načítá všechny moduly  
- filtruje podle `enabled === true`  
- seřadí podle `order`  
- vrací seznam pro Sidebar  
- předává aktivní modul Content engine  
- bude řídit dynamické CommonActions  
- bude poskytovat data pro Breadcrumbs  

Zcela zásadní prvek celého UI.

---

# 5. DYNAMICKÉ NAČÍTÁNÍ MODULŮ

Moduly nejsou hardcodované.  
Jsou dynamicky zjišťovány:

```
import MODULE_SOURCES from '@/module-config'
```

Modulový engine nahrává:

- ID  
- popisky  
- icon  
- definice dlaždic  
- definice formulářů  

---

# 6. COMMON ACTIONS A MODULY

Budoucí rozšíření umožní, aby modul definoval svoje akce:

## Příklad:

```js
commonActions: {
  overview: ['add', 'delete'],
  detail: ['edit', 'archive'],
  form: ['save', 'cancel'],
}
```

Aplikace pak:

- vykreslí pouze akce povolené modulem  
- zkontroluje, zda uživatel má oprávnění  
- deaktivuje akce při chybějící roli nebo stavu  

---

# 7. PERMISSIONS & MODULES (PLÁN)

Každý modul může obsahovat:

```
permissions: {
  role_superadmin: ['view', 'edit', 'delete'],
  role_owner: ['view'],
}
```

Budoucí vrstvy services:

- permissionsService  
- sessionRoleProvider  

umožní:

- kontrolu oprávnění v UI  
- dynamické přizpůsobení Sidebaru  
- možnost skrýt celé moduly  

---

# 8. STAVY MODULŮ

Každý modul může být ve stavech:

### Aktivní  
zobrazuje se v Sidebaru, lze otevřít.

### Neaktivní  
`enabled: false` — skrývá se v Sidebaru.

### Podmíněný  
modul může být skryt:

- podle role  
- podle licence (budoucnost)  
- podle konfigurace tenancy (budoucnost)  

---

# 9. STRUKTURA MODULŮ DO BUDOUCNA

Plánujeme:

```
app/modules/
  040-nemovitosti/
    config/
    forms/
    views/
    tiles/
    services/
    components/
```

Tato struktura podporuje:

- oddělení UI od logiky  
- lepší přehlednost  
- možnost generování modulů z šablon  

---

# 10. ZÁVĚR

Modulový systém je základním stavebním kamenem aplikace.  
Zajišťuje:

- rozšiřitelnost  
- strukturu  
- pořádek  
- logickou izolaci  
- napojení na UI systém  

Je navržen tak, aby mohl růst s aplikací po mnoho let.

---

*Konec BLOKU A – finální verze dokumentu 04.*
