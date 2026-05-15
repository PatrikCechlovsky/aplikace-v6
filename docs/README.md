# 📚 Dokumentace – Aplikace Pronajímatel v6

Vítejte v dokumentaci projektu! Tento dokument slouží jako navigace.

---

## 🎯 Hlavní dokumentace (01-10)

Tyto dokumenty popisují celkovou architekturu a pravidla projektu:

| Soubor | Popis |
|--------|-------|
| [01-executive-summary.md](01-executive-summary.md) | 📋 Exekutivní shrnutí projektu |
| [02-architecture.md](02-architecture.md) | 🏗️ Architektura (Next.js, Supabase, moduly) |
| [03-ui-system.md](03-ui-system.md) | 🎨 UI systém (6-section layout, komponenty) |
| [04-modules.md](04-modules.md) | 📦 Systém modulů (struktura, config, tiles) |
| [05-auth-rls.md](05-auth-rls.md) | 🔐 Autentizace a RLS (Supabase policies) |
| [06-data-model.md](06-data-model.md) | 🗄️ Datový model (tabulky, vztahy) |
| [07-deployment.md](07-deployment.md) | 🚀 Nasazení (Vercel, Supabase) |
| [08-plan-vyvoje.md](08-plan-vyvoje.md) | 📅 Plán vývoje (roadmap) |
| [09-project-rules.md](09-project-rules.md) | ⚖️ Pravidla projektu (konvence, standardy) |
| [10-glossary.md](10-glossary.md) | 📖 Slovník pojmů |

---

## 📁 Další složky

### 🧠 [core/](core/)
Základní dokumenty o architektuře a datovém modelu:
- `POSTUP.md` – Postup při vývoji
- `SPOLUPRACE-S-AI.md` – Pravidla spolupráce s AI
- `STRUKTURA-APLIKACE.md` – Struktura projektu
- `subject-model.md` – Model subjektů (osoby, firmy)
- `subject-fields.md` – Pole v tabulce subjects
- `subject-permissions.md` – Oprávnění subjektů
- `subject-selects.md` – Selecty pro subjekty

### 📦 [modules/](modules/)
Dokumentace jednotlivých modulů aplikace:
- `010-users/` – Správa uživatelů
- `020-my-account/` – Můj účet
- `030-landlords/` – Pronajímatelé
- `030-landlords-alt/` – Alternativní dokumentace pronajímatelů
- `050-tenants/` – Nájemníci
- `03-ui/` – UI komponenty

### 📝 [changelogs/](changelogs/)
Historie změn a implementací:
- `CHANGELOG-ADDRESS-LOGIN-PERSONAL-FIELDS.md` – Adresní autocomplete a osobní pole
- `CHANGELOG-TENANT-USERS-DEBOUNCE.md` – Uživatelé nájemníka a debounce vyhledávání
- `CHANGELOG-NAVIGATION-PATTERN-LIST-TO-ADD.md` – Navigation pattern List→Add
- `CHANGELOG-EQUIPMENT-CATALOG-CRUD-TILES.md` – Katalog vybavení (CRUD)
- `CHANGELOG-RELATIONS-LIST-BADGES.md` – Vazby + barevné badge + statusy

### 📖 [guides/](guides/)
Návody a setupy:
- `ADDRESS-AUTOCOMPLETE-SETUP.md` – Návod na nastavení adresního autocomplete
- `ADDRESS-AUTOCOMPLETE-NAVOD.md` – Detailní návod k použití
- `ADDRESS-AUTOCOMPLETE-FIX.md` – Řešení problémů

### 📊 [data/](data/)
CSV a Excel soubory:
- `supabase-fields-overview.csv` – Přehled všech polí v Supabase
- `supabase-fields-samples.csv` – Vzorky hodnot
- `struktura-aplikace.xlsx` – Strukturovaný přehled aplikace

### 🗄️ [archive/](archive/)
Archivované dokumenty (staré verze, kontext):
- `CONTEXT-FOR-ADDRESS-FIX.md` – Kontext pro opravu adresního autocomplete

---

## 🚦 TODO a úkoly

- [TODO_MASTER.md](TODO_MASTER.md) – Master seznam všech úkolů projektu

---

## 🔍 Jak hledat v dokumentaci?

1. **Obecné informace** → `01-10` soubory
2. **Základní koncepty** → `core/`
3. **Specifický modul** → `modules/{číslo-název}/`
4. **Historie změn** → `changelogs/`
5. **Návody** → `guides/`
6. **Data** → `data/`

---

## 📝 Pravidla pro dokumentaci

1. **Hlavní dokumenty (01-10)** – aktualizuj při zásadních změnách
2. **Moduly** – každý modul má vlastní složku v `modules/`
3. **Changelogy** – každá větší implementace má changelog v `changelogs/`
4. **Návody** – praktické how-to v `guides/`
5. **Archiv** – nepotřebné dokumenty přesuň do `archive/`

---

**Poslední aktualizace:** 7. února 2026
