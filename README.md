# 🏠 Pronajímatel v6 — Dokumentace projektu

Tento projekt je moderní property-management aplikace postavená na:
- **Next.js 14 (App Router)**
- **Supabase (Auth + databáze + RLS)**
- **Modulárním komponentovém systému**
- **Jednotném UI layoutu o 6 sekcích**

Cílem je vytvořit škálovatelný systém, který umožní správu nemovitostí, jednotek, nájemníků, smluv, plateb, služeb a dokumentů.

---

## 1. ARCHITEKTURA ROZLOŽENÍ (UI LAYOUT)

Aplikace používá 6-blokové rozložení, které je jednotné pro všechny moduly:

1. **HomeButton + Sidebar** (levý sloupec)
2. **Horní lišta** – vlevo Breadcrumbs, vpravo HomeActions
3. **CommonActions** – lišta obecných akcí pod horní lištou
4. **Content** – hlavní obsah (přehled / detail / formulář)
5. (do budoucna) další pomocné panely / popupy

Schématicky:

    ┌──────────────────────────────────────────────────────────────┐
    │ 1–2: Sidebar (HomeButton + moduly)                          │
    ├───────────┬─────────────────────────────────────────────────┤
    │           │ 3: Horní lišta                                  │
    │           │    • vlevo: Breadcrumbs                         │
    │ Sidebar   │    • vpravo: HomeActions                        │
    │ (left)    ├─────────────────────────────────────────────────┤
    │           │ 4: CommonActions — lišta obecných akcí          │
    │           ├─────────────────────────────────────────────────┤
    │           │ 5: Content — přehled / detail / formulář        │
    └───────────┴─────────────────────────────────────────────────┘

### Stav rozložení

- Sidebar ✔  
- Breadcrumbs ✔ (základní statická verze)  
- HomeActions ✔ (display_name, ikony, logout)  
- CommonActions ✔ (pevná verze, připravená na dynamiku)  
- Content engine ✔ (zobrazení přehledu / formuláře / hlášek)  

---

## 2. AUTENTIZACE (SUPABASE AUTH)

Autentizace je postavená na Supabase Auth.

V komponentě `HomePage`:

- při startu běží `getCurrentSession()`  
- přihlášení / odhlášení hlídá `onAuthStateChange()`  
- do stavu se ukládá jednoduchý objekt uživatele:

```ts
type SessionUser = {
  email: string | null
  displayName?: string | null
}
Hodnota displayName se čte z session.user.user_metadata (používáme více možných klíčů):

display_name

full_name

name

Fallback, pokud nic z toho neexistuje:

e-mail uživatele

text "Uživatel"

Tato hodnota se zobrazuje v komponentě HomeActions.

3. MODULY (MODULAR ENGINE)
Každý modul má vlastní složku:

app/modules/<id>-<nazev-modulu>/

Uvnitř typicky:

module.config.js – základní konfigurace modulu

tiles/ – dlaždice (přehledy / dashboard části)

forms/ – formuláře

overview/ nebo jiné složky podle potřeby

Příklad struktury:

010-sprava-uzivatelu/

020-muj-ucet/

030-pronajimatele/

040-nemovitosti/

050-najemnici/

060-smlouvy/

070-sluzby/

080-platby/

090-finance/

110-dokumenty/

200-komunikace/

900-nastaveni/

module.config.js
Každý modul definuje minimálně:

id – např. "010-sprava-uzivatelu"

label – text do UI

icon – název ikony (používá se přes getIcon)

order – pořadí v sidebaru

enabled – zapnutí / vypnutí modulu

Sidebar načítá všechny konfigurace přes centrální index (modules.index.js) a moduly dynamicky vykreslí.

4. UI KOMPONENTY
4.1 HomeButton
Komponenta v app/UI/HomeButton.tsx

Zobrazuje název aplikace a ikonku „domů“

Reaguje na kliknutí (callback onClick)

Má stav disabled (např. před přihlášením)

4.2 Sidebar
Komponenta v app/UI/Sidebar.tsx

Načítá moduly z MODULE_SOURCES

Zobrazuje seznam modulů (label + ikonka)

Respektuje enabled === false – takové moduly se nezobrazují

Umí activeModuleId a volá onModuleSelect

4.3 Breadcrumbs
Komponenta v app/UI/Breadcrumbs.tsx

Zatím jednoduchá, statická verze:

ukazuje „Dashboard / Domov“

ikonka domů vlevo

Do budoucna:

dynamická cesta podle aktivního modulu / dlaždice / detailu

napojení na router / vlastní stav

4.4 HomeActions
Komponenta v app/UI/HomeActions.tsx

Pravá část horní lišty

Obsah (zleva doprava):

displayName – čtený z Supabase (viz kapitola Autentizace)

👤 – ikonka profilu (zatím placeholder, připravená na otevření profilu nebo menu)

🔍 – ikonka hledání (placeholder pro globální search)

🔔 – ikonka notifikací (placeholder pro oznámení)

Odhlásit – tlačítko, které volá onLogout a odhlásí uživatele

Podpora disabled:

pokud je disabled === true, celá lišta je vizuálně tlumená a neklikací

4.5 CommonActions
Komponenta v app/UI/CommonActions.tsx

Zobrazuje lištu obecných akcí pro aktuální pohled

Aktuální verze (v1):

má centrální definici všech možných akcí:

add, edit, view, duplicate, attach, archive, delete, save, saveAndClose, cancel

COMMON_ACTION_DEFS obsahuje:

id

icon (např. "save", "delete")

label (např. "Uložit")

volitelné příznaky:

requiresSelection – akce potřebuje vybraný záznam (edit, delete, archive…)

requiresDirty – akce má smysl pouze u „špinavého“ formuláře (save…)

aktuálně se vykresluje pevný seznam tlačítek (view, add, edit, archive, delete) pro demonstraci UI

Do budoucna:

konfigurace akčních tlačítek podle:

modulu

konkrétní dlaždice / formuláře

role / oprávnění uživatele

stavu formuláře (dirty / čistý)

vybraného záznamu v přehledu

velká část logiky bude čtena z configů / databáze, aby se pravidla dala upravovat bez zásahu do kódu.

4.6 Content (hlavní plocha)
část layoutu layout__content

ukazuje:

přihlašovací panel, pokud uživatel není přihlášen

jinak:

dashboard / výchozí přehled

detail vybraného modulu

konkrétní formulář / dlaždici podle stavu aplikace

5. STYL A CODESTYLE (ZÁKLAD)
Obecná pravidla:

komponenty v app/UI/ – menší, znovupoužitelné kusy UI

moduly v app/modules/ – business logika + konkrétní obrazovky

názvy komponent: PascalCase (např. HomeActions.tsx)

názvy proměnných a props: camelCase (např. activeModuleId)

event handlery:

handleXxxClick, onXxx (např. onLogout, onModuleSelect)

žádná logika ani hooky uvnitř JSX – vždy nad return v těle komponenty

ikony se berou z centrální funkce getIcon(name)

6. STAV IMPLEMENTACE (SHRNUTÍ)
Oblast	Stav
Základní layout (6 sekcí)	✔ Hotovo
Sidebar – načítání modulů z configu	✔ Hotovo
HomeButton	✔ Hotovo
Breadcrumbs – statická verze	✔ Hotovo
HomeActions – displayName + ikony + logout	✔ Hotovo
CommonActions – pevný seznam tlačítek (v1)	✔ Hotovo
Napojení CommonActions na role/oprávnění	⏳ Plán
Dynamické akce podle modulu/dlaždice/formuláře	⏳ Plán
Form engine (zobrazení formulářů v layoutu)	✔ Základ
Modul Dokumenty, Komunikace, Služby…	⏳ Rozprac.

7. TODO – DALŠÍ KROKY
Přidat konfiguraci akcí CommonActions do module.config.js

Vytvořit napojení na uživatelské role / oprávnění (Supabase tabulky subject_roles, subject_permissions apod.)

Dodat dynamické Breadcrumbs podle aktivního modulu a obrazovky

Rozšířit Content o taby, detailní formuláře a navazující přehledy

Doplnit dokumentaci k databázovým tabulkám a jejich vazbám (nemovitosti, jednotky, smlouvy, platby…)
