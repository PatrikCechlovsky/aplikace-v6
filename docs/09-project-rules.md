# 09 – Pravidla projektu (Project Rules & Codestyle Bible)

Tento dokument je hlavní závaznou příručkou projektu Pronajímatel v6. Obsahuje veškerá projektová pravidla, architekturu, codestyle, UI/UX standardy, modulový systém, workflow, bezpečnost, RLS, verzování, dokumentaci a testování.

--------------------------------------------------------------------
1. ÚČEL DOKUMENTU
--------------------------------------------------------------------
Cílem je vytvořit jednotný systém pravidel, který zajistí:
- konzistentní chování aplikace,
- předvídatelný vývoj,
- snadnou orientaci v projektu,
- dlouhodobou udržitelnost,
- žádné duplicity kódu,
- jedno místo, kde jsou všechna závazná pravidla.

--------------------------------------------------------------------
2. GLOBÁLNÍ PRINCIPY
--------------------------------------------------------------------
- Jediný zdroj pravdy → dokumentace 01–10 + tento soubor.
- Jednoduchost před magií – kód musí být čitelný.
- Nesmí vznikat duplicitní logika ani duplicitní komponenty.
- UI používá jednotný systém komponent.
- Dokumentace se aktualizuje při každé změně.
- Modulový systém je dynamický a vždy konzistentní.
- Při pochybnostech volíme jednodušší řešení.

--------------------------------------------------------------------
3. STRUKTURA REPOZITÁŘE
--------------------------------------------------------------------
/app  
  /UI – Sdílené UI komponenty  
  /modules – Moduly (010–900)  
  AppShell.tsx – Hlavní layout  

/docs  
  01–10 – Systémová dokumentace  
  archive/ – Historické verze  

/services – Byznys logika a CRUD operace  
/lib – Helpery, utility  
/scripts – Systémové skripty  
/globals.css – Hlavní CSS  

--------------------------------------------------------------------
3.1 Závazná pravidla pro soubory
--------------------------------------------------------------------
- AppShell.tsx obsahuje pouze layout (6-sekční systém).
- /UI obsahuje pouze sdílené komponenty.
- /modules obsahuje logiku modulů a tiles.
- /services obsahuje veškeré volání Supabase a datovou logiku.
- /lib obsahuje helpery.
- /scripts pouze pomocné nástroje.

--------------------------------------------------------------------
4. MODULOVÝ SYSTÉM
--------------------------------------------------------------------
Každý modul obsahuje:
- module.config.js  
- tiles/  
- components/ (volitelné)  

module.config.js:
id  
label  
icon  
order  
enabled  
tiles  

Moduly se načítají dynamicky → sidebar se generuje automaticky.

--------------------------------------------------------------------
5. UI/UX STANDARDY
--------------------------------------------------------------------
5.1 Šestisekční layout
1. HomeButton  
2. HomeActions  
3. Sidebar  
4. CommonActions  
5. EntityList / EntityDetailFrame  
6. Detailní panely a vazby  

5.2 Barvy a témata
- light/dark režim plně podporovaný
- aktivní záznam musí být viditelný
- šipky a ikonografie musí měnit barvu dle theme

5.3 Povinné komponenty
- EntityList – přehled tabulky
- EntityDetailFrame – detail s tabs
- RelationListWithDetail – seznam + detail
- ConfigListWithForm – konfigurační seznamy
- CommonActions – akce nad seznamy
- HomeActions – globální akce
- HomeButton – návrat na dashboard

--------------------------------------------------------------------
6. CODESTYLE – HLAVNÍ PRAVIDLA
--------------------------------------------------------------------
6.1 Hlavička souboru (povinná)
```
// FILE: app/modules/.../Soubor.tsx
// PURPOSE: Stručný popis souboru
```

6.2 Pojmenování
Komponenty → PascalCase  
Proměnné → camelCase  
CSS → kebab-case + BEM  
Typy → PascalCase  

6.3 Struktura komponent
1) importy  
2) typy  
3) state  
4) hooky  
5) handlery  
6) return JSX  

Zakázáno:
- inline styly  
- anonymní funkce v JSX  
- volat Supabase v UI  

6.4 Ikony
- používá se centrální mapa ikon
- žádné importy ikon v jednotlivých komponentách

6.5 Styly
- pouze v globals.css
- modulové CSS jen výjimečně

--------------------------------------------------------------------
7. ARCHITEKTURA LOGIKY
--------------------------------------------------------------------
Tok dat:
UI → handler → service → supabase → service → UI  

UI nesmí:
- řešit datovou logiku,
- provádět validace,
- formátovat data,
- volat Supabase.

Služby (/services) obsahují veškerou logiku.

--------------------------------------------------------------------
8. AUTH, RLS A BEZPEČNOST
--------------------------------------------------------------------
Pravidla:
- 100 % dotazů musí projít RLS.
- Žádné service_role klíče na frontendu.
- Každá tabulka musí mít owner_id.
- Role: user, admin, system.

--------------------------------------------------------------------
9. WORKFLOW A GIT
--------------------------------------------------------------------
Větve:
- main – stabilní  
- dev – integrační  
- feature/... – nové změny  

Commity:
feat:  
fix:  
refactor:  
docs:  
chore:  

PR pravidla:
- vždy popsat změnu
- uvést, zda byla aktualizována dokumentace

--------------------------------------------------------------------
10. DOKUMENTACE
--------------------------------------------------------------------
Pravidla:
- změny v modulech → 04-modules.md  
- změny v datech → 06-data-model.md  
- změny v UI → 03-ui-system.md  
- změny pravidel → tento dokument  

Dokumenty musí být jednoznačné a přehledné.

--------------------------------------------------------------------
11. VERZOVÁNÍ
--------------------------------------------------------------------
major.minor.patch  
6.1.0 – nový modul  
6.1.1 – minor fix  

--------------------------------------------------------------------
12. PRÁCE S AI
--------------------------------------------------------------------
- AI musí vždy dodat kompletní soubor  
- AI nesmí měnit strukturu bez svolení  
- AI nesmí vytvářet duplicity  
- AI musí respektovat veškeré standardy tohoto dokumentu  
- Jakékoliv nové vzory → doplnit sem  

--------------------------------------------------------------------
13. TESTOVÁNÍ
--------------------------------------------------------------------
- UI smoke testy  
- kontrola konzole  
- zákaz varování a chyb  
- zákaz TODO v produkčním kódu  

--------------------------------------------------------------------
14. DEPLOY
--------------------------------------------------------------------
- Vercel pro FE  
- Supabase pro BE  
- .env.local nesmí být commitován  
- migrace DB musí být zdokumentovaná  

--------------------------------------------------------------------
15. TL;DR SUMMARY
--------------------------------------------------------------------
1. Povinná hlavička FILE + PURPOSE.  
2. Žádné volání Supabase z komponent.  
3. Logika v services.  
4. Sidebar je dynamický.  
5. Žádné duplicity.  
6. Každá změna = změna dokumentace.  
7. CSS pouze v globals.css.  
8. Ikony pouze centrální.  
9. Kód musí být čitelný.  
10. RLS musí být funkční.  

--------------------------------------------------------------------
16. HISTORICKÁ ČÁST
--------------------------------------------------------------------
---

## DOPLNĚNÍ (2025-12-12) – Pravidla dokumentace a UI nastavení

### Append-only dokumentace (nic nemažeme)
- Dokumentaci **nikdy nemažeme**. Pokud se něco mění, přidává se nová sekce „DOPLNĚNÍ (YYYY-MM-DD)“.
- Starší text zůstává kvůli historii; nové doplnění má přednost (pokud je v rozporu, uvést to výslovně).

### UI nastavení (source of truth)
UI nastavení (vzhled a rozložení) se řídí jednotným tokem:
1) **Zdroj dat:** `uiConfig` (typy + defaulty v kódu)
2) **Perzistence:** `localStorage` (uživatelská volba přepisuje default)
3) **Aplikace tříd:** `AppShell.tsx` aplikuje className na `.layout`
4) **Styly:** globální CSS proměnné + theme/accent/ikony režimy v `globals.css` a `app/styles/**`

### Povinné pravidlo pro nové UI volby
- Každá nová UI volba (např. nový režim menu, nová varianta ikon, nové téma) musí mít:
  - zápis do dokumentace (min. 5–10 řádků) v příslušném doc souboru
  - jasně pojmenovaný klíč v `uiConfig`
  - jasně pojmenovaný klíč v `localStorage` (pokud se ukládá)

--------------------------------------------------------------------
## DOPLNĚNÍ (2025-12-12) – Pravidla pro TODO dokumenty a Markdown
--------------------------------------------------------------------

### TODO / roadmap / checklist dokumenty
- Dokumenty typu **TODO, roadmapa, checklist** musí zůstat **v jednom souvislém Markdown bloku**.
- Cílem je:
  - nerozbité číslování,
  - funkční checkboxy,
  - čitelná historie změn.

### ZÁKAZ fenced code blocků v TODO
- V TODO dokumentech je **zakázáno používat fenced code blocky**:
  ```md
  ```js
  code
- Důvod:
- fenced code block **rozbíjí seznamy**
- ukončuje checklist
- způsobuje nekonzistentní render (GitHub / VS Code / Obsidian)

### Povolené způsoby zápisu technických informací v TODO
- **Inline kód** je povolen:
- `handleModuleSelect({ moduleId, sectionId, tileId })`
- **Datové struktury** zapisovat textově:
- SidebarSelection:
  - moduleId: string
  - sectionId?: string | null
  - tileId?: string | null
- Technické poznámky psát jako běžný text, ne jako blok kódu.

### Kód patří mimo TODO
- Pokud je nutné uvést:
- ukázkový kód
- API kontrakt
- TypeScript definice
→ patří do:
- samostatné kapitoly „Poznámky“
- nebo do samostatného `.md` souboru (spec / návrh)

### Shrnutí pravidla
> TODO dokumenty = **plán práce**, ne technická specifikace.  
> Žádné fenced code blocky, žádné rozbíjení struktury.

## Struktura zdrojových souborů

- Každý zdrojový soubor má pevně danou strukturu sekcí.
- Struktura je závazná pro všechny moduly a komponenty.
- Cílem je čitelnost, rychlá orientace a snadná údržba.

### Povinné pořadí sekcí

- 1) IMPORTS
- 2) TYPES
- 3) HELPERS
- 4) DATA LOAD
- 5) ACTION HANDLERS
- 6) RENDER

- Sekce se nepřeskakují ani neslučují.
- Pokud sekce není potřeba, zůstává prázdná nebo je výslovně vynechána s komentářem.

---

## Dělení souborů na kratší části

- Dlouhé soubory se povinně dělí na menší logické celky.
- Jedna část má maximálně přibližně 100 řádků.
- Cílem je snadná práce, revize a kopírování částí kódu.

### Způsob dělení

- Používá se číslování částí:
  - (1/3), (2/3), (3/3)
- Při jemnějším dělení:
  - 3a, 3b, 3c

- Každá část musí být samostatně čitelná.
- Části se nesmí překrývat významově.

---

## Pravidla pro úpravy kódu

- Úpravy se provádějí vždy po celých blocích nebo sekcích.
- Neprovádějí se „jednokouskové“ změny bez kontextu.
- Pokud se mění logika, mění se celý související blok.

- Cílem je:
  - minimalizovat regresní chyby,
  - zachovat čitelnost historie změn,
  - usnadnit code review.

---

## Pravidla pro kopírování a sdílení kódu

- Kód musí být strukturován tak, aby šel kopírovat po logických blocích.
- Každý blok musí mít jasný začátek a konec.
- Kód nesmí být závislý na skrytém kontextu mimo blok.

- Pokud kód nelze bezpečně zkopírovat, je struktura považována za chybnou.

---

## Konzistence napříč projektem

- Stejná pravidla platí pro:
  - frontend,
  - backend,
  - utility,
  - skripty,
  - testy.

- Výjimky musí být:
  - odůvodněné,
  - zdokumentované,
  - výslovně označené.

---
## Jednotné formátování dat a času

- Zobrazení data a času je v aplikaci sjednocené.
- Používá se jednotný formát napříč celým UI.

- Standardní formát:
  - datum: dd.mm.rrrr
  - datum a čas: dd.mm.rrrr hh:mm

- Formátování se neprovádí lokálně v komponentách.
- Používá se centrální formatter.

- Přímé zobrazování surových datových hodnot je zakázáno.
- Nekonzistentní formát je považován za chybu UI.

---

## Závaznost formátování

- Pravidla platí pro všechny moduly a entity.
- Platí i pro budoucí rozšiřování aplikace.
- Výjimky musí být výslovně zdokumentovány.

---

## Závaznost pravidel

- Tato pravidla jsou závazná pro celý projekt.
- Platí pro veškerý nový i upravovaný kód.
- Porušení pravidel je považováno za chybu návrhu nebo implementace.

--------------------------------------------------------------------
## DOPLNĚNÍ (2025-01-XX) – Historie hodnot v formulářových polích
--------------------------------------------------------------------

### Povinné použití historie v formulářích

- **Všechna textová input pole** v formulářích musí používat komponentu `InputWithHistory`.
- Historie automaticky ukládá posledních 5 hodnot pro každé pole.
- Historie se zobrazuje jako HTML5 datalist při psaní do pole.

### Implementace

- Používá se komponenta `InputWithHistory` z `app/UI/InputWithHistory.tsx`.
- Každé pole má unikátní `historyId` ve formátu `{modul}.{pole}` (např. `user.email`, `myAccount.phone`).
- Historie se ukládá do localStorage při ztrátě focusu (blur).
- V read-only režimu se historie nezobrazuje.

### Pravidla pro historyId

- Formát: `{kontext}.{názevPole}`
- Příklady:
  - `user.email` – email v formuláři uživatele
  - `user.phone` – telefon v formuláři uživatele
  - `myAccount.firstName` – jméno v Můj účet
  - `invite.email` – email v pozvánce
  - `genericType.{title}.code` – kód v generickém typu (dynamický podle title)

### Kdy použít historii

- **Použít:** Textová pole (text, email, tel), kde uživatel opakovaně zadává podobné hodnoty.
- **Nepoužít:** Password pole, selecty, textarea (mimo speciálních případů), read-only pole.

### Technické detaily

- Utility: `app/lib/formHistory.ts` – funkce pro správu historie
- Komponenta: `app/UI/InputWithHistory.tsx` – wrapper kolem inputu s historií
- Storage: localStorage s prefixem `form_history_`
- Maximální počet hodnot: 5 (konstanta `MAX_HISTORY_ITEMS`)

### Příklad použití

```tsx
import InputWithHistory from '../../../UI/InputWithHistory'

<InputWithHistory
  historyId="user.email"
  className="detail-form__input"
  type="email"
  value={val.email}
  onChange={(e) => update({ email: e.target.value })}
/>
```

### Závaznost

- Při vytváření nových formulářů je **povinné** použít `InputWithHistory` pro všechna textová pole.
- Při úpravě existujících formulářů je **povinné** nahradit standardní `<input>` za `<InputWithHistory>`.
- Výjimky musí být výslovně zdokumentovány.
