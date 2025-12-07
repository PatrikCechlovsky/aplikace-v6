# /docs/01-executive-summary.md
## Popis: Tento dokument stručně shrnuje účel aplikace, klíčové funkce a aktuální stav projektu.
---

# 01 – Executive Summary

## 1. O aplikaci

**Pronajímatel v6** je webová aplikace pro správu nájemních vztahů a menšího až středního portfolia nemovitostí.  
Je to 6. generace systému, přepsaná z původního no-code řešení do moderní modulární architektury (Next.js + Supabase).

Aplikace je navržena tak, aby dlouhodobě zvládla:
- růst počtu nemovitostí a jednotek,
- více uživatelů/rolí (pronajímatel, správce, účetní…),
- přehlednou práci s dokumenty, platbami a vyúčtováním.

Produkční URL:
- `https://aplikace-v6.vercel.app`  *(pracovní / testovací prostředí)*

---

## 2. Co aplikace řeší (hlavní funkcionalita)

Aplikace je modulární – jednotlivé oblasti jsou oddělené do modulů:

- **Pronajímatelé / Subjekty** – evidence právnických i fyzických osob.
- **Nemovitosti a jednotky** – domy, byty, místnosti, kanceláře…
- **Nájemníci** – osoby / firmy, které v jednotkách bydlí či používají prostory.
- **Smlouvy** – nájemní smlouvy, dodatky, ukončení.
- **Služby a energie** – typy služeb, sazby, měřidla, odečty.
- **Platby a finance** – nájemné, zálohy, úhrady, párování plateb.
- **Dokumenty** – smlouvy, přílohy, vyúčtování v PDF.
- **Komunikace** – e-maily, upozornění, připomínky.
- **Nastavení (modul 900)** – typy, číselníky, motivy, ikonky, konfigurace.

Cíl:  
Umožnit majiteli nebo správci **mít celý životní cyklus nájemního vztahu na jednom místě**, od založení smlouvy, přes sledování plateb, až po vyúčtování a archiv.

---

## 3. Pro koho je systém určen

- majitelé menšího a středního portfolia (řádově desítky až stovky jednotek),
- menší správcovské firmy,
- techničtí správci a „facility“ role,
- případně účetní, kteří potřebují přehledné podklady.

Důraz je na:
- jednoduché ovládání,
- přehlednost,
- možnost postupného rozšiřování (moduly, role, typy, číselníky),
- bezpečnost dat (Supabase, RLS).

---

## 4. Technologie (vysoká úroveň)

- **Next.js 14 (App Router)** – moderní React framework, server components.
- **React 18** – UI knihovna.
- **TypeScript** – typová bezpečnost a čitelný kód.
- **Supabase** – autentizace, databáze, Row Level Security.
- **Vercel** – build, CI/CD a hosting.
- **Vlastní UI systém** – 6-sekční layout (Sidebar, HomeButton, Breadcrumbs, HomeActions, CommonActions, Content).

Detailní technický rozpis je v:
- `docs/02-architecture.md`
- `docs/03-ui-system.md`
- `docs/CODESTYLE.md` (nebo `09-project-rules.md`, až vznikne)

---

## 5. Aktuální stav projektu

K dnešnímu stavu je:

- ✅ Hotový základní layout (6 sekcí).
- ✅ Funkční autentizace přes Supabase (login, logout, session).
- ✅ UI komponenty: HomeButton, Sidebar, Breadcrumbs, HomeActions, CommonActions v1.
- ✅ Dynamické načítání modulů (010–900).
- ✅ Základ formulářového a seznamového UI (ListView, DetailView, GenericTypeTile).
- ✅ Aktivní modul **900 – Nastavení** (typy, témata, ikony).

Rozpracováno / plánováno:

- ⏳ Role & oprávnění (permission systém nad moduly).
- ⏳ CommonActions v2 (akce podle modulu, typu, role a stavu formuláře).
- ⏳ Dynamické breadcrumbs.
- ⏳ Datový model pro služby, měřidla, vyúčtování.
- ⏳ Moduly Dokumenty, Komunikace, Platby v plném rozsahu.

Podrobnější rozpis stavu je v:
- `docs/stav-struktury.md`
- `docs/todo_list.md`

---

## 6. Další kroky (high-level plán)

Krátkodobě:
- dokončit modul 900 – typy, číselníky, konfiguraci UI,
- doplnit CommonActions v2 a dynamické breadcrumbs,
- připravit základ modulů Dokumenty, Komunikace a Platby.

Střednědobě:
- nasadit role a oprávnění (RLS + UI),
- sjednotit Form Engine (konfigurace polí z jednoho místa),
- rozšířit datový model (energie, měřidla, vyúčtování).

Dlouhodobě:
- automatizovat generování dokumentů (PDF),
- rozšířit notifikační centrum,
- připravit multi-tenant režim (více pronajímatelů v jednom systému).

---

## 7. Jak tento dokument používat

Tento **Executive Summary** slouží jako rychlý přehled:

- pro nové vývojáře,
- pro budoucí dokumentaci,
- pro prezentaci projektu (co umí, kam směřuje).

Detailní informace hledej v dalších souborech v adresáři `/docs` (02–10).
