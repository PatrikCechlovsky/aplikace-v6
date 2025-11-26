# 🏠 Pronajímatel v6 – SaaS aplikace pro správu nájemního portfolia

## 🎨 Ikony v aplikaci

Veškeré použité ikony jsou uvedeny a popsány v souboru [`ICONS.md`](./ICONS.md). Tento soubor slouží jako jediný zdroj pro výběr a správu ikon v celé aplikaci.


Tato aplikace je novou verzí systému pro správu pronájmů a nájemních vztahů (verze 6), přepsanou do čisté, konzistentní struktury s důrazem na UX, responzivní design a víceklientskou architekturu (multi-tenant SaaS).

## 💡 Cíle verze v6:
- Unifikovaný UI/UX layout s pevně danými bloky (sidebar, přehledy, hlavní karta, vazby).
- Plně responzivní zobrazení (mobil + desktop).
- Každý modul má stejnou strukturu (přehled → detail → záložky → vazby).
- Backend je postaven nad Supabase s podporou RLS (Row Level Security).
- Frontend v Next.js (App Router) + Tailwind CSS.

📘 Více o návrhu rozhraní najdeš v [`docs/UI-specifikace.md`](docs/UI-specifikace.md)

## Proces vývoje aplikace

1. **Fáze 0 – Základní kostra**
   - Nastavit projekt (Next.js, Supabase, Vercel).
   - Vytvořit základní layout (header, sidebar, content).
   - Připravit složku `app/UI` pro komponenty.
   - Připravit složku `app/config` pro konfigurace (moduly, záložky, akce).

2. **Fáze 1 – UI kostra bez logiky**
   - Vytvořit komponenty:
     - HomeButton
     - Sidebar
     - Breadcrumbs
     - HomeActions
     - CommonActions
     - Tabs (10 záložek)
     - DetailView (detail entity – prázdný základ)
     - ListView (přehled – prázdný základ)
   - Vše napojit do `app/page.tsx`.

3. **Fáze 2 – Konfigurace a dynamika**
   - Vytvořit `app/config/modules.ts` – seznam modulů.
   - Vytvořit `app/config/tabs.ts` – 10 fixních záložek.
   - Vytvořit `app/config/actions.ts` – common actions podle modulu.
   - Sidebar, Tabs a CommonActions začnou číst data z těchto config souborů.

4. **Fáze 3 – Stav struktury**
   - Vytvořit `docs/stav-struktury.md`.
   - Zapisovat sem:
     - seznam komponent (UI)
     - seznam formulářů
     - seznam tiles
     - procesy (průvodce, vazby)
   - U každé položky stav: TODO / WIP / DONE.

5. **Fáze 4 – Data a Supabase**
   - Napojit přihlášení (auth).
   - Přidat tabulky (profiles, pronajimatel, nemovitost, jednotka, nájemník, smlouva, platba…).
   - Postupně nahrazovat „fake data“ v UI za reálná data ze Supabase.

6. **Fáze 5 – Refaktoring a dokumentace**
   - Pravidelně upravovat `stav-struktury.md`.
   - Udržovat konzistentní názvy souborů a komponent.
