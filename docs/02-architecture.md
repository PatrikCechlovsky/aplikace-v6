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
