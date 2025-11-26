# Codestyle – pravidla

1. **Soubory komponent**
   - UI komponenty = `*.tsx`
   - Jedna komponenta = jeden soubor
   - Název souboru = název komponenty (Sidebar.tsx, Tabs.tsx…)

2. **Pojmenování**
   - Komponenty: PascalCase (Sidebar, DetailView)
   - Funkce: camelCase (loadModules, getActions)
   - Konfigurace: malá písmena (modules, tabs, actions)

3. **Struktura**
   - `app/` = stránky a layout
   - `app/UI/` = všechny vizuální komponenty
   - `app/config/` = datové konfigurace (moduly, záložky, akce)
   - `docs/` = dokumentace (stav struktury, pravidla)

4. **Styl**
   - Raději více menších komponent než jedna obří.
   - Logiku (počítání, mapování, transformace) postupně přesouvat do helperů / configů.
   - Nepoužívat „magické stringy“ přímo v komponentách – místo toho config.

5. **Commitování**
   - Každá větší změna = jeden commit.
   - Commit message česky/anglicky, ale srozumitelná („Přidaný Sidebar a Tabs“, „Napojení na Supabase“).
