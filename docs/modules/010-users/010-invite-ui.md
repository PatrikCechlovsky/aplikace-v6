// /docs/010-users/010-invite-ui.md


# Modul 010 – Invite flow (UI specifikace)

## 1. Typ obrazovky
- Detailová obrazovka
- Vlastní kontext (není UserDetail)

## 2. Struktura
- DetailFrame
- DetailTabs
  - Pozvánka
  - Systém (až po vytvoření)

## 3. Stav obrazovky
- nový invite (bez ID)
- existující invite (má ID, má systémová data)

## 4. Chování při zavření
- při změně dat platí dirty guard,
- při potvrzení zrušení návrat do seznamu uživatelů.

## 5. Vztah k seznamu uživatelů
- pozvánka se neobjevuje jako uživatel,
- seznam uživatelů se po odeslání znovu načte.

---

## 6. Konzistence UI
- žádné inline styly,
- žádná přímá komunikace s databází v UI,
- žádná business logika v komponentách.

Veškerá validace a zápis probíhá ve service vrstvě.
