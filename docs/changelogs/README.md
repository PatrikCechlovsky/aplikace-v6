# 📝 Changelogy – Historie změn v projektu

Tento adresář obsahuje detailní dokumentaci všech významných implementací a změn v projektu.

---

## 📋 Přehled changelogů

| Soubor | Datum | Popis |
|--------|-------|-------|
| [CHANGELOG-ADDRESS-LOGIN-PERSONAL-FIELDS.md](CHANGELOG-ADDRESS-LOGIN-PERSONAL-FIELDS.md) | 10.1.2026 | 🏠 **Adresní autocomplete + Osobní pole**<br/>- Integrace ARES API pro doplňování adres<br/>- Přidání birth_date do login procesu<br/>- DetailView: phone + email jako osobní pole |
| [CHANGELOG-TENANT-USERS-DEBOUNCE.md](CHANGELOG-TENANT-USERS-DEBOUNCE.md) | 18.1.2026 | 👥 **Uživatelé nájemníka + Debounce vyhledávání**<br/>- Tab "Uživatelé" v detailu nájemníka (spolubydlící)<br/>- Migrace 052: tenant_users tabulka<br/>- Debounce (500ms) ve všech list view<br/>- Opravy checkboxů (landlord/tenant roles) |
| [CHANGELOG-NAVIGATION-PATTERN-LIST-TO-ADD.md](CHANGELOG-NAVIGATION-PATTERN-LIST-TO-ADD.md) | 20.1.2026 | 🧭 **Navigation Pattern List→Add**<br/>- onNavigate callback pattern pro navigaci mezi tiles<br/>- Tlačítko Přidat naviguje na create tile místo lokálního mode<br/>- Automatické zavírání Sidebar filtrů<br/>- Odstraněno 80+ řádků duplicitního kódu<br/>- Implementováno: moduly 030, 050 |
| [CHANGELOG-RELATIONS-LIST-BADGES.md](CHANGELOG-RELATIONS-LIST-BADGES.md) | 25.1.2026 | 🎨 **Barevné štítky a statusy ve vazbách**<br/>- Vazby používají stejné barevné badge jako entity<br/>- Status jednotky má český popisek + ikonu<br/>- Aktualizováno napříč moduly 030/040/050 |
| [CHANGELOG-2026-02-services-and-rls.md](CHANGELOG-2026-02-services-and-rls.md) | 11.2.2026 | 🧾 **Služby + RLS + kvalita dat**<br/>- Nová služba v sidebaru + create form<br/>- Filtry katalogu při přidávání služeb<br/>- RLS pro delegáty (účty, nemovitosti, jednotky)<br/>- Sync bank list dle ČNB + PSČ formátování |
| [CHANGELOG-2026-02-subjects-module.md](CHANGELOG-2026-02-subjects-module.md) | 11.2.2026 | 👤 **Modul Subjekty**<br/>- Nový modul 800 pro centrální seznam subjektů<br/>- Detail s účty, zástupci, přílohami a systémem<br/>- Role flagy + migrace sloupců |

---

## 📖 Struktura changelogu

Každý changelog obsahuje:

### 1️⃣ **Přehled změn**
- Stručný popis, co bylo implementováno
- Důvod změny (problém, požadavek uživatele)

### 2️⃣ **Databázové změny**
- SQL migrace (číslo, název, obsah)
- Nové tabulky, sloupce, indexy
- RLS policies

### 3️⃣ **Service Layer**
- Nové nebo upravené funkce v `app/lib/services/`
- API endpointy

### 4️⃣ **UI Komponenty**
- Nové nebo upravené komponenty
- Změny v modulech
- CSS úpravy

### 5️⃣ **Bug Fix**
- Opravy chyb nalezených během implementace
- TypeScript type fixes

### 6️⃣ **Deployment Checklist**
- Co je potřeba udělat před nasazením do produkce
- Testovací body

### 7️⃣ **Testing**
- Jak otestovat implementované změny
- Edge cases

---

## 🔗 Související dokumentace

- [TODO_MASTER.md](../TODO_MASTER.md) – Plánované úkoly
- [08-plan-vyvoje.md](../08-plan-vyvoje.md) – Plán vývoje
- [07-deployment.md](../07-deployment.md) – Deployment proces

---

## ✍️ Jak vytvořit nový changelog?

Při dokončení větší implementace:

1. Vytvoř soubor: `CHANGELOG-{nazev-zmeny}.md`
2. Použij strukturu z existujících changelogů
3. Zahrň:
   - Databázové migrace (SQL)
   - Změny v service layer
   - Změny v UI
   - Deployment checklist
4. Aktualizuj tabulku výše v tomto README

---

## 🎯 Pravidla pro changelogy

✅ **Vytvoř changelog pro:**
- Novou feature (tab, modul, entita)
- Databázovou migraci
- Větší refaktoring
- Opravu kritického bugu

❌ **Nevytvárej changelog pro:**
- Drobné opravy CSS
- Překlepy v textech
- Změny v dokumentaci
- Single-line bug fixes

---

**Důležité:** Changelogy slouží jako historická reference. Popisuj nejen CO bylo uděláno, ale i PROČ a JAK to testovat.
