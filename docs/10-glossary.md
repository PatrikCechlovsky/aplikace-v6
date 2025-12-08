# /docs/10-glossary.md
## Popis: Slovník všech důležitých pojmů používaných v aplikaci Pronajímatel v6 – technické, doménové, UI/UX, databázové a projektové termíny.
---

# 10 – Slovník pojmů

---

# 1. Úvod

Tento dokument obsahuje **kompletní přehled všech pojmů**, které se používají:

- v kódu,
- v dokumentaci,
- v UI,
- v databázi,
- v modulech,
- v architektuře Pronajímatel v6.

Slouží hlavně:

- pro tebe,
- pro nové vývojáře,
- pro konzistenci celého systému.

---

# 2. Hlavní doménové pojmy

### **Nemovitost (Property)**
Budova, dům nebo objekt, který je ve správě pronajímatele.

### **Jednotka (Unit)**
Byt nebo nebytový prostor v nemovitosti.

### **Pronajímatel (Landlord)**
Osoba nebo firma, která vlastní nemovitosti.

### **Nájemník (Tenant)**
Osoba, která obývá jednotku a má nájemní vztah.

### **Smlouva (Contract)**
Právní dokument mezi pronajímatelem a nájemníkem.

### **Služba (Service)**
Náklad, který je vyúčtovaný nájemníkovi (voda, plyn, odpad…).

### **Měřidlo (Meter)**
Zařízení měřící spotřebu (elektřina, plyn, voda).

### **Platební předpis (Payment Schedule)**
Předepsaná kombinace nájemného a služeb.

### **Platba (Payment)**
Reálně přijatá úhrada od nájemníka.

### **Vyúčtování (Settlement)**
Finální vyrovnání služeb na základě skutečné spotřeby.

### **Dokument (Document)**
Soubory jako smlouvy, dodatky, vyúčtování atd.

### **Komunikace (Communication)**
E-mail, zpráva nebo interní zápis spojený s nájemníkem.

---

# 3. Technické pojmy (frontend)

### **Layout**
Hlavní rámec stránky obsahující 6 sekcí UI.

### **HomeButton**
Levá část horní lišty, navigace zpět na dashboard.

### **Sidebar**
Navigace modulů aplikace.

### **Breadcrumbs**
Drobečková navigace podle modulu / detailu.

### **CommonActions**
Řádek tlačítek (Add, Edit, Save…) specifický podle stavu.

### **Content Engine**
Část, která zobrazuje přehled, detail nebo formulář.

### **Tile**
Vstupní “dlaždice” modulu (typy, seznamy, podsekce).

### **Form State**
Interní stav formuláře s podporou:
- dirty state,
- validace,
- napojení na CommonActions.

### **Overview**
Tabulkový přehled dat (list view).

---

# 4. Backend & databázové pojmy

### **Supabase**
Platforma poskytující databázi, autentizaci, API a RLS.

### **Auth**
Systém přihlášení (e-mail + heslo).

### **Session**
Aktuálně přihlášený uživatel.

### **User Metadata**
Doplňující informace o uživateli (display_name…).

### **RLS – Row Level Security**
Omezení přístupu k řádkům podle `auth.uid()`.

### **Policy**
Pravidlo určující, kdo může číst nebo měnit data.

### **Migration**
SQL skript obsahující změny v databázi.

### **Seed data**
Startovní data pro testovací prostředí.

---

# 5. Moduly – pojmy

### **Modul (Module)**
Samostatná funkční část aplikace s vlastní složkou.

### **module.config.js**
Konfigurační soubor obsahující:
- id,
- název,
- ikonu,
- pořadí,
- commonActions,
- permissions.

### **Module ID**
Číselný prefix modulu, např. `040-nemovitosti`.

### **Enabled Module**
Modul, který se načítá v Sidebaru.

### **Disabled Module**
Skrytý modul (např. WIP).

---

# 6. Pravidla projektu – pojmy

### **A/B/C dokumentace**
Standard zápisu dokumentů:
- A = finální verze,
- B = historické části,
- C = archiv.

### **Naming Convention**
Pravidla pro pojmenování souborů, složek, komponent.

### **Commit Message Format**
Povolené prefixy `feat`, `fix`, `docs`, `refactor`, …

### **Branch Model**
`main`, `develop`, `feature/`, `fix/`.

---

# 7. Deployment & CI/CD pojmy

### **Preview Deployment**
Dočasná verze na Vercelu vytvořená z branče.

### **Production Deployment**
Hlavní produkční verze aplikace.

### **Environment Variables**
Proměnné prostředí (`NEXT_PUBLIC_...`).

### **GitHub Actions**
Automatizace buildů a testů.

### **Rollback**
Vrácení aplikace na předchozí stabilní verzi.

---

# 8. Verzování & release pojmy

### **Semantic Versioning**
Verze mají tvar `major.minor.patch`.

### **Changelog**
Souhrn změn mezi verzemi.

### **DB Version**
Interní číslo verze databáze.

### **Breaking Change**
Změna vyžadující zásah do modulů / DB.

---

# 9. UI a design – pojmy

### **Theme (světlý / tmavý režim)**
Barevná varianta aplikace.

### **Component**
Znovupoužitelná UI část (např. tlačítko).

### **Icon Set**
Seznam ikon používaných v Sidebaru a UI.

---

# 10. Ostatní důležité pojmy

### **Owner ID**
ID pronajímatele – klíč k multi-tenant logice.

### **Dirty State**
Informace, že formulář obsahuje neuložené změny.

### **Selected Row**
Vybraný řádek v přehledu.

### **Search & Filter**
Systém filtrování dat v tabulce.

---

# 11. Závěr

Tento slovník sjednocuje jazyk používaný v celém projektu.  
Pokud někdo používá jiný termín než zde uvedený → musí být doplněn nebo opraven.

Každý nový modul nebo funkce musí přidat nové pojmy do tohoto dokumentu.
---

# 📜 Historické části dokumentu – SLOVNÍK POJMŮ

~~Původní pokus o slovník byl krátký a neúplný.~~  
~~Byl založen pouze na názvech modulů a několika pojmech z UI.~~  

Později byl slovník rozšířen na kompletní doménový, technický a architektonický popis.

Tato sekce bude sloužit k ukládání starých verzí slovníku.
