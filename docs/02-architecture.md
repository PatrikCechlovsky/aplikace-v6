# /docs/02-architecture.md
## Popis: Kompletní technická architektura aplikace Pronajímatel v6 – struktura projektu, vrstvy systému, modulový engine, služby a technologické principy.
---

# 02 – ARCHITECTURE  
*(Finální čistá konsolidovaná verze)*

---

# 1. ÚVOD

Tento dokument popisuje **architekturu aplikace Pronajímatel v6**:

- strukturu adresářů  
- vrstvy systému  
- modulový engine  
- způsob renderování UI  
- propojení se Supabase  
- plánované backend služby  

Cílem architektury je zajistit:

- čistý kód  
- snadné rozšiřování  
- konzistentní chování  
- jasnou logiku mezi UI, daty a moduly  
- bezpečné oddělení odpovědností  

---

# 2. TECH STACK

Aplikace je postavená na těchto technologiích:

- **Next.js 14 (App Router)**  
- **React + TypeScript**  
- **Supabase (Auth, Database, RLS)**  
- **TailwindCSS (UI stylování)**  
- **Vercel** pro nasazení  
- **Modulární architektura** (každý modul je izolovaný balík)

---

# 3. STRUKTURA PROJEKTU

Hlavní adresářová struktura:

```
app/
  UI/
    components...
  modules/
    010-uzivatele/
    020-muj-ucet/
    030-pronajimatele/
    ...
    900-nastaveni/
  services/
  layout.tsx
  providers.tsx

public/
supabase/
docs/
```

## 3.1 `app/modules/*`
Každý modul obsahuje:

```
module.config.js
tiles/
forms/
overview/
```

`module.config.js` definuje:

- ID modulu  
- název  
- ikonu  
- pořadí  
- aktivaci/deaktivaci  
- budoucí podporu commonActions + permissions  

## 3.2 `app/UI`
Obsahuje globální UI komponenty:

- layout v 6 sekcích  
- HomeButton  
- Sidebar  
- Breadcrumbs  
- HomeActions  
- CommonActions  
- Content wrapper  

## 3.3 `app/services`
Sem budou přidány backend/service-like vrstvy:

- `authService`  
- `permissionsService`  
- `commonActionsEngine`  
- `dynamicBreadcrumbsBuilder`  
- `formStateManager`  

Tyto služby umožní:

- čištění logiky v UI  
- vysokou opětovnou použitelnost  
- jasné oddělení zodpovědnosti  

---

# 4. VRSTVY APLIKACE

Aplikace je rozdělena do tří logických vrstev:

---

## 4.1 UI Layer
Vrstva obsahující:

- vizuální komponenty  
- layout  
- přehledy, formuláře, tiles  
- validaci vstupů  
- interakci uživatele  

UI je **stateless** tam, kde je to možné; stav drží vyšší vrstvy.

---

## 4.2 Domain / Logic Layer
Sem patří:

- služby  
- modularita  
- role a permissions  
- common actions engine  
- breadcrumbs engine  

Tato vrstva:

- dostává okolnosti z UI  
- provádí logiku  
- vrací rozhodnutí UI  

---

## 4.3 Data Layer (Supabase)
Obsahuje:

- tabulky  
- RLS politiky  
- schémata  
- entity  
- vztahy (1:N, M:N)  

Komunikace probíhá přes:

- Supabase klient  
- RLS pravidla  
- privileges  
- future “server actions”  

---

# 5. MODULÁRNÍ ARCHITEKTURA

Moduly jsou nezávislé bloky, které obsahují vše potřebné:

- konfiguraci modulu  
- tiles  
- formuláře  
- přehledy  

## 5.1 Načítání modulů

Aplikace:

1. Načte všechny soubory `module.config.js`  
2. Sestaví globální `MODULE_DEFINITION`  
3. Seřadí moduly podle `order`  
4. V renderu UI moduly dynamicky promapuje do Sidebaru  

---

## 5.2 Výhody architektury

- přidání nového modulu = přidání nové složky  
- každý modul může mít vlastní logiku  
- snadná údržba  
- čisté oddělení UI a dat  
- jednoduché rozšiřování  

---

# 6. ARCHITEKTURA RENDEROVÁNÍ (CONTENT ENGINE)

Obsahová část (sekce 5 UI layoutu) pracuje takto:

1. Uživatel klikne v Sidebaru na modul  
2. Aplikace nastaví `activeModuleId`  
3. Content engine najde odpovídající tile/overview/form  
4. Renderuje obsah podle kontextu  
5. CommonActions + Breadcrumbs dostanou informace o stavu obsahu  

Toto je základ budoucího:

- dynamického přepínání stavů  
- inteligentních CommonActions  
- automatických Breadcrumbs  

---

# 7. ARCHITEKTURA BACKEND SLUŽEB (PLÁN)

Plánované služby:

### authService
- práce s přihlášením  
- metadata uživatele  
- refresh session  

### permissionsService
- kontrola oprávnění  
- role-based logika  
- vazby na moduly a akce  

### commonActionsEngine
- rozhoduje, která akce má být aktivní  
- podle:
  - modulu  
  - view (overview/detail/form)  
  - stavu záznamu (dirty / clean)  
  - oprávnění  

### breadcrumbsBuilder
- dynamické generování cesty  
- modul / tile / detail  

### formStateManager
- sledování validace  
- ukládání  
- dirty/clean status  

---

# 8. BEZPEČNOST A RLS

RLS je klíčová, protože:

- každý uživatel vidí jen *své* záznamy  
- role zajišťují granularitu přístupů  
- RLS brání přímým SQL dotazům mimo oprávnění  

Architektura RLS je plně rozpracovaná v dokumentu **05 – Auth & RLS**.

---

# 9. ARCHITEKTURA DEPLOYMENTU (ZKRÁCENÝ POPIS)

- Vercel build  
- automatické deployments  
- environment variables  
- prod/staging prostředí  
- plán CI/CD  
- CLI nástroje Supabase  

Detailní popis je v **07 – Deployment**.

---

# 10. ZÁVĚR

Tato architektura poskytuje:

- čisté rozdělení vrstev  
- jasná pravidla mezi UI a logikou  
- bezpečný přístup k datům  
- škálovatelný modulární systém  
- budoucí možnosti rozšíření  

Modulární architektura Pronajímatel v6 je navržena tak, aby dlouhodobě podporovala růst a profesionální rozvoj aplikace.

---

*Konec BLOKU A – finální čistá verze dokumentu 02*
---

# 📜 Historické části dokumentu (archivní poznámky – NESMAZAT)

Níže uložené části textu pocházejí ze starších verzí dokumentace.  
Pro aktuální strukturu architektury již nejsou relevantní, ale zachováváme je pro zpětné dohledání.

---

### ~~Původní pracovní popis architektury~~

~~Aplikace je rozdělena na UI, moduly a data.  
Sidebar řídí aktivní modul a Breadcrumbs budou možná dynamické.~~

~~Tento popis byl neúplný a nahrazen plnou sekcí “Architecture”.~~

---

### ~~Starý návrh struktury projektových souborů~~

Původně jsme měli uvažovanou strukturu:

```
app/
  components/
  containers/
  pages/
```

~~Tato struktura byla opuštěna s příchodem Next.js App Routeru.~~

---

### ~~Alternativní historická struktura modulů~~

```
modules/
  nemovitosti/
  jednotky/
  smlouvy/
```

~~Tento návrh byl později nahrazen formátem:  
`/app/modules/040-nemovitosti/`  
který je modulární, tříděný a stabilnější.~~

---

### ~~Starý návrh vrstev logiky~~

```
UI
↓
Forms
↓
Database
```

~~Později byl nahrazen čistou architekturou:  
UI → Domain/Logic → Data.~~

---

### ~~Historické poznámky o renderování~~

- ~~Sidebar by mohl měnit layout celého UI~~  
- ~~Breadcrumbs budou generované pouze staticky~~  
- ~~CommonActions budou pevně napojené, bez dynamiky~~

~~Všechny tyto části byly přepracované do finální architektonické koncepce.~~

---

### ~~Nepoužívané koncepty Supabase integrace~~

- ~~u každého dotazu jsme chtěli explicitně kontrolovat email uživatele~~  
- ~~plán RLS byl původně ruční přes filtry~~

~~Dnes máme jednotný systém RLS a centralizované Supabase klienty.~~

---

### ~~Původní myšlenka ukládat všechna metadata do jedné tabulky~~

~~Tento koncept se ukázal jako příliš omezený a neudržitelný.  
Nová architektura odděluje metadata, role, permissions a entity.~~

---

### ~~Velmi starý návrh „Backendless“ přístupu~~

- ~~bez services~~  
- ~~bez centralizované logiky~~  
- ~~bez role-permission vrstvy~~

~~Tento návrh byl nahrazen moderním návrhem služeb (authService, permissionsService…).~~

---

# 📌 Konec archivních historických částí pro dokument 02.

---

## DOPLNĚNÍ (2025-12-12) – Architektura UI, role AppShell a modulů

### 1) Vrstvy aplikace (upřesnění)
Aplikace je rozdělena do jasných vrstev s pevně danými odpovědnostmi:

- **Layout / Shell vrstva**
  - řídí strukturu obrazovky
  - aplikuje UI konfiguraci (theme, menu, ikony)
  - neobsahuje doménovou logiku

- **Modulární vrstva**
  - obsahuje funkční části aplikace (010, 020, 900, …)
  - neřeší layout aplikace
  - může pouze měnit konfiguraci (např. UI nastavení)

- **UI komponenty**
  - prezentace (Sidebar, TopMenu, Actions, Breadcrumbs)
  - bez znalosti odkud data pochází
  - bez vlastní konfigurace vzhledu

- **Styling vrstva**
  - CSS proměnné + selektory
  - reaguje na třídy aplikované na `.layout`

---

### 2) AppShell – centrální bod UI architektury
Soubor `app/AppShell.tsx` je **jediný centrální bod**, kde se:

- skládá hlavní UI kostra aplikace
- vyhodnocuje výsledný UI config
- rozhoduje o režimu menu (Sidebar / TopMenu)
- aplikuje `className` na root `.layout`

**Pravidlo:**  
Žádný modul, tile ani UI komponenta nesmí přímo manipulovat s layoutem nebo CSS třídami.

---

### 3) Moduly – konfigurační vs. prezentační odpovědnost
Moduly:
- poskytují data a konfiguraci
- neřeší prezentaci mimo svůj vlastní obsah

Příklad:
- modul 900 (Nastavení)
  - ukládá UI preference
  - **neví**, jak je Sidebar nebo TopMenu vykreslí

---

### 4) UI konfigurace – architektonický tok
UI konfigurace je **stav aplikace**, ne součást modulů.

Tok:
1. default hodnoty (kód)
2. uživatelská preference (localStorage)
3. výpočet `uiConfig`
4. aplikace v `AppShell.tsx`
5. reakce CSS a rendererů

Tento tok nesmí být přerušen přímým zásahem modulů do UI vrstvy.

---

### 5) Architektonické zákazy (upřesnění)
Zakazuje se:
- měnit layout z modulu
- měnit CSS třídy mimo AppShell
- mít rozdílnou logiku pro Sidebar a TopMenu
- obcházet UI config přímým přepisem stylů

Doporučení:
- pokud je potřeba nová UI varianta, **nejdřív ji popsat v docs**, až potom implementovat.

---

### 6) Kontrolní otázky (při ladění)
Při každém UI problému si položit:
1. je to konfigurace, nebo prezentace?
2. kde se konfigurace vyhodnocuje?
3. kde se aplikuje `className`?
4. reaguje CSS na správnou třídu?

5. ---

## DOPLNĚNÍ (2025-12-12) – Routing vs UI layout (AppShell)

### 1) Odpovědnost routingu (upřesnění)
Routing v aplikaci:
- řeší **který obsah** se má zobrazit
- **neřeší** strukturu UI (menu, actions, layout)

Routing:
- určuje modul / stránku / detail
- nikdy neurčuje:
  - zda je Sidebar nebo TopMenu
  - zda se zobrazují ikony nebo text
  - jaké je téma nebo akcent

---

### 2) Vztah routingu a AppShell
`AppShell.tsx` je **nadřazený** routingu z pohledu UI.

Princip:
- routing vybere obsah
- AppShell:
  - obalí obsah do jednotné UI kostry
  - aplikuje UI konfiguraci
  - vykreslí navigaci a akce

Zjednodušeně:
- routing = „CO zobrazit“
- AppShell = „JAK to vypadá“

---

### 3) Typické routovací stavy
Routing může vyústit do těchto stavů obsahu:

- dashboard / home
- seznam (list)
- detail / formulář
- tile přehled
- autentizační obrazovky

Tyto stavy:
- se renderují uvnitř `layout__content`
- nemění strukturu layoutu
- nemění UI konfiguraci

---

### 4) Autentizace a routing
Při změně autentizačního stavu:
- routing může přesměrovat uživatele
- AppShell:
  - může skrýt / zobrazit části UI
  - ale **nemění architekturu layoutu**

Příklad:
- nepřihlášený uživatel:
  - omezený obsah
  - stále jednotná kostra aplikace (pokud není výslovně jinak)

---

### 5) Routing a moduly
- Modul je identifikován routou (nebo parametrem routy)
- Routing:
  - určuje aktivní modul
  - předává kontext AppShellu
- AppShell:
  - podle aktivního modulu zvýrazní navigaci
  - zobrazí breadcrumbs a actions

**Pravidlo:**  
Routing nikdy nesmí přímo řídit Sidebar / TopMenu – pouze poskytuje informaci „kde jsem“.

---

### 6) Debug checklist – routing vs UI
Pokud UI nereaguje správně na změnu stránky:
1. ověř, že routing správně mění aktivní modul
2. ověř, že AppShell dostává informaci o aktivním modulu
3. ověř, že UI konfigurace se nemění routou
4. ověř, že navigace reaguje na změnu kontextu, ne na změnu routy přímo

