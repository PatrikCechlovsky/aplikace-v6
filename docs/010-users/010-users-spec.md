# aplikace-v6/docs/010-users/010-users-spec.md
# Modul 010 – Správa uživatelů (Users)

## Účel modulu
Modul 010 poskytuje administrátorům a správcům možnost spravovat
uživatele systému.  
Uživatel = subjekt, který má roli `user` a je připojen k autentizačnímu systému.

Modul umožňuje:

- zobrazit seznam všech uživatelů systému
- filtrovat, prohlížet a upravovat detaily uživatelů
- spravovat role a oprávnění uživatelů
- pozvat nové uživatele do systému
- archivovat nebo deaktivovat uživatele

Modul pracuje výhradně nad entitou `subject`.

---

# 1. Definice entity a datový model

Modul nepoužívá vlastní tabulku — uživatel je reprezentován entitou:

    subject

s následujícími doplňujícími vazbami:

    subject_roles (N:N)
    subject_permissions (N:N)

Autentizační údaje (heslo, 2FA) nepatří do tabulky `subject` —  
spravuje je externí auth provider (např. Supabase Auth).

Modul 010 využívá pole z:

- subject
- subject_roles
- subject_permissions

Detail datového modelu → viz `01-core/subject-model.md`.

---

# 2. Pole používaná v modulu (výběr z subject-fields)

Používané skupiny:

    Identifikace:
        id
        display_name
        subject_type (read-only v tomto modulu)
        is_archived

    Osobní údaje:
        first_name
        last_name
        title_before

    Kontakty:
        phone
        email

    Účet:
        login
        two_factor_method

    Role:
        subject_roles (N:N)

    Oprávnění:
        subject_permissions (N:N)

    Audit:
        created_at
        updated_at
        created_by
        updated_by

Pole, která se v tomto modulu nepoužívají:

    firemní identita (ic, dic…)
    adresy
    ARES / RÚIAN data
    domácnost
    bankovní účty
    vztahy mezi subjekty

---

# 3. Role a oprávnění modulu

Matice přístupu:

| Role        | Seznam (ListView) | Detail | Edit | Role/Oprávnění | Archivace |
|-------------|-------------------|--------|------|----------------|-----------|
| admin       | ano               | ano    | ano  | ano            | ano       |
| spravce     | ano               | ano    | ano  | ano            | omezeně   |
| finance     | ano (read-only)   | ano (RO) | ne | ne             | ne        |
| user        | ne                | ne     | ne   | ne             | ne        |
| najemnik    | ne                | ne     | ne   | ne             | ne        |

Uživatel nikdy neupravuje jiný subjekt než sebe — to řeší modul 020.

---

# 4. UI struktura modulu

Modul obsahuje:

    1. UsersListTile – hlavní seznam uživatelů
    2. UserDetail – detail jednoho uživatele
    3. InviteUserForm – pozvání nového uživatele

---

## 4.1 ListView – seznam uživatelů (UsersListTile)

Sloupce:

    display_name (povinný)
    email (povinný)
    phone
    role (výpis rolí)
    created_at
    two_factor_method
    is_archived

Filtry:

    fulltext (jméno, email, telefon)
    role
    status (aktivní / archivní)
    2FA (aktivní / neaktivní)
    datum vytvoření

Výchozí řazení:

    display_name ASC

Akce:

    + Pozvat uživatele
    Zobrazit archivované
    Export seznamu (volitelně)

---

## 4.2 DetailView – detail uživatele

Záložky:

    1. Profil
    2. Účet
    3. Role & Oprávnění
    4. Historie
    5. Systém

### PROFIL

Pole:

    first_name
    last_name
    title_before
    phone
    email
    display_name (read-only)

### ÚČET

Zobrazuje:

    login
    two_factor_method
    poslední přihlášení (pokud poskytuje auth)
    poslední změna hesla (pokud poskytuje auth)

Akce:

    vynutit reset hesla  
    deaktivovat uživatele

### ROLE & OPRÁVNĚNÍ

Obsahuje:

    seznam rolí (subject_roles)
    seznam oprávnění (subject_permissions)

Akce:

    přidat roli
    odebrat roli
    přiřadit oprávnění
    odebrat oprávnění

### HISTORIE

Zobrazuje:

    created_at
    updated_at
    informace o změnách (pokud existuje audit log)

### SYSTÉM

Zobrazuje:

    subject_id
    is_archived
    technické hodnoty

Akce:

    archivovat uživatele  
    obnovit uživatele  

---

## 4.3 InviteUserForm – pozvání nového uživatele

Pole:

    email
    first_name (volitelné)
    last_name (volitelné)
    role (default: user)

Výsledek:

    - založí nový subject
    - nastaví roli user
    - vytvoří účet v auth systému
    - odešle email s pozvánkou

---

# 5. Vazby modulu

Modul 010 pracuje pouze se subjektem a jeho rolemi/oprávněními.

Nepoužívá žádné RelationListWithDetail.

---

# 6. ColumnPicker

ColumnPicker je povolen pro:

    UsersListTile

Povinné sloupce:

    display_name
    email

Volitelné:

    phone
    role
    created_at
    two_factor_method
    is_archived

---

# 7. Shrnutí

Modul 010 je plnohodnotná administrátorská správa uživatelů postavená nad entitou `subject`.

Plně se drží struktury POSTUP:

- definice entity
- specifikace polí
- role a oprávnění
- ListView
- DetailView
- akce (invite, archivace)
- žádné duplicitní datové modely
