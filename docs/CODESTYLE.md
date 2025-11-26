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
📂 Struktura souborů

Každý soubor musí začínat komentářem:

// ----------------------------------------------------
// File: app/UI/Sidebar.tsx
// Purpose: Dynamický sidebar modulů
// Author: Patrik Cechlovský + ChatGPT
// ----------------------------------------------------


Výhody:
✔ později víš, co kam patří
✔ snadné dohledání
✔ pořádek při rychlém růstu aplikace

🎨 Ikony

📄 Ikony jsou:
→ 100% definované v souboru icons.ts
→ nikdy se nesmí psát přímo do UI souboru (❌ <span>👤</span>)
→ vždy jen:

<span>{getIcon("user")}</span>


✔ máš kontrolu nad každou ikonou
✔ snadno změníš design (swap emoji na SVG)
✔ jednotnost celé aplikace

🧱 Komponenty

Každá komponenta musí mít:

čistou logiku

žádné inline styly

žádné tvrdé texty (jen české stringy z konstant)

props pro vše, co se mění

žádný přímý import z modulů

🧠 Moduly

Každý modul:

app/modules/xxx-nazev/
 ├─ module.config.js
 ├─ tiles/
 ├─ forms/
 ├─ detail/
 └─ services/


module.config.js vždy obsahuje:

export default {
  id: "010-sprava-uzivatelu",
  label: "Správa uživatelů",
  icon: "users",
  order: 10,
  enabled: true
}
