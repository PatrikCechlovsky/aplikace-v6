# aplikace-v6/app/modules/020-muj-ucet/MODULE-TODO.md
# Modul 020 – Můj účet (My Account)

## Účel dokumentu
Modul umožňuje přihlášenému uživateli spravovat jeho vlastní subjekt.
Je to omezená varianta uživatelského detailu bez admin funkcí.

Modul je určen pouze pro subjekt aktuálně přihlášeného uživatele.

Dokument vychází z:

- POSTUP.md
- subject-model.md
- subject-permissions.md
- ui-list-and-detail-pattern.md
- 020-my-account-spec.md

---

# 1. ENTITY & POLE (subject)

Používají se pouze relevantní pole:

    id
    display_name
    first_name
    last_name
    title_before
    phone
    email
    login
    two_factor_method
    created_at
    updated_at

Nepoužívají se:

    role
    permissions
    systémová nastavení
    vazby
    bankovní účty
    adresy
    firemní data

---

# 2. ROLE & OPRÁVNĚNÍ

Přístup:

    každý přihlášený uživatel

Uživatel smí:

    upravit profil
    upravit email / telefon
    aktivovat 2FA
    změnit heslo
    zobrazit historii

Uživatel nesmí:

    měnit role či oprávnění
    archivovat účet
    vidět jiné uživatele

---

# 3. UI STRUKTURA

Modul obsahuje:

    • UserSelfDetail (DetailView)
    • žádný ListView
    • žádné vazby (RelationList)

---

# 4. DETAILVIEW – USERSELFDETAIL

Záložky:

    1. Profil
    2. Účet
    3. Bezpečnost
    4. Historie
    5. Systém (read-only)

## PROFIL
Pole (editovatelné):

    first_name
    last_name
    title_before
    phone
    email

Pole (read-only):

    display_name
    id

## ÚČET

Zobrazuje:

    login
    email
    stav účtu

Akce:

    změna emailu (ověření)
    změna telefonu

## BEZPEČNOST

Pole:

    two_factor_method
    2FA status

Akce:

    aktivovat 2FA
    deaktivovat 2FA
    změnit heslo (redirect do auth flow)

## HISTORIE

Zobrazuje:

    created_at
    updated_at
    přehled změn (pokud existuje audit)

## SYSTÉM

Read-only:

    subject_id
    is_archived
    systémová metadata

---

# 5. VALIDACE

email – povinný, unikátní  
phone – validní formát  
first_name/last_name – max. délka 100  

---

# 6. FLOW – ZMĚNA HESLA

Flow:

    uživatel spustí akci → systém rediriguje do auth-provider stránky  
    po změně hesla → návrat do aplikace

---

# 7. FLOW – NASTAVENÍ 2FA

    uživatel vybere typ 2FA
    systém provede ověření podle auth provider požadavků
    uloží se typ do subject.two_factor_method

---

# 8. TESTOVACÍ SCÉNÁŘE

    • upravit profil
    • změnit email / telefon
    • aktivovat / deaktivovat 2FA
    • změnit heslo
    • zobrazit auditní historii

---

# 9. HOTOVO
Tento MODULE-TODO je závazný dokument pro implementaci modulu 020.
