# Doporučení: Pole pro modul 020 – Můj účet

**Datum:** 2025-01-XX  
**Status:** Doporučení  
**Účel:** Definovat minimální a doporučenou sadu polí pro modul "Můj účet"

---

## Shrnutí

Pro modul "Můj účet" (020) doporučujeme **minimální základní sadu**, kterou je možné později rozšířit. Data budou použita i v jiných modulech (nájemníci, pronajímatelé), takže je důležité mít správnou datovou strukturu v `subject` tabulce.

---

## 1. ✅ ZÁKLADNÍ SADA (MÍT TEĎ)

Tato pole jsou **nezbytná** a měla by být implementována hned:

### Osobní údaje
- ✅ `title_before` – Titul před jménem (volitelné)
- ✅ `first_name` – Jméno (povinné)
- ✅ `last_name` – Příjmení (povinné)
- ✅ `display_name` – Zobrazované jméno / přezdívka (vypočítané, read-only)

### Adresa (důležité pro pozdější použití)
- ✅ `country` – Stát (povinné, default: CZ)
- ✅ `city` – Město (povinné)
- ✅ `zip` – PSČ (povinné)
- ✅ `street` – Ulice (volitelné)
- ✅ `house_number` – Číslo popisné (volitelné)

**Poznámka:** Adresa je už implementovaná, což je správně. I když původní specifikace ji nezahrnovala, bude potřeba v jiných modulech (nájemníci, pronajímatelé).

### Kontaktní údaje
- ✅ `email` – E-mail (povinné)
- ✅ `phone` – Telefon (volitelné)

### Přihlašovací údaje
- ✅ `login` – Přihlašovací jméno nebo email (povinné)
- ✅ `two_factor_method` – Typ dvoufaktorového ověření (volitelné)

---

## 2. ⏳ DOPLNĚNÍ POZDĚJI (NENÍ NUTNÉ TEĎ)

Tato pole mohou být přidána později podle potřeby:

### Osobní údaje (rozšíření)
- ⏳ `birth_date` – Datum narození (volitelné, užitečné pro identifikaci)
- ⏳ `id_doc_type` – Typ dokladu totožnosti (OP, PAS, ŘP) – volitelné
- ⏳ `id_doc_number` – Číslo dokladu totožnosti – volitelné

**Kdy přidat:**
- Pokud bude potřeba identifikace nájemníků
- Pokud bude potřeba ověření totožnosti pro smlouvy
- Pokud bude potřeba pro daňové účely (např. OSVČ)

### Adresa (rozšíření)
- ⏳ `ruian_address_id` – ID adresy z RÚIAN (pro ověření adresy)
- ⏳ `ruian_validated` – Boolean, zda je adresa ověřena
- ⏳ `address_source` – Zdroj adresy (manual, ruian, ares, google)

**Kdy přidat:**
- Pokud bude potřeba validace adres přes RÚIAN
- Pokud bude potřeba automatické doplnění adres

---

## 3. ❌ NEPOUŽÍVAT V MODULU 020

Tato pole **nejsou** součástí modulu "Můj účet" a mají být zobrazována/upravována jinde:

### Administrativní pole (modul 010, 110)
- ❌ `role` – Role subjektu (spravuje admin v modulu 010)
- ❌ `permissions` – Oprávnění (spravuje admin v modulu 010)
- ❌ `is_archived` – Archivní stav (spravuje admin)
- ❌ `subject_type` – Typ subjektu (systémové, read-only)

### Firemní údaje (modul 110)
- ❌ `company_name` – Název společnosti (pro firmy, ne pro osoby)
- ❌ `ic` – IČ (pro firmy)
- ❌ `dic` – DIČ (pro firmy)
- ❌ `ic_valid`, `dic_valid` – Validace IČ/DIČ

### Samostatné entity (jiné moduly)
- ❌ Bankovní účty – jsou v samostatné tabulce `bank_accounts` (modul 080)
- ❌ Vazby na jednotky – řeší modul 050 (nájemníci)
- ❌ Dokumenty – řeší modul 120

---

## 4. 📋 DOPORUČENÁ STRUKTURA FORMULÁŘE

### Sekce 1: Osobní údaje
```
Titul | Jméno *
Příjmení *
[Adresa - autocomplete]
Ulice | Číslo popisné
Město * | PSČ *
Stát *
```

### Sekce 2: Přihlašovací údaje
```
Zobrazované jméno / přezdívka
Přihlašovací jméno nebo email *
E-mail * | Telefon
Ověření (2FA)
```

---

## 5. 💾 DATABÁZOVÁ STRUKTURA

Všechna pole jsou součástí tabulky `subject` (ne vytváříme novou tabulku).

Mělo by být v migraci:
- ✅ Všechna základní pole (viz sekce 1) už by měla být v `subject` tabulce
- ⏳ Doplňková pole (sekce 2) lze přidat později přes migraci

---

## 6. ✅ DOPORUČENÍ

### Pro začátek (doporučeno):
1. **Zachovat současnou strukturu** – máte správně základní pole
2. **Nechat formulář jednoduchý** – nepřidávat zatím datum narození, doklady
3. **Připravit datový model** – zajistit, že všechna pole jsou v `subject` tabulce

### Kdy rozšířit:
- **Datum narození** – když bude potřeba identifikace nájemníků nebo věkové kontroly
- **Doklady totožnosti** – když bude potřeba ověření totožnosti pro smlouvy
- **RÚIAN validace** – když bude potřeba ověřování adres

### Co už máte správně:
- ✅ Základní osobní údaje (titul, jméno, příjmení)
- ✅ Adresa (i když nebyla v původní specifikaci, bude potřeba jinde)
- ✅ Kontaktní údaje (email, telefon)
- ✅ Přihlašovací údaje (login, 2FA)
- ✅ Použití `InputWithHistory` pro historii hodnot
- ✅ Použití `AddressAutocomplete` pro adresy

---

## 7. 🔄 MIGRAČNÍ STRATEGIE

### Současný stav:
- Formulář má všechna základní pole
- Adresa je implementovaná (i když nebyla v původní specifikaci)

### Později přidat (migrace):
```sql
-- Datum narození
ALTER TABLE subject ADD COLUMN birth_date DATE;

-- Doklady totožnosti
ALTER TABLE subject ADD COLUMN id_doc_type TEXT;
ALTER TABLE subject ADD COLUMN id_doc_number TEXT;

-- RÚIAN validace (pro adresy)
ALTER TABLE subject ADD COLUMN ruian_address_id TEXT;
ALTER TABLE subject ADD COLUMN ruian_validated BOOLEAN DEFAULT FALSE;
ALTER TABLE subject ADD COLUMN address_source TEXT;
```

---

## 8. 📝 POZNÁMKY

### Proč adresa v modulu 020?
- I když původní specifikace adresu nezahrnovala, **bude potřeba jinde** v aplikaci
- Adresa je součástí `subject` modelu (viz `subject-fields.md`)
- Lepší mít ji teď, než ji přidávat později s migrací dat

### Proč ne datum narození teď?
- Není kritické pro základní funkci "Můj účet"
- Lze přidat později, když bude potřeba (např. pro nájemníky, věkové kontroly)
- Netlačí na čas, lze to řešit iterativně

### Proč ne doklady totožnosti teď?
- Citlivá data (GDPR)
- Nejsou nutná pro základní funkci
- Přidají se, až když bude potřeba (např. pro smlouvy, ověření)

---

## 9. ✅ ZÁVĚR

**Doporučení: Nechat současnou strukturu, nepřidávat zatím nic dalšího.**

Máte:
- ✅ Všechna základní pole
- ✅ Adresu (důležitá pro pozdější použití)
- ✅ Správnou datovou strukturu

Nepřidávat teď:
- ⏳ Datum narození (až bude potřeba)
- ⏳ Doklady totožnosti (až bude potřeba)
- ⏳ RÚIAN validace (až bude potřeba)

**Toto je správný přístup – mít základní, funkční verzi a rozšiřovat podle potřeby.**


