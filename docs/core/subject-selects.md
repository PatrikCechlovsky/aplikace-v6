# Subject – seznam všech selectů / enumů

Tento dokument obsahuje kompletní přehled všech selectových polí, která se používají v subjektu.  
U každého je uvedeno:

- **Zdroj hodnot**:  
  - 🔒 `fixed` = pevné enumy v aplikaci  
  - 💼 `generic_type` = konfigurovatelné uživateli v modulu 900
- **Použití**: ve kterých polích / modulech se hodnota používá.

---

## 1. Typ subjektu  
**Kód:** `subject_type`  
**Zdroj:** 💼 `generic_type:subject_type`

### Popis  
Definuje hlavní kategorii subjektu v systému.

### Typické hodnoty  
- osoba  
- osvc  
- firma  
- spolek  
- statni  
- zastupce  
- nájemník (vzniká přiřazením role, není základním typem)

Použití: `subject.subject_type`, filtrace v modulech (010, 030, 050, 110).

---

## 2. Role subjektu  
**Kód:** `role`  
**Zdroj:** 💼 `generic_type:subject_role`

### Popis  
Určuje funkci subjektu v systému (např. nájemník, pronajímatel, servis…).

### Typické hodnoty  
- pronajimatel  
- najemnik  
- udrzba  
- user  
- financni kontrola  
- spravce objektu  
(rozšiřitelné uživatelem)

Použití: přiřazení funkcí subjektu a oprávnění.

---

## 3. Typ oprávnění (permission type)  
**Kód:** `permissions`  
**Zdroj:** 💼 `generic_type:permission_type`

### Popis  
Oprávnění pro práci v modulu nebo nad konkrétní entitou.

### Příklady  
- read  
- write  
- delete  
- approve  
- finance_view  
- finance_edit  

Použití: detail uživatele, role-based access.

---

## 4. Typ dokladu totožnosti  
**Kód:** `id_doc_type`  
**Zdroj:** 🔒 `fixed:id_doc_type`

### Důvod, proč fixed  
Hodnoty jsou stabilní a odpovídají české legislativě → není vhodné, aby uživatel měnil.

### Hodnoty  
- OP (občanský průkaz)  
- PAS (pas)  
- ŘP (řidičský průkaz)

Použití: pouze u osob.

---

## 5. Stát (Country)  
**Kód:** `country`  
**Zdroj:** 💼 `generic_type:country`

### Poznámka  
Může být rozsáhlý seznam, uživatel může doplnit další země.  
Pro české subjekty bude výchozí `CZ`.

---

## 6. Zdroj adresy (address_source)  
**Kód:** `address_source`  
**Zdroj:** 🔒 `fixed:address_source`

### Důvod, proč fixed  
Je to technický údaj – nemá smysl, aby jej uživatel upravoval.

### Hodnoty  
- manual  
- ruian  
- ares  
- google  

Použití: u každé adresy vidíme, odkud se pole vyplnilo.

---

## 7. Měna účtu  
**Kód:** `currency`  
**Zdroj:** 🔒 `fixed:currency` (možno později udělat konfigurovatelné)

### Hodnoty (minimální sada)  
- CZK  
- EUR  
- USD  

Použití: bankovní účty subjektu.

---

## 8. Banka (výběr bank v ČR)  
**Kód:** `bank_id`  
**Zdroj:** 💼 `generic_type:bank_list` (modul 900)

### Popis  
Číselník bank působících v ČR (dle registru ČNB).

**Zdroj dat:** ČNB CSV – https://www.cnb.cz/cs/platebni-styk/.galleries/ucty_kody_bank/download/kody_bank_CR.csv  
**Platnost seznamu:** 2026-02-01

### Hodnoty  
Každý záznam obsahuje:  
`bank_code`, `bank_name`, `swift`, `country`

Použití: bankovní účty subjektu.

---

## 9. Typ 2FA (dvoufaktorové ověření)  
**Kód:** `two_factor_method`  
**Zdroj:** 🔒 `fixed:two_factor_method`

### Hodnoty  
- none  
- sms  
- email  
- authenticator_app  

Důvod: technické nastavení, nepatří mezi uživatelské číselníky.

---

## 10. Stav / Archivace  
**Kód:** `is_archived` (boolean)  
→ nejedná se o select, ale je to stavové pole, uvádíme zde jen pro přehled.

---

## 11. Jazyk (pokud později přidáme)  
**Kód:** `language`  
**Zdroj:** 🔒 fixed nebo 💼 generic_type (dle volby)

Možné hodnoty: `cs`, `en`, `de`, …

---

# Přehled: Co je FIXED a co je GENERIC TYPE

### 🔒 **FIXED (pevné enumy v aplikaci)**
Toto se **nemá měnit** a nebude v modulu 900:

- `id_doc_type`  
- `address_source`  
- `currency` (zatím)  
- `two_factor_method`

### 💼 **GENERIC TYPE (konfigurovatelné v 900)**

- `subject_type`
- `subject_role`
- `permission_type`
- `country`
- `bank_list`

---

# Doporučení: Které selecty se mají řídit uživatelem

### Nechat uživatele konfigurovat:
- typ subjektu  
- role  
- oprávnění  
- země  
- seznam bank  

### Nechat pevně (fixed):
- typy dokladů  
- zdroje adres  
- typy 2FA  
- měny (alespoň v první verzi)

---

# Shrnutí

Tento dokument definuje **centrální katalog všech selectů**, které používá entita `subject`.  
Díky rozdělení na:

- **fixed enumy**  
- **generic types (modul 900)**  

bude UI i databáze konzistentní napříč všemi moduly (010, 020, 030, 050, 110).

