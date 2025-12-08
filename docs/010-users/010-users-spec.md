# aplikace-v6/docs/010-users/010-users-spec.md
# Modul 010 – Správa uživatelů

## Účel modulu
Modul 010 slouží pro správu uživatelů systému.  
Uživatel = subjekt, který má roli `user` a případně další oprávnění.
Modul umožňuje:

- zobrazit seznam uživatelů
- spravovat jejich role a oprávnění
- upravovat jejich profilové údaje (část subjektu)
- pozvat nového uživatele do systému (emailová pozvánka)
- deaktivovat / archivovat účet

Modul slouží administrátorům a správcům platformy.

---

# 1. Definice entity

V modulu se nepracuje s vlastní tabulkou „users“ —  
používá se **centrální entita `subject`**, rozšířená o:

- roli `user` v tabulce `subject_roles`
- oprávnění v tabulce `subject_permissions`
- přihlašovací údaje (login, 2FA)
- návaznost na autentizační systém (Supabase auth nebo jiný provider)

Z pohledu UI a logiky vždy reprezentujeme:

    „uživatel = subjekt, který má roli USER“

---

# 2. Pole používaná v modulu

Modul 010 využívá podmnožinu polí entity `subject`.

Používají se tato pole:

    identifikace: id, subject_type, display_name
    osobní údaje: first_name, last_name, title_before
    kontakty: email, phone
    přihlášení: login, two_factor_method
    role: subject_roles
    oprávnění: subject_permissions
    audit: created_at, updated_at, is_archived

Nepoužívají se:

    firemní identita (ic, dic…)
    adresa (street, city…)
    ARES / RÚIAN pole
    bankovní účty
    další uživatelé domácnosti

---

# 3. Role a oprávnění – kdo smí co

Modul využívá pravidla z `subject-permissions.md`.

### Oprávnění vstupu do modulu 010

    admin: plný přístup
    spravce: plný přístup
    user: nesmí vstoupit
    najemnik: nesmí vstoupit
    pronajimatel: nesmí vstoupit
    finance: vidí pouze seznam, ale nesmí měnit

### Kdo smí co:

- admin: vše
- spravce: správa uživatelů kromě mazání adminů
- finance: jen čtení
- ostatní role: žádný přístup

---

# 4. UI struktura modulu 010

Modul má dvě hlavní části:

    1. ListView – seznam uživatelů
    2. DetailView – detail uživatele (velký formulář + záložky)

Struktura vychází z POSTUPu a UI systému.

---

## 4.1 ListView – seznam uživatelů

Použité komponenty:

    EntityList
    Filtry
    ColumnPicker
    CommonActions
    RowActions (na každém řádku)

### Zobrazované sloupce:

    display_name
    email
    phone
    role (výpis rolí)
    created_at
    is_archived

### Filtry:

    text: hledání (jméno, email)
    role: uživatelská role
    status: aktivní / archivní
    2FA: ano / ne
    datum vytvoření: od–do

### Akce na seznamu:

    + Přidat / Pozvat uživatele
    Export seznamu (volitelné)
    Zobrazit archivované

---

## 4.2 Detail uživatele (EntityDetailFrame)

Detail je rozdělen na záložky:

    1. Profil
    2. Účet (login, email, telefon, 2FA)
    3. Role a oprávnění
    4. Historie
    5. Systém

---

### Záložka 1: PROFIL

Obsahuje:

    first_name
    last_name
    title_before
    display_name (read-only)
    phone
    email

Jedná se o podmnožinu polí `subject`.

---

### Záložka 2: ÚČET

Účet obsahuje:

    login
    email (používá se i jako login, pokud je tak nastaveno)
    two_factor_method
    možnost reset hesla (akce)
    možnost deaktivace účtu

Zobrazuje také stav:

    poslední přihlášení
    poslední změna hesla

---

### Záložka 3: ROLE A OPRÁVNĚNÍ

Umožňuje:

    přiřadit roli subjektu (subject_roles)
    odebrat roli
    zobrazit všechna oprávnění
    přiřadit oprávnění (subject_permissions)

Role a oprávnění jsou převzaty z modul 900 → číselníky.

---

### Záložka 4: HISTORIE

Zobrazuje:

    vytvořil / datum
    poslední úprava / datum
    přehled změn (pokud modul auditu existuje)

---

### Záložka 5: SYSTÉM

Interní data:

    subject_id
    stav účtu (aktivní / archivní)
    tlačítko „Archivovat uživatele“
    tlačítko „Obnovit uživatele“ (pokud archivní)

---

# 5. Akce modulu

Modul 010 podporuje tyto akce:

### 5.1 Pozvat uživatele
Vyžaduje vyplnit:

    email
    role
    volitelně telefon

Po odeslání:

    → vytvoří se subjekt typu osoba
    → nastaví se role user
    → odešle se pozvánka přes autentizační systém

---

### 5.2 Resetovat heslo
Akce dostupná v záložce Účet.

---

### 5.3 Archivovat / deaktivovat uživatele
Nesmaže data — pouze nastaví:

    is_archived = true

---

### 5.4 Obnovit uživatele
Nastaví:

    is_archived = false

---

# 6. Vazby na jiné moduly

Modul 010 úzce spolupracuje s:

    020 – Můj účet
    900 – číselníky rolí a oprávnění
    autentizační systém (Supabase auth nebo jiný provider)

Nesmí zasahovat:

    do nájemníků (050)
    do nemovitostí
    do smluv

---

# 7. Shrnutí

- Modul 010 pracuje s entitou `subject` typu „uživatel“
- Oddělená prezentace a logika pro:
      profil, účet, role, oprávnění, historie, systém
- Plně navázáno na dokumenty:
      subject-fields.md
      subject-permissions.md
      subject-model.md
- Modul je čistě administrátorský
- Obsahuje funkci „pozvat uživatele“

