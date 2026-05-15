# 🗺️ Mapa dokumentace – Kompletní přehled

Tento dokument obsahuje **úplný přehled všech dokumentů** v projektu.

---

## 📊 Statistika dokumentace

- **Hlavní dokumenty:** 10 (01-10.md)
- **Core dokumenty:** 8 (základní koncepty)
- **Moduly:** 6 složek (010, 020, 030, 030-alt, 050, 03-ui)
- **Changelogy:** 5 (implementace)
- **Guides:** 3 (návody)
- **Data:** 3 soubory (CSV/Excel)
- **Celkem .md souborů:** ~70

---

## 🎯 Hlavní dokumenty (01-10)

Tyto dokumenty jsou **vstupní bodem** pro pochopení projektu:

| # | Soubor | Popis | Kdy číst? |
|---|--------|-------|-----------|
| 1 | [01-executive-summary.md](01-executive-summary.md) | 📋 Exekutivní shrnutí | První dokument – přehled celého projektu |
| 2 | [02-architecture.md](02-architecture.md) | 🏗️ Architektura | Technický stack, složky, design patterns |
| 3 | [03-ui-system.md](03-ui-system.md) | 🎨 UI systém | 6-section layout, komponenty, responsive |
| 4 | [04-modules.md](04-modules.md) | 📦 Systém modulů | Jak fungují moduly, config, tiles |
| 5 | [05-auth-rls.md](05-auth-rls.md) | 🔐 Auth & RLS | Supabase Auth, Row Level Security |
| 6 | [06-data-model.md](06-data-model.md) | 🗄️ Datový model | Tabulky, vztahy, migrace |
| 7 | [07-deployment.md](07-deployment.md) | 🚀 Deployment | Vercel, Supabase, environment vars |
| 8 | [08-plan-vyvoje.md](08-plan-vyvoje.md) | 📅 Plán vývoje | Roadmap, milestones |
| 9 | [09-project-rules.md](09-project-rules.md) | ⚖️ Pravidla projektu | Konvence, standardy, best practices |
| 10 | [10-glossary.md](10-glossary.md) | 📖 Slovník pojmů | Terminologie, zkratky |

➡️ **Start zde:** [README.md](README.md)

---

## 🧠 Core dokumenty

Základní koncepty, které se prolínají celou aplikací:

| Soubor | Popis |
|--------|-------|
| [core/README.md](core/README.md) | 📋 **Index core dokumentů** |
| [core/POSTUP.md](core/POSTUP.md) | 📝 Postup při vývoji nových funkcí |
| [core/SPOLUPRACE-S-AI.md](core/SPOLUPRACE-S-AI.md) | 🤖 Pravidla pro spolupráci s AI |
| [core/STRUKTURA-APLIKACE.md](core/STRUKTURA-APLIKACE.md) | 📁 Struktura projektu (složky, soubory) |
| [core/subject-model.md](core/subject-model.md) | 🏢 Model subjektů (osoby, firmy) |
| [core/subject-fields.md.](core/subject-fields.md.) | 📊 Všechna pole v subjects tabulce |
| [core/subject-model-diagram.md](core/subject-model-diagram.md) | 🗺️ Diagram vztahů subjektů |
| [core/subject-permissions.md](core/subject-permissions.md) | 🔐 RLS policies pro subjekty |
| [core/subject-selects.md](core/subject-selects.md) | 🔽 Selecty (dropdowny) pro subjekty |

---

## 📦 Moduly

Každý modul má vlastní složku s podrobnou dokumentací:

### [modules/010-users/](modules/010-users/) – 👥 Správa uživatelů

| Soubor | Popis |
|--------|-------|
| [README.md](modules/010-users/README.md) | Přehled modulu, účel, databáze |
| [010-users.md](modules/010-users/010-users.md) | Hlavní dokumentace |
| [010-users-spec.md](modules/010-users/010-users-spec.md) | Technická specifikace |
| [010-invite-flow.md](modules/010-users/010-invite-flow.md) | Flow pozvánek |
| [010-invite-ui.md](modules/010-users/010-invite-ui.md) | UI pro pozvánky |
| [010-invite-backend.md](modules/010-users/010-invite-backend.md) | Backend implementace |

### [modules/020-my-account/](modules/020-my-account/) – 👤 Můj účet

| Soubor | Popis |
|--------|-------|
| [README.md](modules/020-my-account/README.md) | Přehled modulu, profil, settings |
| [020-my-account-spec.md](modules/020-my-account/020-my-account-spec.md) | Technická specifikace |
| [020-my-account-fields-recommendation.md](modules/020-my-account/020-my-account-fields-recommendation.md) | Doporučení polí |

### [modules/030-landlords/](modules/030-landlords/) – 🏢 Pronajímatelé

| Soubor | Popis |
|--------|-------|
| [README.md](modules/030-landlords/README.md) | Přehled modulu, landlords, checkboxy |
| [010-020-combined-logic.md](modules/030-landlords/010-020-combined-logic.md) | Kombinovaná logika s moduly 010 a 020 |

### [modules/030-landlords-alt/](modules/030-landlords-alt/) – 🏢 Pronajímatelé (alt)

| Soubor | Popis |
|--------|-------|
| [CONTEXT-FOR-ADDRESS-FIX.md](modules/030-landlords-alt/CONTEXT-FOR-ADDRESS-FIX.md) | Kontext pro opravu adresního autocomplete |
| [validation-roles-implementation.md](modules/030-landlords-alt/validation-roles-implementation.md) | Implementace validací a rolí |

### [modules/050-tenants/](modules/050-tenants/) – 🏠 Nájemníci

| Soubor | Popis |
|--------|-------|
| [README.md](modules/050-tenants/README.md) | Přehled modulu, tenants, tenant_users, migrace 052 |
| [CONTEXT-FOR-MODULE-DUPLICATION.md](modules/050-tenants/CONTEXT-FOR-MODULE-DUPLICATION.md) | Proč byl modul duplikován |

### [modules/03-ui/](modules/03-ui/) – 🎨 UI komponenty

| Soubor | Popis |
|--------|-------|
| [README.md](modules/03-ui/README.md) | Přehled UI systému, 6-section layout, responsive |
| [attachments.md](modules/03-ui/attachments.md) | Systém příloh (storage, verze) |
| [forms-layout.md](modules/03-ui/forms-layout.md) | Layout formulářů, grid, breakpoints |
| [ui-list-and-detail-pattern.md](modules/03-ui/ui-list-and-detail-pattern.md) | ListView + DetailFrame pattern |

➡️ **Index modulů:** [modules/README.md](modules/README.md)

---

## 📝 Changelogy

Historie implementací a změn:

| Soubor | Datum | Popis |
|--------|-------|-------|
| [changelogs/README.md](changelogs/README.md) | - | 📋 Pravidla pro changelogy |
| [changelogs/CHANGELOG-ADDRESS-LOGIN-PERSONAL-FIELDS.md](changelogs/CHANGELOG-ADDRESS-LOGIN-PERSONAL-FIELDS.md) | 10.1.2026 | 🏠 Adresní autocomplete + osobní pole |
| [changelogs/CHANGELOG-TENANT-USERS-DEBOUNCE.md](changelogs/CHANGELOG-TENANT-USERS-DEBOUNCE.md) | 18.1.2026 | 👥 Uživatelé nájemníka + debounce |
| [changelogs/CHANGELOG-NAVIGATION-PATTERN-LIST-TO-ADD.md](changelogs/CHANGELOG-NAVIGATION-PATTERN-LIST-TO-ADD.md) | 20.1.2026 | 🧭 Navigation pattern List→Add |
| [changelogs/CHANGELOG-EQUIPMENT-CATALOG-CRUD-TILES.md](changelogs/CHANGELOG-EQUIPMENT-CATALOG-CRUD-TILES.md) | 1.2.2026 | 🧰 Katalog vybavení (CRUD) |
| [changelogs/CHANGELOG-RELATIONS-LIST-BADGES.md](changelogs/CHANGELOG-RELATIONS-LIST-BADGES.md) | 25.1.2026 | 🎨 Vazby + badge + statusy |

---

## 📖 Guides (návody)

Praktické návody pro setup:

| Soubor | Popis |
|--------|-------|
| [guides/README.md](guides/README.md) | 📋 Index návodů |
| [guides/ADDRESS-AUTOCOMPLETE-SETUP.md](guides/ADDRESS-AUTOCOMPLETE-SETUP.md) | 🏠 Setup ARES API |
| [guides/ADDRESS-AUTOCOMPLETE-NAVOD.md](guides/ADDRESS-AUTOCOMPLETE-NAVOD.md) | 📝 Jak používat autocomplete |
| [guides/ADDRESS-AUTOCOMPLETE-FIX.md](guides/ADDRESS-AUTOCOMPLETE-FIX.md) | 🔧 Troubleshooting |

---

## 📊 Data

CSV a Excel soubory:

| Soubor | Popis |
|--------|-------|
| [data/README.md](data/README.md) | 📋 Index datových souborů |
| [data/struktura-aplikace.xlsx](data/struktura-aplikace.xlsx) | 📊 Kompletní struktura v Excelu |
| [data/Supabase Snippet 01_prehled_vsech_poli.csv](data/Supabase%20Snippet%2001_prehled_vsech_poli.csv) | 🗄️ Export všech polí |
| [data/Supabase Snippet 02_vzorky_hodnot_vsech_poli.csv](data/Supabase%20Snippet%2002_vzorky_hodnot_vsech_poli.csv) | 📝 Vzorky hodnot |

---

## 🗄️ Archiv

Staré verze a kontextové dokumenty:

| Složka | Obsah |
|--------|-------|
| [archive/](archive/) | 📦 Archivované dokumenty (staré verze, kontext) |
| [archive/texty/](archive/texty/) | 📝 Staré textové verze hlavních dokumentů |

---

## 📋 Další dokumenty v rootu

| Soubor | Popis |
|--------|-------|
| [TODO_MASTER.md](TODO_MASTER.md) | ✅ Master seznam úkolů |
| [README.md](README.md) | 📚 Hlavní navigace (tento dokument) |

---

## 🔍 Jak rychle najít co potřebuji?

### Hledám obecné informace o projektu
→ [01-executive-summary.md](01-executive-summary.md)

### Chci pochopit architekturu
→ [02-architecture.md](02-architecture.md) + [core/STRUKTURA-APLIKACE.md](core/STRUKTURA-APLIKACE.md)

### Pracuji na konkrétním modulu
→ [modules/{číslo-název}/README.md](modules/README.md)

### Hledám historii změn
→ [changelogs/README.md](changelogs/README.md)

### Potřebuji návod na setup
→ [guides/README.md](guides/README.md)

### Pracuji se subjekty (osoby/firmy)
→ [core/subject-model.md](core/subject-model.md) + všechny `subject-*.md`

### Nastavuji RLS políčka
→ [05-auth-rls.md](05-auth-rls.md) + [core/subject-permissions.md](core/subject-permissions.md)

### Vyvíjím UI komponentu
→ [03-ui-system.md](03-ui-system.md) + [modules/03-ui/](modules/03-ui/)

### Nastavuji deployment
→ [07-deployment.md](07-deployment.md)

### Hledám pravidla pro psaní kódu
→ [09-project-rules.md](09-project-rules.md) + [core/SPOLUPRACE-S-AI.md](core/SPOLUPRACE-S-AI.md)

---

## 📈 Statistika souborů

```
docs/
├── 📄 10 hlavních dokumentů (01-10.md)
├── 🧠 8 core dokumentů (základní koncepty)
├── 📦 6 modulů (každý s vlastní dokumentací)
├── 📝 2 changelogy (implementace)
├── 📖 3 guides (návody)
├── 📊 3 data soubory (CSV/Excel)
└── 🗄️ ~20 archivovaných dokumentů
```

---

**Poslední aktualizace:** 18. ledna 2026

**Tip:** Pokud nevíš, kde začít, začni tady: [README.md](README.md) → pak [01-executive-summary.md](01-executive-summary.md)
