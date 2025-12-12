# Modul 900 – Nastavení (Configuration & Dictionaries)

## Účel dokumentu
Modul 900 je **konfigurační autorita aplikace**.

- spravuje číselníky (generic types)
- spravuje UI nastavení
- neobsahuje doménová data
- ovlivňuje ostatní moduly **nepřímo**

Dokument je vytvořen dle POSTUP.md.

---

## 1. ENTITY & POLE

Modul 900 **nemá vlastní business entitu**.

Pracuje s:
- generic types
- uživatelskými preferencemi
- systémovou konfigurací

---

## 2. GENERIC TYPES (ČÍSELNÍKY)

Modul je zdrojem pro:
- subject_roles
- subject_permissions
- property_type
- unit_type
- equipment_category
- contract_type
- payment_type
- další konfigurovatelné selecty

Každý generic type:
- má vlastní Tile
- je použitelný napříč moduly

---

## 3. UI NASTAVENÍ

Spravované oblasti:
- Theme (light / dark / auto)
- Accent
- Režim menu (sidebar / topmenu)
- Režim ikon (icons / text)

Pravidlo:
- Modul 900 **pouze ukládá hodnoty**
- Aplikace probíhá přes:
  UI config → AppShell → className → CSS

---

## 4. UI STRUKTURA MODULU

Modul obsahuje:
- Tiles pro Generic Types
- Tiles pro UI nastavení
- ŽÁDNÝ ListView
- ŽÁDNÉ DetailView entity

---

## 5. ROLE & OPRÁVNĚNÍ

Přístup:
- admin: plný
- ostatní role: dle potřeby (většinou read-only nebo žádný)

---

## 6. VAZBA NA OSTATNÍ MODULY

- ostatní moduly:
  - čtou generic types z modulu 900
  - nikdy si nedefinují vlastní číselníky

Modul 900:
- je nezávislý
- je vždy načten

---

## 7. STAV DLE POSTUP.md

- [x] Krok 1 – Specifikace (konfigurační modul)
- [x] Krok 2 – Selecty / generic types
- [x] Krok 3 – Role
- [x] Krok 4 – UI struktura
- [ ] Krok 5 – Kontrola vazeb v ostatních modulech
- [ ] Krok 6 – Implementace / testy

---

## 8. POZNÁMKY

Modul 900 je:
- referenční
- stabilní
- mění se jen výjimečně

Jakákoliv změna v modulu 900:
➡️ musí být propsána do dokumentace.
