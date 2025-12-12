# aplikace-v6/app/modules/010-sprava-uzivatelu/MODULE-TODO.md
# Modul 010 – Správa uživatelů (Users)

## Účel dokumentu
Tento dokument definuje kompletní specifikaci implementace modulu
010 – Správa uživatelů.  
Modul slouží administrátorům ke správě subjektů, které mají roli `user`,
a k pozvání nových uživatelů do systému.

Dokument vychází z:

- POSTUP.md
- subject-model.md
- subject-permissions.md
- ui-list-and-detail-pattern.md
- 010-users-spec.md

---

# 1. ENTITY & POLE (subject)

Modul používá entitu:

    subject

Používaná pole (výběr):

    id
    display_name
    first_name
    last_name
    title_before
    phone
    email
    login
    two_factor_method
    subject_roles (N:N)
    subject_permissions (N:N)
    created_at
    updated_at
    is_archived

Nepoužívaná pole:

    firma / ic / dic / adresa / ares / ruian
    bankovní účty
    domácnost
    vztahy mezi subjekty

Selecty:

    two_factor_method: fixed
    roles: lookup (generic_type)
    permissions: lookup (generic_type)

---

# 2. ROLE & OPRÁVNĚNÍ

Přístup:

    admin: plný
    spravce: plný kromě mazání adminů
    finance: pouze čtení
    ostatní role: žádný přístup

Viditelnost a editace polí:

    admin: vše
    spravce: vše mimo kritické systémové akce
    finance: read-only
    user/najemnik: nevidí modul

---

# 3. UI STRUKTURA

Modul obsahuje:

    • UsersListTile (ListView)
    • UserDetail (DetailView)
    • InviteUserForm (flow pozvánky)

---

# 4. LISTVIEW – USERSLISTTILE

Sloupce:

    display_name (P)
    email (P)
    phone (V)
    role (V)
    created_at (V)
    two_factor_method (V)
    is_archived (V)

Filtry:

    fulltext: jméno/email/telefon
    role
    stav (aktivní / archivní)
    2FA (ano/ne)
    datum vytvoření

CommonActions:

    + Pozvat uživatele
    Zobrazit archivované

RowActions:

    Detail
    Archivovat / Obnovit
    Reset hesla

ColumnPicker:

    Povinné: display_name, email
    Volitelné: ostatní sloupce

---

# 5. DETAILVIEW – USERDETAIL

Záložky:

    1. Profil
    2. Účet
    3. Role & Oprávnění
    4. Historie
    5. Systém

## PROFIL (editovatelné)
    first_name
    last_name
    title_before
    phone
    email
    display_name (read-only)

## ÚČET
    login (read-only)
    two_factor_method
    poslední přihlášení (pokud je v auth)
    poslední změna hesla

Akce:
    reset hesla
    deaktivovat účet

## ROLE & OPRÁVNĚNÍ
    subject_roles (přidat/odebrat)
    subject_permissions (přidat/odebrat)

## HISTORIE
    created_at / created_by
    updated_at / updated_by

## SYSTÉM
    subject_id
    is_archived
    archivovat / obnovit

---

# 6. FLOW – POZVAT UŽIVATELE

Formulář:

    email (povinný)
    first_name (volitelný)
    last_name (volitelný)
    role (default user)

Výsledek:

    • vytvoří subject
    • přiřadí roli user
    • založí účet v auth
    • odešle email s pozvánkou

---

# 7. VALIDACE

Pole:

    email – unikátní
    phone – volitelný, ale validní formát
    jméno/příjmení – max. délka 100 znaků

Role / permissions:

    validní typy z generic_type v modulu 900

---

# 8. ARCHIVACE

Archivace:

    is_archived = true
    deaktivuje login uživatele
    uživatel se nesmí přihlásit

Obnovení:

    is_archived = false

---

# 9. TESTOVACÍ SCÉNÁŘE

    • vytvořit uživatele přes invite
    • přiřadit role
    • odebrat role
    • archivovat a obnovit
    • validace emailu
    • přihlášení pozvaného uživatele

---

# 10. HOTOVO
Tento MODULE-TODO je závazný podklad pro implementaci modulu 010.
---

## DOPLNĚNÍ (2025-12-12) – Soulad s POSTUP.md

Tento modul je realizován **výhradně dle POSTUP.md**.

### Stav kroků POSTUP.md
- [x] Krok 1 – Specifikace polí (ENTITY & POLE jsou definovány výše)
- [x] Krok 2 – Selecty a číselníky
- [x] Krok 3 – Role a oprávnění
- [x] Krok 4 – UI struktura (ListView / DetailView)
- [ ] Krok 5 – ColumnPicker (ověřit při implementaci)
- [ ] Krok 6 – Implementace v kódu

### Architektonická poznámka
- Modul **nesmí měnit layout**
- Modul **nesmí aplikovat CSS třídy**
- Modul **respektuje UI config z AppShell**

Tento MODULE-TODO je považován za **závazný plán implementace**.
