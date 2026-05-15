# 📦 Dokumentace modulů

Tento adresář obsahuje dokumentaci jednotlivých modulů aplikace.

---

## 🗂️ Struktura modulů

Každý modul má číselnou předponu podle pořadí v aplikaci:

| Prefix | Modul | Popis |
|--------|-------|-------|
| **010** | [010-users/](010-users/) | 👥 Správa uživatelů (user management) |
| **020** | [020-my-account/](020-my-account/) | 👤 Můj účet (user profile, settings) |
| **030** | [030-landlords/](030-landlords/) | 🏢 Pronajímatelé (landlords) |
| **030** | [030-landlords-alt/](030-landlords-alt/) | 🏢 Alternativní dokumentace pronajímatelů |
| **050** | [050-tenants/](050-tenants/) | 🏠 Nájemníci (tenants) |
| **060** | [060-contracts/](060-contracts/) | 📄 Smlouvy (contracts) |
| **03** | [03-ui/](03-ui/) | 🎨 UI komponenty a design system |

---

## 📋 Co najdete v každém modulu?

Každá složka modulu může obsahovat:

- **README.md** – přehled modulu, účel, hlavní funkce
- **database/** – SQL migrace, schéma tabulek, RLS policies
- **components/** – dokumentace UI komponent modulu
- **services/** – popis service layer funkcí
- **forms/** – specifikace formulářů a polí
- **screenshots/** – vizuální dokumentace

---

## 🔗 Související dokumentace

- [Hlavní dokumentace](../) – návrat do kořene docs/
- [02-architecture.md](../02-architecture.md) – celková architektura
- [04-modules.md](../04-modules.md) – obecný popis systému modulů
- [06-data-model.md](../06-data-model.md) – datový model

---

## 🚀 Jak přidat nový modul?

1. Vytvoř složku `XXX-nazev/` s číselnou předponou
2. Vytvoř `README.md` s popisem modulu
3. Dokumentuj databázové změny (migrace, RLS)
4. Zapiš specifika UI a service layer
5. Aktualizuj tento README s odkazem

---

**Pozor:** Čísla `040, 060, 070, 080, 090, 100, 120, 130` jsou rezervována pro další moduly v aplikaci (nemovitosti, smlouvy, služby, platby, finance, energie, dokumenty, komunikace).
