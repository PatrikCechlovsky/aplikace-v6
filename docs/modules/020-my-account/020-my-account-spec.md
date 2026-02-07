# aplikace-v6/docs/020-my-account/020-my-account-spec.md
# Modul 020 – Můj účet

## Účel modulu
Modul 020 umožňuje přihlášenému uživateli spravovat svůj vlastní účet,
bez zásahu administrátora.

Uživatel může:

- upravit své základní kontaktní údaje
- změnit email nebo telefon
- nastavit nebo upravit dvoufaktorové ověření (2FA)
- změnit heslo (pomocí bezpečnostního flow)
- zobrazit historii změn svého profilu

Uživatel nesmí:

- vidět nebo měnit role
- vidět nebo měnit oprávnění
- vidět jiné subjekty
- archivovat svůj účet

---

# 1. Definice entity a datový model

Modul používá entitu:

    subject

a zobrazuje výhradně:

    subject = aktuálně přihlášený uživatel

Nepoužívá:

- subject_roles
- subject_permissions
- subjektové vazby
- firemní údaje
- adresu
- účetní nebo systémové funkce jiné než vlastní

Datový model → viz `01-core/subject-model.md`.

---

# 2. Pole používaná v modulu

Používají se jen pole relevantní pro uživatele:

    Identifikace:
        id
        display_name

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
        poslední přihlášení (pokud auth poskytuje)
        poslední změna hesla

    Audit:
        created_at
        updated_at

Nepoužívají se:

    role
    oprávnění
    systémová a technická data
    vazby (units, documents, relationships)

---

# 3. Role a oprávnění modulu

Přístup:

    kdokoliv, kdo je přihlášen a má subjekt typu osoba

Uživatel vidí pouze sebe.

Omezení:

- nesmí vidět role ani oprávnění
- nesmí vidět systémové atributy jiných uživatelů
- nesmí měnit stav účtu (archivovat se)
- nesmí přistupovat k modulu 010

---

# 4. UI struktura modulu

Modul 020 obsahuje pouze:

    UserSelfDetail – detail přihlášeného uživatele

Záložky:

    1. Profil
    2. Účet
    3. Bezpečnost (2FA, heslo)
    4. Historie
    5. Systém (read-only)

---

## 4.1 Záložka PROFIL

Pole (editovatelné):

    first_name
    last_name
    title_before
    phone
    email

Pole (read-only):

    display_name

---

## 4.2 Záložka ÚČET

Zobrazuje:

    login
    email (pokud je zároveň login)
    stav účtu (aktivní)
    poslední přihlášení
    poslední změna hesla

Uživatel může:

    změnit email
    změnit telefon

---

## 4.3 Záložka BEZPEČNOST

Pole:

    two_factor_method (select)
    stav ověřovací metody

Akce:

    aktivovat 2FA
    deaktivovat 2FA
    změnit metodu 2FA
    změnit heslo (přesměrování do auth systému)

Poznámka:

    heslo se nikdy neukládá do subject tabulky

---

## 4.4 Záložka HISTORIE

Zobrazuje:

    created_at
    updated_at
    stručné informace o změnách

Uživatel nevidí interní auditní záznamy z jiných modulů.

---

## 4.5 Záložka SYSTÉM

Read-only sekce:

    subject_id
    is_archived
    technická metadata

Žádné akce.

---

# 5. Vazby modulu

Modul 020 nepoužívá žádné vazby (RelationListWithDetail).

---

# 6. Shrnutí

Modul 020 je omezená, bezpečná a jednoduchá verze detailu uživatele:

- zobrazuje pouze vlastní subjekt
- nesmí zasahovat do systémových částí
- nesmí zobrazovat citlivé informace jiných uživatelů
- respektuje pravidla definovaná ve `01-core`

Tento modul používá stejnou UI strukturu jako 010,
jen s omezenými možnostmi podle role a pravidel.
