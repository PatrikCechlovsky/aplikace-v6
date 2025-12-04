# TODO – Pronajímatel v6  
Kompletní plán vývoje aplikace, sjednocený podle aktuální struktury, stavu projektu a nastavení Supabase/RLS.

---

# ✅ FÁZE 0 – HYGIENA PROJEKTU (HOTOVO)

- [x] Založení projektu na GitHubu `aplikace-v6`
- [x] Struktura `app/`, `modules/`, `UI/`, `lib/`
- [x] Nastavení Next.js (App Router)
- [x] Vytvoření základního layoutu (`layout.tsx`)
- [x] Propojení s Vercel (CI/CD)
- [x] Připojení Supabase (`supabaseClient.ts`)
- [x] Globální styly (`globals.css`)
- [x] Základní README + CODESTYLE

---

# ⏳ FÁZE 1 – LAYOUT & UI (DESKTOP)

- [x] Implementace 6 částí layoutu:
  - HomeButton, Sidebar, Breadcrumbs, HomeActions, CommonActions, Content
- [x] Struktura UI přes CSS grid
- [x] Login panel ve „Content“
- [x] Dynamický výpis modulů v Sidebaru z `modules.index.js`
- [ ] Propojení Sidebar + ikony z `icons.ts`
- [ ] Dokončení základního stylování (hover, spacing, barvy)
- [ ] Dolaďit vzhled ListView, DetailView, Tabs

**Nové úkoly – layout a nadpisy:**

- [ ] Breadcrumbs zobrazit podle specifikace: `Domů > Nastavení > Typy subjektů > Detail typu`
- [ ] Vrátit a správně zarovnat HomeButton v horním layoutu (aby nezmizel v modulech)
- [ ] V Content odstranit duplicitní nadpisy:
  - modul má „Nastavení / Typy subjektů“
  - GenericTypeTile má jen podnadpis „Detail typu“
- [ ] Zajistit, aby Breadcrumbs byly vždy viditelné nad Content (nesmí „mizet“ u některých modulů)


---

# ⏳ FÁZE 2 – AUTENTIZACE (Supabase Auth)

Backend:
- [x] Login, registrace, reset hesla
- [x] Session listener (`onAuthStateChange`)
- [x] Přihlášený vs. nepřihlášený uživatel
- [x] Odhlášení

Frontend:
- [ ] Vytvořit `app/lib/services/auth.ts` (login, logout, register atd.)
- [ ] Upravit `LoginPanel` tak, aby používal `services/auth.ts`
- [ ] Integrovat callbacky pro chybové stavy (špatné heslo, existující účet)

Bezpečnost:
- [ ] Aktivovat **Leaked Password Protection** v Supabase Auth
- [ ] Přidat zobrazení „minimální síla hesla“ u registrace

---

# ⏳ FÁZE 3 – IKONY & DYNAMICKÝ SIDEBAR

- [x] Vytvoření `ikons.md` (katalog ikon)
- [x] Komponenta `icons.ts` + `getIcon()`
- [ ] Upravovat `module.config.js`: vždy definovat `icon: "nazev_ikony"`
- [ ] Sidebar zobrazí ikonu modulu přes `getIcon()`
- [ ] Přidat ikony i do:
  - Tabs
  - ListView (vedení podle typu entity)
  - DetailView (typ subjektu, stav atd.)

**Nové úkoly – Sidebar jako osnova:**

- [ ] Předělat `Sidebar.tsx` na „osnovu“:
  - úrovně (modul → podsekce → tile/form) s jemným odsazením (indent)
- [ ] Přidat malou šipku před položku:
  - zavřený stav `▶`
  - otevřený stav `▼` (rotace pomocí CSS)
- [ ] Vždy zvýraznit pouze jednu aktivní položku (aktuální modul/tile)
- [ ] Navigační guard:
  - při rozdělaných změnách (`dirty` formulář) zobrazit varování
  - nepustit uživatele do jiného modulu/tilu bez potvrzení („Zahodit / Pokračovat“ – podobně jako v GenericTypeTile)


---

# ⏳ FÁZE 4 – MOBILNÍ & RESPONSIVE UI

- [ ] Sidebar – skládací / vysouvací varianta
- [ ] Mobile topbar – sloučené HomeActions + CommonActions
- [ ] Upravit CSS grid → mobile-first breakpoints
- [ ] Testování:
  - telefon na výšku / šířku
  - iPhone, Android
  - tablet 9–11"

---

# 🛡️ FÁZE 5 – ROLE A OPRÁVNĚNÍ (Aplikační = UI)

Poznámka:  
**DB RLS vrstva je již hotová → viz FÁZE 8.**  
Tato fáze řeší aplikační logiku (UI-level), nikoliv databázi.

- [ ] Definovat aplikační role (např. OWNER, ADMIN, USER)
- [ ] V tabulce `profiles` držet roli uživatele
- [ ] Sidebar podle role skryje/ukáže moduly
- [ ] CommonActions podle role skryje/ukáže tlačítka
- [ ] UI role checker (např. `useRole("ADMIN")`)

---

# 📦 FÁZE 6 – MODULY (DOMÉNY)

Každý modul musí mít:
- `module.config.js`
- `tiles/`
- `forms/`
- `services/`

## 010 – Správa uživatelů
- [ ] Výpis uživatelů
- [ ] Detail + role
- [ ] Propojení s `subjects`

## 020 – Můj účet
- [ ] Zobrazení subjektu aktuálního uživatele
- [ ] Změna jména, emailu, telefonu

## 030 – Pronajímatel
- [ ] CRUD pronajímatelů (typ subjektu = landlord)
- [ ] Napojení na `subjects` + RLS

## 040 – Nemovitost
- [ ] Přehled nemovitostí
- [ ] Detail / editace
- [ ] Vazba na pronajímatele

## 050 – Jednotka / Nájemník
- [ ] Jednotky přiřazené k nemovitosti
- [ ] Nájemník jako subject (tenant)
- [ ] Přehled obsazenosti

## 060 – Nájemní smlouva
- [ ] Vytvoření smlouvy
- [ ] Napojení na tenant + unit + pronajímatel
- [ ] Výpočet plateb

## 070 – Služby
- [ ] Seznam služeb
- [ ] Ceny a předpisy

## 080 – Platby
- [ ] Přijaté platby
- [ ] Automatické párování
- [ ] Notifikace

## 090 – Finance
- [ ] Přehled pohledávek
- [ ] Exporty, reporty

## 100 – Energie / Měřidla
- [ ] Napojení na měřidla
- [ ] Odhady spotřeby / přepočty
- [ ] Vyúčtování služeb

## 120 – Dokumenty
- [ ] Uložení dokumentů
- [ ] Šablony emailů
- [ ] Automatická komunikace

## 130 – Komunikace
- [ ] Historie emailů
- [ ] Automatická archivace odeslaných dokumentů

## 900 – Nastavení

- [ ] Správa číselníků
- [ ] Aplikační nastavení
- [ ] Uživatelský profil

**Speciální typové číselníky – GenericTypeTile:**

- [ ] Pro číselníky typu `subject_types`, `role_types`, `permission_types` používat komponentu `GenericTypeTile`
- [ ] V těchto view:
  - neschovávat/nenechávat CommonActions (horní akční lišta je vypnutá)
  - nezobrazovat sekci „Přílohy“ (tyto typy nemají přílohy)
  - akční tlačítka jsou součástí samotného formuláře (šipky, Uložit, Archivovat, Nový)


---

# 🛡️ FÁZE 7 – MFA A MODERNÍ OCHRANA

- [ ] Integrovat MFA (TOTP)
- [ ] Recovery kódy
- [ ] Příprava na Passkeys / WebAuthn

---

# 🛡️ FÁZE 8 – BEZPEČNOST DB (RLS, Supabase) – **HOTOVO / DOKONČIT DROBNOSTI**

Toto je nová fáze věnovaná výhradně databázové bezpečnosti (již zimplementováno).

## 🔐 RLS – hotové:
- [x] Zapnuté na `subjects`
- [x] Zapnuté na `subject_roles`
- [x] Zapnuté na `subject_permissions`
- [x] Zapnuté na `role_types`
- [x] Zapnuté na `permission_types`
- [x] Zapnuté na `subject_types`
- [x] Smazaná chybová policy „Subjects: read all authenticated“
- [x] Kompletní vlastní politiky podle `auth_user_id`

## 📌 Zbývá:
- [ ] Upravit funkci `public.set_updated_at`:  
  `SET search_path = public`
- [ ] Zapnout v Auth → Email:  
  **Leaked Password Protection**
- [ ] (Nepovinné) doplnit seed data pro číselníky:
  - [ ] subject_types
  - [ ] role_types
  - [ ] permission_types

---

# 🔄 Údržba dokumentace

- [ ] Aktualizovat README při každé změně struktury nebo modulu  
- [ ] Aktualizovat `docs/stav-struktury.md` po dokončení každé FÁZE  
- [ ] Aktualizovat `docs/todo_list.md` na konci každé pracovní session  

---

# 🧱 Stav projektu

Aplikace je nyní plně připravena pro:

- rozšíření modulů (doména),
- implementace role-based UI,
- pokročilou práci s daty přes RLS,
- provoz na produkci s více uživateli,
- bezpečné oddělení dat mezi pronajímateli.

