# 📝 CHANGELOG – Únor 2026: Modul Subjekty

**Datum:** 11. 2. 2026  
**Oblast:** Modul 800 Subjekty, role subjektů, přílohy a účty

---

## 1️⃣ Přehled změn

- Přidán **modul 800 – Subjekty** jako centrální seznam všech osob/organizací.
- Modul používá **stejný detail a záložky** jako pronajímatel (Detail, Účty, Zástupci, Přílohy, Systém).
- Subjekty lze filtrovat podle typu (osoba, OSVČ, firma, spolek/SVJ, státní, zástupce).
- Role subjektu se ukládají jako **příznaky** (pronajímatel/nájemník/uživatel + zástupci + údržba).

---

## 2️⃣ Databázové změny

### Migrace
- **094_add_subject_delegate_flags.sql** – přidání sloupců:
  - `is_landlord_delegate`, `is_tenant_delegate`, `is_maintenance`, `is_maintenance_delegate`
  - indexy + komentáře

---

## 3️⃣ Service layer

- `app/lib/services/subjects.ts`
  - nové CRUD služby pro seznam a detail subjektů
  - načítání a ukládání role flagů
  - počty subjektů podle typu pro sidebar

---

## 4️⃣ UI komponenty

### Modul 800 – Subjekty
- `app/modules/800-subjekty/module.config.js`
  - tile přehledu + tile „Přidat subjekt“
  - typové filtry v sidebaru
- `app/modules/800-subjekty/tiles/SubjectsTile.tsx`
  - list + detail + přílohy + vazby
- `app/modules/800-subjekty/forms/SubjectDetailFrame.tsx`
  - detail s jednotným layoutem a záložkami
- `app/modules/800-subjekty/tiles/CreateSubjectTile.tsx`
  - výběr typu + založení subjektu
- `app/modules/800-subjekty/tiles/SubjectTypeTile.tsx`
  - filtr podle typu
- `app/modules/800-subjekty/subjectsColumns.ts`
  - sdílené sloupce listu

### Navigace / Sidebar
- `app/modules.index.js` – registrace modulu 800
- `app/UI/Sidebar.tsx` – počty podle typů pro Subjekty
- `app/AppShell.tsx` – dynamické počty a ikony typů v menu

---

## 5️⃣ Dokumentace

- `docs/04-modules.md` – doplněn modul 800
- `docs/06-data-model.md` – doplněny role flagy u tabulky `subjects`

---

## 6️⃣ Deployment checklist

- Spustit migraci **094_add_subject_delegate_flags.sql**.
- Ověřit otevření modulu 800 a listu subjektů.
- Ověřit, že detail subjektu ukládá role a nepadá na chybějících sloupcích.

---

## 7️⃣ Testing

- ✅ Otevření seznamu Subjekty + filtry podle typu.
- ✅ Vytvoření subjektu (osoba/firma/spolek).
- ✅ Uložení role flagů v detailu.
- ✅ Přílohy přes CommonActions.
- ✅ Zobrazení počtů v sidebaru.
