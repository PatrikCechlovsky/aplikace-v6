# TODO – Pronajímatel v6

Pracovní přehled úkolů pro aplikaci Pronajímatel v6.

---

## FÁZE 0 – HYGIENA PROJEKTU ✅

- [x] Založení projektu na GitHubu `aplikace-v6`
- [x] Základní struktura `app/` (layout, page, UI, modules, lib)
- [x] Nastavení Next.js (App Router, `layout.tsx`, `page.tsx`)
- [x] Nastavení Vercel (Framework: Next.js, root repo)
- [x] Propojení na Supabase (klíče v env, `supabaseClient.ts`)
- [x] Základní globální styly v `globals.css`
- [x] README + CODESTYLE se základními pravidly

---

## FÁZE 1 – LAYOUT A UI (DESKTOP) ✅/⏳

- [x] Návrh 6 hlavních částí UI (HomeButton, Sidebar, Breadcrumbs, HomeActions, CommonActions, Content)
- [x] Implementace layoutu přes CSS grid (desktop)
- [x] Základní Sidebar s dynamickým načítáním modulů z `modules.index.js`
- [x] Základní HomeActions + CommonActions
- [x] Login panel v bloku Content
- [ ] Propojení `Sidebar` + `icons.ts` (ikonové klíče z modulů)
- [ ] Doladění barev, spacingu, hover stavů podle potřeb

---

## FÁZE 2 – AUTENTIZACE (Supabase Auth) ⏳

- [x] Supabase klient (`app/lib/supabaseClient.ts`)
- [x] LoginPanel:
  - [x] Přihlášení (email + heslo)
  - [x] Registrace (email + heslo + jméno)
  - [x] Reset hesla (email)
- [x] Session listener v `page.tsx` (`getSession`, `onAuthStateChange`)
- [x] Blokace UI pro nepřihlášené (disabled layout, viditelné ale neklikací)
- [x] Odhlášení (Supabase `signOut`)
- [ ] Vytvořit `app/lib/services/auth.ts` (login, logout, register, reset)
- [ ] Upravit `LoginPanel` + `page.tsx`, aby používaly `services/auth.ts`
- [ ] Připravit základ pro role a oprávnění (napojení na profily v DB)

---

## FÁZE 3 – IKONY A DYNAMICKÝ SIDEBAR ⏳

- [x] Vytvořit `ikons.md` (seznam ikon)
- [x] Vytvořit `app/UI/icons.ts` (ICONS + getIcon)
- [ ] Upravovat `module.config.js` tak, aby:
  - `icon` = klíč pro `icons.ts` (např. `"building"`, `"finance"`, `"tenant"`)
- [ ] Upravít `Sidebar.tsx`, aby:
  - načetl `icon` z modulu (`conf.icon`)
  - zavolal `getIcon(conf.icon)` a zobrazil ikonu
- [ ] Připravit sadu ikon pro další komponenty (Tabs, ListView, DetailView)

---

## FÁZE 4 – RESPONZIVNÍ DESIGN (MOBIL + TABLET) ⏳

- [ ] Definovat chování na malých displejích:
  - sidebar skrytý / vysouvací
  - horní lišta kompaktní
  - content na 100 % šířky
- [ ] Přidat `@media` breakpoints do `globals.css`
- [ ] Přizpůsobit fonty / mezery pro mobil
- [ ] Otestovat na:
  - telefon na výšku
  - telefon na šířku
  - menší tablet

---

## FÁZE 5 – ROLE A OPRÁVNĚNÍ ⏳

- [ ] Návrh rolí (např. OWNER, ADMIN, USER, READONLY)
- [ ] Tabulka `profiles` v Supabase + napojení na uživatele
- [ ] Nastavení, které moduly vidí jaká role
- [ ] Omezení akcí podle rolí (např. edit/smazat jen ADMIN/OWNER)
- [ ] Úprava Sidebaru podle rolí

---

## FÁZE 6 – MODULY (DOMÉNA) ⏳

- [ ] 010 – Správa uživatelů
  - definice polí
  - přehled uživatelů
  - formulář detailu
- [ ] 020 – Můj účet
- [ ] 030 – Pronajímatel
- [ ] 040 – Nemovitost
- [ ] 050 – Jednotka / Nájemník
- [ ] 060 – Smlouva
- [ ] 070 – Služby
- [ ] 080 – Platby
- [ ] 090 – Finance
- [ ] 100 – Energie / Měřidla
- [ ] 120 – Dokumenty
- [ ] 130 – Komunikace
- [ ] 900 – Nastavení

---

## FÁZE 7 – BEZPEČNOST (MFA, BIOMETRIE) ⏳

- [ ] Aktivace a nastavení MFA (TOTP) pro uživatele v Supabase
- [ ] MFA krok v login procesu (ověření kódu z Authenticatoru)
- [ ] Obnova při ztrátě MFA (recovery kódy)
- [ ] Příprava na Passkeys / biometriku (telefon, prohlížeč)

---

## Poznámky

Pravidelně:
- aktualizovat `docs/stav-struktury.md`
- aktualizovat `docs/todo_list.md`
- udržovat konzistenci s `CODESTYLE.md`
