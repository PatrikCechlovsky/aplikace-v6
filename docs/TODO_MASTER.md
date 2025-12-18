# TODO MASTER – Aplikace v6

Jediný centrální seznam úkolů projektu.

Tento dokument:
- neobsahuje žádný JavaScript / TypeScript / kód
- slouží jako hlavní řídicí checklist projektu
- říká, co chybí, co je potřeba dodělat a v jakém pořadí

---

## 0. Pravidla práce s TODO

- Tento soubor je jediný zdroj pravdy o rozpracovanosti projektu
- Úkoly se:
  - nemažou
  - nepřepisují
  - pouze se označují jako hotové
- Nové úkoly se přidávají výhradně sem
- Každý úkol musí mít:
  - jasný cíl
  - ověřitelný výsledek

---

## 1. Architektura a technický dluh

- Sjednotit životní cyklus formulářů (read / edit / create)
- Ujasnit odpovědnosti komponent:
  - kdo řídí stav
  - kdo ukládá data
- Zkontrolovat obcházení pravidel definovaných v dokumentaci
- Identifikovat a postupně odstranit technický dluh
- Doplnit chybějící konceptuální popisy (stavové a datové)

---

## 2. CommonActions (globální akce)

- Dokončit centrální řízení viditelnosti tlačítek
- Definovat pravidla pro:
  - role
  - oprávnění
  - stav formuláře
- Zajistit správné chování tlačítek:
  - ve čtení je vidět „Edit“, ne „Save“
  - v editaci je vidět „Save“, ne „Edit“
- Zavést globální ochranu proti ztrátě neuložených dat
- Ujasnit chování při:
  - změně tile
  - změně modulu
  - návratu v historii aplikace

---

## 3. Modul 010 – Správa uživatelů

### Uživatel

- Jasně oddělit:
  - detail uživatele
  - pozvánku uživatele
- Ujasnit kdy vzniká:
  - subjekt
  - uživatel
  - pouze pozvánka bez uživatele
- Zkontrolovat vazby na databázi
- Doplnit chybějící pole a stavy

### Pozvánky (Invite flow)

- Popsat celý proces pozvánky od začátku do konce
- Ověřit kontrolu:
  - již odeslaných pozvánek
  - existujících uživatelů
- Definovat stavový model pozvánky:
  - koncept
  - odeslaná
  - přijatá
  - expirovaná
- Doplnit UI:
  - tlačítko pro odeslání
  - informaci o stavu pozvánky

---

## 4. Role a oprávnění

- Opravit přečíslování rolí (duplicitní pořadí)
- Zajistit bezpečný a atomický reorder
- Zkontrolovat konzistenci:
  - rolí
  - typů oprávnění
- Ověřit chování archivovaných položek

---

## 5. UI, layout a styly

- Sjednotit vzhled všech seznamů (ListView)
- Odstranit duplicitní nebo kolidující styly
- Dořešit chování:
  - sidebar vs topmenu
  - lišta akcí
- Ujasnit práci s:
  - ikonovým režimem
  - textovým režimem
  - tématy aplikace

---

## 6. TopMenu (horní menu)

- Dokončit MVP TopMenu
- Zajistit aktivní stav:
  - modulu
  - sekce
  - tile
- Sjednotit chování se Sidebarem
- Dořešit reset výběru při změně modulu
- Doplnit dokumentaci k TopMenu

---

## 7. Data – importy a exporty

- Navrhnout jednotnou koncepci importů
- Umožnit export vzorových šablon
- Definovat validaci dat před importem
- Zajistit přehlednou zpětnou vazbu chyb

---

## 8. Dokumentace

- Aktualizovat dokumentaci podle skutečného stavu aplikace
- Doplnit popis:
  - CommonActions v6
  - TopMenu
  - Invite flow
- Vytvořit modulové TODO dokumenty
- Označit historické části dokumentace (nemazat)

---

## 9. Doporučené pořadí řešení

1. CommonActions
2. Modul 010 – Pozvánky
3. TopMenu
4. Role a oprávnění
5. Dokumentace

---

Další krok:
Vybereme jednu kapitolu a půjdeme úkol po úkolu, dokud ji celou neuzavřeme.
