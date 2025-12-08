# aplikace-v6/docs/020-my-account/020-my-account-spec.md
# Modul 020 – Můj účet

## Účel modulu
Modul 020 umožňuje přihlášenému uživateli spravovat jeho vlastní účet.
Jedná se o „self-service“ uživatelský profil, který vychází z entity
`subject` a sdílí logiku s modulem 010 – Správa uživatelů.

Zatímco modul 010 je administrátorský, modul 020 je striktně omezen na:

    subjekt = aktuálně přihlášený uživatel

Uživatel smí:

- zobrazit své osobní informace
- upravit základní kontaktní údaje
- spravovat přihlášení (heslo, 2FA)
- zobrazit historii změn
- nastavit jazyk a preferovaný způsob komunikace (pokud bude přidáno)

Uživatel **nesmí**:

- měnit své role
- měnit svá oprávnění
- měnit systémové údaje
- měnit auditní informace
- vidět jiné uživatele

---

# 1. Definice entity

Modul pracuje s entitou:

    subject (typ = osoba / osvc / zastupce / uživatel)

Rozsah polí je zúžený oproti modulu 010.

Využívané skupiny polí:

    identifikace: id, display_name
    osobní údaje: first_name, last_name, title_before
    kontakty: phone, email
    přihlášení: login, two_factor_method
    preference: (volitelně language)
    audit: created_at, updated_at

Nevyužívají se:

    role
    oprávnění
    firemní údaje (ic, dic…)
    adresa
    bankovní účty
    domácnost
    vztahy mezi subjekty

---

# 2. Role a oprávnění – kdo smí co

Přístup do modulu 020 má:

    každý subjekt, který je přihlášen

Logika:

    uživatel vidí výhradně sám sebe
    uživatel nesmí zobrazit jiný subjekt
    uživatel smí měnit pouze povolená pole
    administrátor 010 nemůže přes 020 upravovat jiné osoby

---

# 3. UI struktura modulu

Modul obsahuje **DetailView**, nikoli ListView.
Neexistuje seznam uživatelů.

Záložky:

    1. Profil
    2. Účet (přihlášení)
    3. Bezpečnost (2FA, reset hesla)
    4. Historie
    5. Systém (read-only)

Rozhraní odpovídá struktuře detailu v modulu 010, pouze je omezené.

---

## 3.1 Záložka PROFIL

Uživatel může upravit:

    first_name
    last_name
    title_before
    phone
    email

Email může být také login (dle nastavení systému).

Pole read-only:

    display_name
    id

---

## 3.2 Záložka ÚČET

Zobrazené informace:

    login
    email (pokud slouží jako login)
    stav účtu (aktivní)
    poslední přihlášení
    poslední změna hesla

Akce:

    změna emailu (pokud systém umožňuje)
    změna telefonního čísla

Uživatel NEMŮŽE:

    měnit role
    měnit oprávnění
    nastavovat systémové atributy

---

## 3.3 Záložka BEZPEČNOST

Obsahuje nastavení 2FA a nástroje správy bezpečnosti účtu.

Zobrazuje:

    two_factor_method (žádné / SMS / email / app)
    status ověření

Umožňuje:

    aktivovat 2FA
    deaktivovat 2FA
    změnit metodu 2FA
    resetovat heslo (přesměrování na bezpečnostní flow)

Upozornění:

    hesla se NEUKLÁDAJÍ v subject tabulce
    2FA je navázáno na autentizační systém (Supabase auth)

---

## 3.4 Záložka HISTORIE

Uživatel vidí:

    created_at
    updated_at
    souhrnné informace o úpravách svého profilu (pokud bude auditní log)

Uživatel nevidí:

    správce, který změnil jeho data
    interní systémová data

---

## 3.5 Záložka SYSTÉM

Zobrazuje pouze pro informaci:

    subject_id
    is_archived (read-only)
    technické údaje profilu

Uživatel zde nemá žádné akce.

---

# 4. Akce modulu

Modul umožňuje tyto akce:

## 4.1 Upravit profil
Bezpečně omezeno na:

    jméno
    příjmení
    telefon
    email
    titul před jménem

---

## 4.2 Nastavit nebo změnit 2FA

Uživatel smí:

    aktivovat / deaktivovat 2FA
    zvolit metodu
    nastavit si ověřovací zařízení

---

## 4.3 Reset hesla

Flow:

    uživatel požádá o reset
    systém odešle email nebo SMS podle nastavení 2FA
    reset probíhá v autentizačním modulu

---

## 4.4 Archivovat účet (SPECIFIKUM)

Archivace účtu se neprovádí v modulu 020.
Tuto akci smí provést pouze administrátor v modulu 010.

Uživatel však může vidět, že jeho účet je:

    aktivní / deaktivovaný

---

# 5. Rozdíly mezi modulem 010 a 020

Shrnutí:

    010 → admin, plná správa všech uživatelů
    020 → self-service, správa pouze vlastního účtu

Rozdíly v povolených polích:

    010: role, oprávnění, systém, archivace, reset hesla jiným osobám
    020: pouze vlastní profil, účet, bezpečnost

Rozdíly v přístupu:

    010: ListView + DetailView
    020: pouze DetailView (jediný subjekt = já)

---

# 6. Vazby na jiné moduly

Modul 020 používá:

    subject (centrální entita)
    autentizační systém (Supabase Auth)
    tabulky:
        subject_roles
        subject_permissions
        subject_additional_users (zobrazuje se pouze u nájemníka v modulu 050)

Nepoužívá:

    seznam uživatelů (ListView)
    řízení rolí
    správu účtů jiných osob

---

# 7. Shrnutí

Modul 020 slouží k jednoduché, bezpečné a samostatné správě vlastního uživatelského účtu.

Je to omezený pohled na subjekt, který dodržuje:

- jasná bezpečnostní pravidla
- oddělení od administrátorských funkcí
- shodu s modulem 010
- logiku z dokumentů v `01-core`

Dokument slouží jako závazný podklad pro UI, backend i autentizaci.
