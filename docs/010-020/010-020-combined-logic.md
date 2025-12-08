# aplikace-v6/docs/010-020/010-020-combined-logic.md
# Moduly 010 a 020 – společná logika

## Účel dokumentu
Tento dokument sjednocuje logiku modulů:

- 010 – Správa uživatelů (admin pohled)
- 020 – Můj účet (self-service pohled)

Cílem je:

- jasně definovat, co mají moduly společného
- vysvětlit, v čem se liší
- popsat sdílenou práci s entitou `subject`
- nastavit jednotná pravidla bezpečnosti a oprávnění
- zjednodušit implementaci UI a backendu

Dokument navazuje na:

- docs/01-core/subject-fields.md  
- docs/01-core/subject-selects.md  
- docs/01-core/subject-permissions.md  
- docs/01-core/subject-model.md  
- docs/010-users/010-users-spec.md  
- docs/020-my-account/020-my-account-spec.md  

---

## 1. Společný základ – entita SUBJECT

Oba moduly používají stejnou entitu:

    subject

Uživatel systému = subjekt, který:

- má typ `osoba` / `osvc` / `zastupce` (dle definice)
- má přiřazenou roli `user` v `subject_roles`
- je propojen s účtem v autentizačním systému (např. Supabase Auth)

Moduly 010 a 020 se tedy neliší datovým modelem, ale:

- rozsahem zobrazených polí
- tím, kdo vidí jaký subjekt
- tím, kdo smí co upravovat

---

## 2. Společně používaná pole

Oba moduly pracují s těmito poli entity `subject`:

    identifikace:
        id
        display_name
        subject_type (pouze pro orientaci admina v 010)

    osobní údaje:
        first_name
        last_name
        title_before

    kontakty:
        phone
        email

    přihlášení:
        login
        two_factor_method

    audit:
        created_at
        updated_at
        is_archived (status účtu)

Rozdíl je v tom, kdo pole vidí a kdo je smí měnit.

---

## 3. Rozdíl v přístupu – kdo co vidí

### Modul 010 – Správa uživatelů (admin pohled)

- přístup má: admin, spravce (případně role definované v modulu 900)
- vidí všechny subjekty, které splňují podmínky pro „uživatele systému“
- může uživatele vytvářet, upravovat, archivovat, přiřazovat role a oprávnění

Z pohledu seznamu:

    010 = globální ListView všech uživatelů

### Modul 020 – Můj účet (self-service pohled)

- přístup má: každý přihlášený subjekt
- vidí výhradně „sám sebe“
- nesmí vidět jiné subjekty ani jejich přihlašovací údaje

Z pohledu detailu:

    020 = DetailView pouze pro aktuálně přihlášený subjekt

---

## 4. Rozdíl v možnostech úprav

### 4.1 Co může dělat admin v modulu 010

Admin smí:

- vytvářet nové uživatele (pozvánka)
- měnit jejich profilová data
- měnit jejich role (`subject_roles`)
- měnit jejich oprávnění (`subject_permissions`)
- nastavovat a měnit 2FA (podle bezpečnostní politiky)
- archivovat nebo obnovovat uživatele
- vidět auditní informace o tom, kdo co změnil

Admin nesmí:

- vidět heslo (to nikdy není v subject tabulce)

### 4.2 Co může dělat uživatel v modulu 020

Uživatel smí:

- měnit svůj profil (jméno, příjmení, titul, telefon, email)
- měnit nastavení 2FA (aktivovat / deaktivovat / změnit typ)
- změnit heslo (přes bezpečnostní flow)
- prohlížet historii svých změn

Uživatel nesmí:

- vidět ani měnit své role
- vidět ani měnit svá oprávnění
- měnit systémový stav účtu (archivovat se)
- vidět ostatní uživatele

---

## 5. Sdílená UI struktura (Detail)

Oba moduly využívají podobný základní layout detailu:

    1. Profil
    2. Účet
    3. Bezpečnost (2FA / heslo)
    4. Historie
    5. Systém

Rozdíl je v tom, které části jsou dostupné a editovatelné.

### Modul 010 (admin)

- PROFIL: čtení a editace pro jakýkoliv subjekt
- ÚČET: čtení stavu + akce typu „reset hesla“
- BEZPEČNOST: přehled 2FA, případně zásah admina (podle pravidel)
- HISTORIE: detailní audit (kdo a kdy změnil)
- SYSTÉM: interní ID, role, oprávnění, archivace

### Modul 020 (uživatel)

- PROFIL: čtení a editace vlastních údajů
- ÚČET: čtení login/email, stav účtu
- BEZPEČNOST: akce uživatele (změna 2FA, změna hesla)
- HISTORIE: přehled změn vlastního účtu (bez detailů o ostatních)
- SYSTÉM: pouze informativní zobrazení (id, stav), bez akcí

---

## 6. Bezpečnostní pravidla (společné)

Společné zásady:

1. Hesla se nikdy neukládají v tabulce `subject`  
2. 2FA se řídí autentizačním systémem  
3. Přístup do 010 je pouze pro role s oprávněním spravovat uživatele  
4. Přístup do 020 má jen přihlášený subjekt s vlastním účtem  
5. Uživatel v 020 nikdy neuvidí jiný subjekt než sebe  
6. Uživatel v 020 nemůže manipulovat se svými rolemi a oprávněními  

Rozdělení odpovědností:

    Modul 010:
        správa uživatelů = provozní nástroj pro administrátory

    Modul 020:
        správa vlastního účtu = komfortní self-service pro uživatele

---

## 7. Toky (flows) – jak to spolu funguje

### 7.1 Vytvoření (pozvání) nového uživatele

1. Admin otevře modul 010.
2. Zvolí akci „Pozvat uživatele“.
3. Vyplní minimálně:
       email
       volitelně jméno, příjmení, roli
4. Systém:
       vytvoří záznam v `subject`
       přiřadí roli `user` v `subject_roles`
       založí účet v autentizačním systému
       odešle pozvánku emailem
5. Uživatel klikne na odkaz v pozvánce:
       nastaví heslo
       případně aktivuje 2FA
       je přihlášen → může vstoupit do modulu 020

Od té chvíle:

    modul 010 = admin uživatele vidí a spravuje
    modul 020 = uživatel spravuje svůj účet sám

---

### 7.2 Admin mění údaje uživatele

Scénář:

1. Admin v modulu 010 otevře detail uživatele.
2. Na záložce PROFIL upraví např. jméno, email, telefon.
3. Změny se uloží do `subject`.

Výsledek:

- uživatel uvidí upravené údaje ve svém modulu 020
- audit si pamatuje, že změnu provedl admin

---

### 7.3 Uživatel mění svůj profil

Scénář:

1. Uživatel otevře modul 020.
2. Na záložce PROFIL upraví své údaje (jméno, email, telefon…).
3. Změny se uloží do `subject`.

Výsledek:

- admin v modulu 010 vidí aktualizované údaje
- audit eviduje, že změnu provedl daný uživatel

---

### 7.4 Změna hesla

Scénář z modulu 020:

1. Uživatel zvolí „Změnit heslo“.
2. Systém přesměruje do bezpečnostního flow autentizačního systému.
3. Po úspěšné změně hesla se aktualizuje stav auth, ne tabulka `subject`.

Scénář z modulu 010 (admin):

- admin NEMÁ možnost „vidět“ heslo
- může pouze spustit akci „vynutit reset hesla“
- uživatel následně obdrží email/SMS s pokyny

---

### 7.5 Archivace účtu

- provádí se pouze v modulu 010
- admin nastaví `is_archived = true`
- autentizační systém / login logika musí respektovat, že:
      archivovaný účet se nesmí přihlásit
- v modulu 020:
      archivovaný uživatel by se ideálně neměl dostat do aplikace
      (pokud je přístup umožněn kvůli specifickému flow, modul 020
       pouze informuje, že účet je neaktivní)

---

## 8. Sdílené komponenty UI

Aby 010 a 020 byly konzistentní, je vhodné mít společné komponenty:

    UserProfileForm
        používá se v 010 i 020
        liší se pouze:
            kdo smí co editovat
            které validace platí pro admina vs uživatele

    UserAccountPanel
        pro login, email, stav účtu

    UserSecurityPanel
        pro 2FA a reset hesla

    AuditInfo
        jednotná komponenta zobrazení auditních údajů

Tím se zajistí:

- jednotný vzhled
- méně chyb
- jednodušší údržba

---

## 9. Shrnutí rozdílů a shod

Společné:

- entita `subject`
- základní pole (profil, kontakty, přihlášení, audit)
- logika bezpečnosti (hesla mimo subject, 2FA v auth systému)
- použití číselníků z modulu 900 (role, oprávnění)

Liší se:

- rozsah viděných subjektů:
      010 = všichni uživatelé
      020 = jen „já“
- rozsah editace:
      010 = admin spravuje ostatní
      020 = uživatel spravuje sám sebe
- viditelnost rolí a oprávnění:
      010 = ano
      020 = ne

---

## 10. Doporučení pro implementaci

1. Používat jeden datový model pro uživatele (subject + role + permissions).
2. Maximálně sdílet komponenty mezi 010 a 020.
3. Veškerou bezpečnost hesel a 2FA svěřit autentizační vrstvě.
4. Vždy vycházet z tohoto dokumentu a z dokumentů v `01-core`,
   aby byl systém konzistentní a předvídatelný.

