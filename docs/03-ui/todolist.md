# TODO – DetailView sekce jako ouška (Tabs) v aplikace-v6

Cíl: mít v appce DetailView, které je složené z **Header + Tabs (ouška) + Active Section**.
Sekce budou definované **centrálně v DetailView** (registry) a jednotlivé entity jen řeknou **které sekce** chtějí zobrazit.

---

## 0) Mini pravidla práce (aby se to nerozbilo)
- [x] Po každé fázi udělat malý commit (např. `feat(detail-tabs): phase-1`)
- [ ] Nic nemazat – když něco nahrazujeme, označit staré jako `// ARCHIVE` nebo přesun do `docs/archive/`
- [x] CSS jen přes theme tokeny (žádné tvrdé barvy) – platí pro Tabs + nový DetailForm

---

## FÁZE 1 – Ouška (Tabs) v DetailView (viditelný výsledek)
**Cíl:** vidět ouška a přepínat obsah.

- [x] Vybrat pilotní detail (010 – Uživatel)
- [x] Přidat komponentu `DetailTabs` (UI only)
- [x] Přidat CSS pro Tabs a napojit na theme
- [x] Napojit CSS import (u nás přes `AppShell.tsx`, ne přes `globals.css`)
- [x] Zobrazit Tabs pod headerem + aktivní stav

✅ Hotovo, když: v appce vidím Tabs „Detail / Role a oprávnění / Přílohy / Systém“ a přepíná to sekce.

---

## FÁZE 2 – Datový model sekcí (registry) – ZAŠITÝ V DETAILVIEW (aktuální rozhodnutí)
**Cíl:** sekce definovat jednou a moduly jen vybírají.

- [x] Definovat `DetailSectionId` + typ sekce přímo v `app/UI/DetailView.tsx`
- [x] Vytvořit centrální registry sekcí v `DetailView.tsx`:
  - [x] `detail` (always)
  - [x] `attachments` (always)
  - [x] `system` (always)
  - [x] `roles`
  - [x] `users`
  - [x] `equipment`
  - [x] `accounts`
- [x] Implementovat `resolveSections()` (always + order + visibleWhen)
- [x] Implementovat `sectionIds` a `ctx.detailContent` (detail je renderovaný z ctx)

✅ Hotovo, když: modul jen předá `sectionIds` a `ctx.detailContent`, a DetailView vše vykreslí.

---

## FÁZE 3 – Pilot entita (010 Uživatel) – finální přepojení
**Cíl:** žádný `activeTab` a žádné `if` v modulu.

- [x] Upravit `UserDetailFrame.tsx`:
  - [x] odstranit lokální Tabs logiku
  - [x] používat `sectionIds` (např. `['roles']`)
  - [x] posílat detail formulář do `ctx.detailContent`
- [x] Zobrazit vždy sekce: `Detail + Přílohy + Systém` (přidává DetailView automaticky)

✅ Hotovo, když: UserDetailFrame je “konfigurace”, ne UI logika.

---

## FÁZE 4 – Vzhled detailu jako “tile” + formulář podle theme (layout)
**Cíl:** žádná šedá natvrdo, využít šířku a jednotný grid.

- [x] Najít příčinu šedé: `UserDetailForm.tsx` měl inline `<style jsx>` s tvrdými barvami
- [x] Založit nový sdílený CSS pro formuláře:
  - [x] `app/styles/components/DetailForm.css`
  - [x] import do `AppShell.tsx`
- [x] Upravit `UserDetailForm.tsx`:
  - [x] odstranit inline `<style jsx>`
  - [x] používat třídy `.detail-form*`
  - [x] grid responzivně, max 4 sloupce, možnost span (email přes 2)
- [ ] Založit/aktivovat CSS pro rám detailu (tile jako GenericTypeTile):
  - [ ] `app/styles/components/EntityDetailFrame.css`
  - [ ] import do `AppShell.tsx`
  - [ ] přebít `entity-detail__body` z 2 sloupců na 1 sloupec (zrušit pravý “volný prostor”)

✅ Hotovo, když: detail karta je jednolitá, široká, bez prázdného sloupce a všechny sekce/formy jedou z theme.

---

## FÁZE 5 – Doplnění obsahu sekcí (už ne architektura, jen obsah)
**Cíl:** placeholdery nahradit reálnými komponentami.

- [ ] Sekce `roles`: reálný obsah (role, oprávnění, skupiny)
- [ ] Sekce `attachments`: komponenta příloh (READ-ONLY tab) + manager tile přes 📎 (upload/verze/historie)
- [ ] Sekce `system`: audit informace (createdAt, updatedAt, archivace)
- [ ] Sekce `accounts`: účty subjektu (napojení později)
- [ ] Sekce `users`: seznam uživatelů jednotky/nájemníka
- [ ] Sekce `equipment`: vybavení jednotky

---

## FÁZE 6 – Reuse na dalších entitách
- [ ] Nájemník: `sectionIds: ['users','accounts']`
- [ ] Jednotka: `sectionIds: ['users','equipment','accounts']`
- [ ] Subjekt: `sectionIds: ['accounts']`

---

# CO NÁM TEĎ CHYBÍ (stručně)
1) `EntityDetailFrame.css` (tile vzhled + zrušení 2-sloupcového layoutu z `Entity.css`)
2) Naplnit první reálnou sekci (`roles`) – zatím je placeholder
3) Vytáhnout další formuláře na nový `DetailForm.css` (aby všechny entity vypadaly stejně)

---

# DALŠÍ KROK (teď hned – doporučené pořadí)
## KROK 1: udělat tile vzhled detailu (bez dalších změn)
- založit `app/styles/components/EntityDetailFrame.css`
- import v `AppShell.tsx`
- přebít `entity-detail__body` na 1 sloupec + sjednotit padding/radius

✅ Výsledek: zmizí prázdné plochy a detail bude “jako GenericTypeTile”.

Potom:
## KROK 2: naplnit sekci `roles` v DetailView (uživatel)
