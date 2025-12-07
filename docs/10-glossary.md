# /docs/10-glossary.md
## Popis: Tento dokument obsahuje slovník pojmů používaných v aplikaci Pronajímatel v6 – moduly, entity, UI elementy, datové struktury a technické termíny.
---
 
# 10 – Slovník pojmů (Glossary)

Tento dokument shromažďuje všechny názvy, pojmy a termíny používané v projektu.  
Je určen jako referenční příručka pro vývojáře, dokumentaristy i budoucí spolupracovníky.

---

# 1. Pojmy z aplikace (business)

### **Pronajímatel**
Uživatel nebo subjekt, který vlastní nemovitosti a jednotky.

### **Nájemník (Tenant)**
Osoba nebo firma, která využívá jednotku na základě nájemní smlouvy.

### **Subjekt (Subject)**
Obecná entita reprezentující osobu nebo organizaci.  
Může být pronajímatel, nájemník, kontaktní osoba nebo jiná role.

### **Nemovitost (Property)**
Budova nebo objekt (dům, kancelářská budova…).

### **Jednotka (Unit)**
Byt, kancelář, sklad nebo jiný pronajímatelný prostor v nemovitosti.

### **Smlouva (Contract)**
Nájemní smlouva definující vztah mezi nájemníkem a pronajímatelem.

### **Platba (Payment)**
Nájemné nebo záloha, která má datum splatnosti a výši částky.

### **Předpis (Prediction / Charge)**
Plánovaná opakovaná částka (nájemné, služby).

### **Vyúčtování (Settlement)**
Roční zúčtování služeb a spotřeb.

### **Měřidlo (Meter)**
Zařízení sledující spotřebu (elektřina, voda, plyn).

### **Odečet (Meter Reading)**
Konkrétní zaznamenaný stav měřidla.

### **Dokument (Document)**
PDF nebo příloha uložená k subjektu, nemovitosti, jednotce nebo smlouvě.

### **Komunikace (Communication)**
Odeslané e-maily, zprávy, upozornění nebo interní log.

---

# 2. Pojmy z UI

### **AppShell**
Hlavní rozvržení aplikace – 6-sekční layout.

### **Sidebar**
Levá navigace obsahující seznam modulů.

### **Breadcrumbs**
Navigační cesta zobrazující aktuální umístění uživatele.

### **CommonActions**
Sada tlačítek vykreslená nad contentem – akce jako „Uložit“, „Přidat“, „Archivovat“.

### **Content**
Hlavní oblast zobrazující přehled, detail nebo formulář.

### **ListView**
Standardizovaný přehled záznamů modulu.

### **DetailView**
Zobrazení detailu jedné položky (tile).

### **FormView / FormLayout**
Rozhraní pro editaci nebo vytváření záznamů.

### **GenericTypeTile**
Standardizovaná komponenta pro číselníky v modulu 900.

---

# 3. Pojmy z architektury

### **Modul**
Samostatná část aplikace reprezentující funkční oblast (např. Nemovitosti, Smlouvy, Platby…).

### **module.config.js**
Konfigurační soubor každého modulu obsahující:
- id  
- label  
- icon  
- order  
- enabled  
- konfigurace akcí (v2)

### **RLS (Row Level Security)**
Bezpečnostní mechanismus Supabase, který určuje, jaká data může konkrétní uživatel vidět.

### **Role**
Označuje oprávnění uživatele (admin, owner, manager, accountant).

### **Permission**
Konkrétní schopnost uživatele — např. přidat záznam, upravit záznam, zobrazit modul.

### **Session**
Informace o přihlášení uživatele, získaná ze Supabase Auth.

### **Supabase Client**
Knihovna pro komunikaci s databází a autentizací.

---

# 4. Technické pojmy

### **Next.js**
Framework nad Reactem využívající App Router architekturu.

### **React Component**
Znovupoužitelná UI jednotka.

### **Server Component**
Next.js komponenta renderovaná na serveru.

### **Client Component**
React komponenta vykreslovaná v prohlížeči.

### **Vercel**
Platforma pro deploy a hosting aplikace.

### **Storage**
Supabase úložiště pro dokumenty.

### **Migration**
SQL soubor popisující změnu v databázi.

### **TypeScript**
Typovaný jazyk nad JavaScriptem, zvyšující bezpečnost kódu.

---

# 5. Datové pojmy

### **UUID**
Unikátní identifikátor používaný jako primární klíč.

### **Foreign Key (FK)**
Vazba mezi tabulkami.

### **Entity**
Logická jednotka dat, např. „jednotka“, „nemovitost“.

### **Relationship**
Propojení mezi entitami (1:1, 1:N, M:N).

### **Číselník (Type / Lookup)**
Seznam předdefinovaných hodnot (typ jednotky, typ služby…).

---

# 6. Budoucí pojmy (rezervováno)

- Workflow Event  
- Automation Rule  
- Payment Matching  
- Document Generator  
- AI Assistant (doporučení nájmů)  
- Service Bundle (balíčky služeb)

---

# 7. Poznámky (uchováváme vše)

- Pokud vznikne nový modul, musí být pojmy doplněny sem.  
- Tento dokument je živý a bude se postupně rozšiřovat.  
- Nikdy se nesmí mazat termíny — maximálně se **přeškrtávají**.

---

# 8. Závěr

Slovník sjednocuje pojmosloví aplikace a zabraňuje nejasnostem při komunikaci.  
Je povinnou součástí celkové dokumentace projektu.

