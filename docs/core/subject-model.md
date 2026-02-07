# aplikace-v6/docs/01-core/subject-model.md
# Subject – datový model (entita + související tabulky)

## Účel dokumentu
Tento dokument definuje **datový model subjektu**, tedy všechny tabulky, vazby a logiku, kterou systém používá k ukládání informací o osobách, firmách, nájemnících, pronajímatelích a dalších entitách.

Model je centrálním prvkem celé aplikace a používají ho moduly:

- 010 – Správa uživatelů  
- 020 – Můj účet  
- 030 – Správa kontaktů / firem  
- 050 – Nájemník a jeho domácnost  
- 110 – Správa subjektů (administrace)  

Tento dokument neurčuje UI ani SQL – pouze koncept a strukturu dat.

---

# 1. Hlavní entita: `subject`

Tabulka **subject** představuje jakoukoliv osobu nebo organizaci.

### 1.1 Definice subjektu
Subjekt může být:

- osoba
- OSVČ
- firma
- spolek
- státní organizace
- zástupce (osoba jednající za firmu)
- nájemník (vzniká kombinací role + typu subjektu)
- pronajímatel
- uživatel systému

### 1.2 Popis tabulky
Tabulka obsahuje:

- osobní údaje  
- firemní údaje  
- adresu  
- kontaktní informace  
- role a oprávnění  
- metadata a audit  
- návaznost na bankovní účty  
- vztahy na další entity (jednotky, spolubydlící, zástupce, dokumenty…)

Detailní seznam polí je uveden v dokumentu:
subject-fields.md

---

# 2. Vazby a podřízené tabulky

Subjekt není izolovaná entita.  
Má různé **n-vazby** na další tabulky.  
Níže jsou definovány všechny, které jsou součástí základního modelu.

---

## 2.1 Tabulka `subject_roles` (N:N vztah)

Subjekt může mít **více rolí**, například:

- nájemník  
- pronajímatel  
- údržba  
- uživatel systému  

Role jsou definovány v číselníku (modul 900).

### Účel tabulky:
- umožňuje přiřadit 0–N rolí každému subjektu
- umožňuje více typů filtrování a přístupových práv

---

## 2.2 Tabulka `subject_permissions` (N:N vztah)

Každý subjekt může mít vlastní sadu oprávnění.

Příklady oprávnění:

- finance_view  
- finance_edit  
- subject_edit  
- subject_delete  
- property_manage  

Oprávnění jsou definována v modulu 900.

### Účel tabulky:
- jemné řízení přístupů
- oddělení rolí (funkce) od oprávnění (co smí)

---

## 2.3 Tabulka `bank_accounts` (1:N vztah)

Každý subjekt může mít **0 až N bankovních účtů**.

Struktura účtu je popsána v dokumentu:
subject-fields.md (sekce 6)

### Účel tabulky:
- evidovat více účtů pod jedním subjektem
- možnost označit hlavní účet (is_primary)
- napojení na číselník bank

---

## 2.4 Tabulka `subject_additional_users` (1:N vztah)

Slouží k evidenci **dalších osob žijících s nájemníkem** (domácnost).

Každá položka má vlastní:

- jméno  
- příjmení  
- datum narození  
- typ vztahu (dítě / partner / spolubydlící)

Tento seznam se zobrazuje:

- na detailu subjektu typu „nájemník“  
- v modulu nájemníka (050) na záložce „Uživatelé domácnosti“

### Účel tabulky:
- umožnit více osob u jednoho nájemníka  
- jasná strukturace (ne textové pole)  
- použití v budoucnu: počet obyvatel jednotky, výpočty služeb…

---

## 2.5 Tabulka `subject_relationships` (volitelné rozšíření)

Používá se pro:

- zástupce firmy  
- právní zastoupení  
- rodinné vztahy  
- odpovědné osoby

Každý záznam obsahuje:

- subject_id  
- related_subject_id  
- relationship_type (např. „zástupce“, „odpovědná osoba“, „manžel/ka“)  

### Účel tabulky:
- poskytuje flexibilní vazby mezi subjekty  
- může být rozšířeno bez změny modelu

---

## 2.6 Tabulka `subject_documents` (1:N vztah na dokumenty)

Slouží k ukládání dokumentů:

- smlouvy  
- plné moci  
- doklady totožnosti (s omezenou viditelností)  
- fotodokumentace  

Používá interní dokumentový modul (název se může lišit podle projektu).

---

# 3. Vazby na další části systému

Subjekty interagují s dalšími moduly aplikace:

---

## 3.1 Subjekt → Jednotka (N:N)

Subjekt může být:

- nájemník více jednotek  
- spolunájemník  
- vlastník  
- zástupce vlastníka  

Vztah typicky ukládá tabulka:

- `unit_tenants` (nájemník jednotky)
- `unit_owners` (vlastník jednotky)

---

## 3.2 Subjekt → Nemovitost (N:N)

Pronajímatel může vlastnit více nemovitostí.  
Správce může být přiřazen k více objektům.

---

## 3.3 Subjekt → Smlouvy (1:N nebo N:N)

Např.:

- nájemní smlouvy  
- servisní smlouvy  
- dodavatelské smlouvy  

Každá smlouva odkazuje na 1 nebo více subjektů.

---

# 4. Systémová a auditní vrstva

Každá tabulka v modelu subjektu má:

- `created_at`  
- `created_by`  
- `updated_at`  
- `updated_by`  
- `is_archived` (tam, kde je relevantní)

Auditní vrstva umožňuje:

- dohledatelnost změn  
- omezení přístupu přes RLS  
- bezpečnostní logiku

---

# 5. Shrnutí datového modelu subjektu

Model zahrnuje tyto tabulky:

| Tabulka | Popis |
|--------|--------|
| **subject** | hlavní entita osoby nebo organizace |
| **subject_roles** | role subjektu (N:N) |
| **subject_permissions** | oprávnění subjektu (N:N) |
| **bank_accounts** | bankovní účty subjektu (1:N) |
| **subject_additional_users** | další osoby v domácnosti nájemníka (1:N) |
| **subject_relationships** | libovolné vazby mezi subjekty (volitelné) |
| **subject_documents** | dokumenty připojené k subjektu (1:N) |

Tento model je stabilní základ pro celou aplikaci.  
Bez něj nelze plně specifikovat moduly 010, 020, 030, 050 a 110.

