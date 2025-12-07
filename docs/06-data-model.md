# /docs/06-data-model.md
## Popis: Tento dokument popisuje datový model aplikace Pronajímatel v6, strukturu tabulek, vazby mezi entitami a plánované rozšíření.
---

# 06 – Datový model

## 1. Úvod

Datový model aplikace Pronajímatel v6 je navržen tak, aby:
- podporoval více pronajímatelů (multi-tenant architektura),
- řešil kompletní životní cyklus nájemního vztahu,
- byl bezpečný díky RLS (Row Level Security),
- byl rozšiřitelný o nové moduly (např. služby, měřidla, dokumenty, komunikace).

Klíčové entity systému:
- **Subjekty (fyzické/právnické osoby)**
- **Nemovitosti**
- **Jednotky**
- **Nájemníci**
- **Smlouvy**
- **Platby**
- **Služby a měřidla**
- **Dokumenty**
- **Komunikace**
- **Typy a číselníky (modul 900)**

---

# 2. Jádro systému (core entity)

Toto jsou základní tabulky, které se týkají celé aplikace.

---

## 2.1 subjects (subjekty)

Reprezentují:
- pronajímatele
- nájemníky
- firmy
- kontaktní osoby

Základní sloupce:

| Sloupec | Popis |
|---------|-------|
| id | UUID primární klíč |
| type | typ subjektu (osoba, firma, pronajímatel, nájemník…) |
| name | název subjektu (firma) |
| first_name | jméno |
| last_name | příjmení |
| email | kontaktní e-mail |
| phone | telefon |
| address_id | vazba na adresu (do budoucna) |
| created_by | uživatel, který subjekt založil |

RLS pravidlo:
- Uživatel vidí pouze subjekty, které vlastní / vytvořil.

---

## 2.2 subject_roles

Tabulka propojuje uživatele se subjekty a definuje role:

| Sloupec | Popis |
|---------|--------|
| id | UUID |
| subject_id | odkaz na subjekt |
| user_id | odkaz na uživatele |
| role | role (admin, owner, manager, accountant…) |

Role určují, co bude UI a backend povolovat.

---

## 2.3 subject_permissions

Podrobnější granularita:

| Sloupec | Popis |
|---------|--------|
| id | UUID |
| subject_id | ke kterému subjektu se vztahuje |
| permission | název oprávnění (view, edit, delete, approve…) |

Tyto permissions propojí:
- **moduly**
- **commonActions**
- **RLS**

---

# 3. Nemovitosti a jednotky

Klíčové tabulky, na které navazuje většina ostatních modulů.

---

## 3.1 properties (nemovitosti)

| Sloupec | Popis |
|---------|--------|
| id | UUID |
| owner_subject_id | vlastník (napojen na subjects) |
| name | název budovy |
| address | adresa |
| description | poznámka |
| created_by | ID uživatele |

Každá nemovitost patří jednomu subjektu.

---

## 3.2 units (jednotky)

| Sloupec | Popis |
|---------|--------|
| id | UUID |
| property_id | vazba na nemovitost |
| unit_type | byt, kancelář, sklad… |
| label | číslo bytu / jednotky |
| floor | podlaží |
| area | plocha |
| created_by | zakládající uživatel |

Vazba:  
**1 nemovitost → N jednotek**

---

# 4. Nájemní vztahy

---

## 4.1 tenants (nájemníci)

Jde jen o propojení subjektu s jednotkou:

| Sloupec | Popis |
|---------|--------|
| id | UUID |
| unit_id | jednotka |
| subject_id | nájemník (odkaz na subjects) |
| active | je nyní aktivní nájemce? |

---

## 4.2 contracts (smlouvy)

| Sloupec | Popis |
|---------|--------|
| id | UUID |
| tenant_id | vazba na nájemníka |
| unit_id | jednotka |
| start_date | začátek nájmu |
| end_date | konec nájmu (nullable) |
| price_rent | nájemné |
| price_services | zálohy na služby |
| deposit | kauce |
| created_by | založil uživatel |

Každá smlouva je navázaná:
- na jednotku,
- na nájemníka,
- na subjekt pronajímatele (přes vlastnictví jednotky).

---

# 5. Platby a finance

---

## 5.1 payments (platby)

| Sloupec | Popis |
|---------|--------|
| id | UUID |
| contract_id | nájemní smlouva |
| amount | částka |
| due_date | datum splatnosti |
| paid_date | datum úhrady |
| variable_symbol | variabilní symbol |
| note | poznámka |

Do budoucna:
- automatické generování QR kódů,
- párování podle VS.

---

## 5.2 finance_predictions (předpisy plateb)

Umožní generovat:
- předpis nájemného,
- předpis záloh.

---

## 5.3 settlements (vyúčtování)

Obsahuje:
- roční vyúčtování služeb,
- přehled spotřeb,
- přeplatky / nedoplatky.

---

# 6. Služby a měřidla

---

## 6.1 service_types (typy služeb)

Slouží jako číselník:
- voda,
- elektřina,
- plyn,
- internet…

Definováno v modulu **900 – Nastavení**.

---

## 6.2 meters (měřidla)

| Sloupec | Popis |
|---------|--------|
| id | UUID |
| unit_id | jednotka |
| service_type | typ služby |
| serial_number | výrobní číslo |

---

## 6.3 meter_readings (odečty)

| Sloupec | Popis |
|---------|--------|
| id | UUID |
| meter_id | měřidlo |
| date | datum odečtu |
| value | stav |

---

# 7. Dokumenty a komunikace

---

## 7.1 documents

Obsah:

| Sloupec | Popis |
|---------|--------|
| id | UUID |
| subject_id | komu dokument patří |
| type | např. smlouva, příloha, vyúčtování |
| file_url | cesta v Supabase storage |
| created_by | kdo dokument nahrál |

---

## 7.2 email_templates

- šablony e-mailů
- editor šablon bude v modulu Dokumenty
- automatické vyplňování hodnot

---

## 7.3 email_sent

- záznamy o odeslaných zprávách
- ukládá se obsah, příjemce, datum

---

# 8. Číselníky a typy (modul 900)

Modul nastavení obsahuje tabulky jako:

- subject_types  
- property_types  
- unit_types  
- service_types  
- payment_types  
- document_types  

Vše sjednocujeme přes komponentu **GenericTypeTile**.

---

# 9. Vazby mezi entitami (verbální ER diagram)

```
SUBJECT (Pronajímatel)
   │ 1:N
   └── PROPERTIES (Nemovitosti)
          │ 1:N
          └── UNITS (Jednotky)
                 │ 1:N
                 └── TENANTS (Nájemníci)
                        │ 1:N
                        └── CONTRACTS (Smlouvy)
                               │ 1:N
                               └── PAYMENTS (Platby)

UNITS 1:N METERS 1:N METER_READINGS

SUBJECTS 1:N DOCUMENTS
SUBJECTS 1:N SUBJECT_ROLES
SUBJECTS 1:N SUBJECT_PERMISSIONS
```

---

# 10. Plánované rozšíření datového modelu

- workflow tabulky (události, automatické akce)
- audit log
- bankovní výpisy
- helpdesk / úkoly
- integrace plateb (GoPay / Stripe)
- automatická archivace dokumentů

---

# 11. Poznámky a nezatříděné informace (zachováno)

- možné více typů nájemních vztahů (podnájem, pronájem části jednotky),
- budoucí definice ceníků služeb,
- koncept agregovaných čerpání služeb podle období,
- přidání podpory více pronajímatelů na jednu nemovitost.

---

# 12. Závěr

Tento dokument poskytuje sjednocený a rozšiřitelný datový model pro aplikaci Pronajímatel v6.  
Všechny budoucí moduly a funkce budou na tento model navazovat.

