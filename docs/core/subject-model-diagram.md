# aplikace-v6/docs/01-core/subject-model-diagram.md
# Subject – datový model (diagram)

## Účel dokumentu
Tento dokument znázorňuje datový model subjektu v jednoduché,
„nerozbitelné“ textové podobě – bez složitých ASCII rámečků.
Cílem je mít čitelný náhled na vztahy mezi tabulkami:

- subject
- subject_roles
- subject_permissions
- bank_accounts
- subject_additional_users
- subject_relationships
- napojení na jednotky, nemovitosti a smlouvy

Diagram je psaný tak, aby se nezlomil v žádném editoru.

---

## 1. Centrální pohled – subjekt uprostřed

Hlavní entita:

    subject

Na ni jsou napojené tyto tabulky:

    subject_roles
    subject_permissions
    bank_accounts
    subject_additional_users
    subject_relationships

Základní obrázek vztahů:

    subject
      ├─ subject_roles
      ├─ subject_permissions
      ├─ bank_accounts
      ├─ subject_additional_users
      └─ subject_relationships

---

## 2. Hlavní tabulka `subject` (připomenutí)

Každý řádek = jedna osoba nebo organizace (osoba, OSVČ, firma, spolek,
státní instituce, nájemník, pronajímatel, uživatel systému…).

Nejdůležitější skupiny polí:

    identifikace:    id, subject_type, display_name, is_archived
    osobní údaje:    first_name, last_name, title_before, birth_date
    firemní údaje:   company_name, ic, dic, ic_valid, dic_valid
    adresa:          street, city, zip, house_number, country,
                     ruian_address_id, ruian_validated, address_source
    kontakty:        phone, email
    login / 2FA:     login, two_factor_method
    audit:           created_at, created_by, updated_at, updated_by

Detailní seznam polí je v `subject-fields.md`.

---

## 3. Role subjektu (subject_roles)

Relace:

    subject 1 --- N subject_roles N --- 1 role_type (číselník v 900)

Význam:

- tabulka `role_type` v modulu 900 definuje dostupné role
  (admin, user, najemnik, pronajimatel, servis, finance…)
- tabulka `subject_roles` jen říká:
  
      „Subjekt X má roli Y“

Použití:

- filtrování v modulech (např. seznam nájemníků vs. seznam pronajímatelů)
- přístupová práva – kdo může do kterého modulu

---

## 4. Oprávnění subjektu (subject_permissions)

Relace:

    subject 1 --- N subject_permissions N --- 1 permission_type (číselník v 900)

Význam:

- `permission_type` říká, jaké akce existují (např. subject_edit, finance_view…)
- `subject_permissions` říká:
  
      „Subjekt X má oprávnění Z“

Použití:

- jemnější řízení přístupů než jen role
- RLS a logika „kdo může co“

---

## 5. Bankovní účty (bank_accounts)

Relace:

    subject 1 --- N bank_accounts

Význam:

- každý subjekt může mít žádný, jeden nebo více účtů
- jeden účet vždy patří právě jednomu subjektu

Zjednodušený náhled:

    subject
      └─ bank_accounts
           ├─ label
           ├─ bank_id (odkaz na číselník bank v 900)
           ├─ account_number
           ├─ currency
           ├─ iban
           └─ is_primary

Sekce „Účty“ v detailu subjektu zobrazuje právě tuto vazbu.

---

## 6. Další uživatelé domácnosti (subject_additional_users)

Relace:

    subject (nájemník) 1 --- N subject_additional_users

Význam:

- eviduje další osoby žijící s nájemníkem v jedné jednotce
- každá položka = 1 člověk (jméno, příjmení, datum narození, typ vztahu)

Zjednodušený náhled:

    subject (nájemník)
      └─ subject_additional_users
           ├─ first_name
           ├─ last_name
           ├─ birth_date
           └─ relation_type (dítě, partner, spolubydlící…)

Použití:

- modul 050 – přehled domácnosti nájemníka
- výpočet počtu osob v bytě, statistik, služeb atd.

---

## 7. Vztahy mezi subjekty (subject_relationships)

Relace:

    subject 1 --- N subject_relationships N --- 1 subject (jiný)

Je to obecná tabulka „vztahů“ mezi subjekty.
Každý řádek říká např.:

    „Subjekt A je zástupcem subjektu B“
    „Subjekt C je kontaktní osobou subjektu D“

Stylizovaný náhled:

    subject
      └─ subject_relationships
           ├─ subject_id
           ├─ related_subject_id
           └─ relationship_type (zástupce, odpovědná_osoba, kontaktní_osoba…)

---

## 8. Napojení na další doménové moduly

### 8.1 Subjekt ↔ Jednotka (nájemní vztah)

Nájemníci jednotek jsou evidováni přes vazební tabulku
(název může být např. `unit_tenants`):

    subject (nájemník) 1 --- N unit_tenants N --- 1 unit

Význam:

- jeden nájemník může mít v čase více jednotek
- jedna jednotka může mít více nájemníků (spolunájemníci)

---

### 8.2 Subjekt ↔ Jednotka (vlastník)

Vlastnictví jednotek může být evidováno např. tabulkou `unit_owners`:

    subject (vlastník) 1 --- N unit_owners N --- 1 unit

---

### 8.3 Subjekt ↔ Nemovitost

Podobně pro celé objekty (nemovitosti) lze mít tabulku `property_owners`:

    subject (vlastník) 1 --- N property_owners N --- 1 property

---

### 8.4 Subjekt ↔ Smlouvy

Každá smlouva může odkazovat na jednoho nebo více subjektů:

    subject 1 --- N contract_parties N --- 1 contract

Například:

- nájemní smlouva → nájemník + pronajímatel
- servisní smlouva → dodavatel + objednatel

---

## 9. Modulový pohled

Různé moduly používají tentýž model subjektu, pouze ho
zobrazují jiným způsobem:

- **010 – Správa uživatelů**  
  pracuje se subjekty, které mají roli „user“ a často oprávnění
  pro vstup do systému

- **020 – Můj účet**  
  zobrazuje a umožňuje upravit pouze subjekt přihlášeného uživatele

- **050 – Nájemník**  
  využívá zejména `subject_additional_users` a vazby na jednotky

- **110 – Správa subjektů**  
  administrátorský pohled na všechny subjekty a jejich vazby

---

## 10. Shrnutí

- `subject` je centrální entita pro osoby i firmy.
- Role a oprávnění jsou odděleny do N:N tabulek.
- Účty, další uživatelé domácnosti a vztahy mezi subjekty jsou
  samostatné tabulky napojené 1:N nebo N:N.
- Doménové moduly (nájemník, nemovitost, smlouvy…) používají
  tento model jako základ a přidávají vlastní vazby.
