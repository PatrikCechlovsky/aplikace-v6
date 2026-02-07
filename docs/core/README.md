# 🧠 Core Documentation – Základní dokumenty projektu

Tento adresář obsahuje základní koncepty a architekturu aplikace, které se netýkají konkrétních modulů.

---

## 📋 Obsah složky

### 🚀 Pracovní postupy

| Soubor | Popis |
|--------|-------|
| [POSTUP.md](POSTUP.md) | 📝 Postup při vývoji nových funkcí a modulů |
| [SPOLUPRACE-S-AI.md](SPOLUPRACE-S-AI.md) | 🤖 Pravidla a doporučení pro spolupráci s AI nástroji |
| [STRUKTURA-APLIKACE.md](STRUKTURA-APLIKACE.md) | 📁 Struktura projektu, složky, soubory |

### 👤 Datový model subjektů

Subjekty (`subjects` tabulka) jsou centrální entita – reprezentují osoby, firmy, spolky.

| Soubor | Popis |
|--------|-------|
| [subject-model.md](subject-model.md) | 🏢 Obecný popis modelu subjektů |
| [subject-fields.md.](subject-fields.md.) | 📊 Kompletní seznam všech polí v tabulce subjects |
| [subject-model-diagram.md](subject-model-diagram.md) | 🗺️ Diagram vztahů subjektů |
| [subject-permissions.md](subject-permissions.md) | 🔐 Oprávnění a RLS policies pro subjekty |
| [subject-selects.md](subject-selects.md) | 🔽 Definice selectů (dropdownů) pro subjekty |

---

## 🔗 Související dokumentace

- [06-data-model.md](../06-data-model.md) – Kompletní datový model aplikace
- [02-architecture.md](../02-architecture.md) – Celková architektura
- [09-project-rules.md](../09-project-rules.md) – Pravidla projektu

---

## 📖 Kdy číst tyto dokumenty?

- **Začínáš na projektu?** → Začni s `STRUKTURA-APLIKACE.md`
- **Pracuješ s AI?** → Přečti `SPOLUPRACE-S-AI.md`
- **Přidáváš novou funkci?** → Sleduj `POSTUP.md`
- **Pracuješ se subjekty?** → Všechny `subject-*.md` soubory
- **Nastavuješ RLS?** → `subject-permissions.md`

---

**Důležité:** Tyto dokumenty popisují jádro aplikace. Změny zde by měly být konzultovány s celým týmem.
