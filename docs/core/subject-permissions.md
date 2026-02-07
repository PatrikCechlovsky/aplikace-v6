# aplikace-v6/docs/01-core/subject-permissions.md
# Subject – pravidla viditelnosti a oprávnění

## Účel dokumentu
Tento dokument definuje **viditelnost**, **editovatelnost** a **přístupová pravidla** pro všechna pole subjektu.  
Je závazný pro moduly 010, 020, 030, 050, 110 a libovolné další moduly pracující se subjektem.

Oprávnění jsou rozdělena na tři vrstvy:
1. **Vidí pole**  
2. **Smí editovat pole**  
3. **Smí pracovat s entitou (list, detail, mazání, archivace)**  

Role a oprávnění vycházejí z číselníků v modulu 900:
- `subject_role`
- `permission_type`

---

## 1. Typické role v systému

Uživatelské role jsou konfigurovatelné přes modul 900.  
Níže je doporučená výchozí sada rolí:

| Role               | Popis |
|-------------------|-------|
| admin             | plný přístup ke všem subjektům a polím |
| user              | běžný uživatel systému |
| pronajimatel      | vlastní subjekt nemovitostí |
| najemnik          | nájemník jednotky |
| servis            | údržba a technické role |
| finance           | přístup jen k finančním údajům / účtům |
| zastupce          | právní zástupce firmy nebo spolku |

Role určují **kontext**, ale konkrétní oprávnění jsou dána poli.

---

## 2. Oprávnění nad entitou „subject“

### 2.1 Viditelnost seznamu subjektů (ListView)
| Role | Přístup |
|------|---------|
| admin | vidí všechny subjekty |
| finance | vidí jen subjekty s rolí finance / pronajímatel |
| servis | vidí subjekty, které jsou přiřazeny k údržbě |
| user | vidí pouze sebe (svůj subjekt) |
| najemnik | vidí jen sebe + další uživatele své jednotky (v modulu nájemníka) |

---

### 2.2 Viditelnost detailu subjektu (DetailView)
| Role | Přístup |
|------|---------|
| admin | plný přístup |
| finance | bez osobních údajů (skryto: doklady, datum narození) |
| user | vidí své vlastní údaje, ale nevidí údaje jiných osob |
| najemnik | vidí své údaje a spolubydlící své jednotky |
| pronajimatel | vidí své údaje + nájemníky svých jednotek |
| servis | limitovaný přístup (jméno, telefon) pro kontaktní účely |

---

### 2.3 Editace subjektu
| Role | Smí editovat |
|------|--------------|
| admin | vše |
| user | svůj vlastní subjekt (omezená sada polí) |
| najemnik | jen omezená pole: telefon, email, přihlašovací údaje |
| finance | nesmí editovat osobní data |
| servis | nesmí editovat subjekt |
| pronajimatel | smí editovat jen jiný subjekt typu firma / objektová správa přidělená k jeho nemovitosti |

---

### 2.4 Mazání / archivace subjektu
| Role | Pravidlo |
|------|----------|
| admin | smí archivovat i mazat |
| user | nesmí |
| najemnik | nesmí |
| finance | nesmí |
| servis | nesmí |

---

## 3. Oprávnění nad jednotlivými poli subjektu

### 3.1 Pole osobní identity
| Pole | Vidí | Edituje |
|------|------|---------|
| first_name, last_name | admin, user (sám), najemnik (sám) | admin, user (sám) |
| birth_date | admin, user (sám) | admin |
| id_doc_type, id_doc_number | admin | admin |
| title_before | admin, user (sám) | admin, user (sám) |

---

### 3.2 Firemní identita
| Pole | Vidí | Edituje |
|------|------|---------|
| company_name | admin, finance, pronajimatel | admin |
| ic, dic | admin, finance | admin |
| ic_valid, dic_valid | admin, finance | pouze systém (read-only) |
| ares_json | admin | pouze systém (read-only) |

---

### 3.3 Kontakty
| Pole | Vidí | Edituje |
|------|------|---------|
| phone | admin, user (sám), finance (pouze vybrané) | admin, user (sám) |
| email | admin, user (sám) | admin, user (sám) |

---

### 3.4 Adresa
| Pole | Vidí | Edituje |
|------|------|---------|
| street, city, zip, house_number | admin, user (sám), pronajimatel | admin, user (sám) |
| ruian_address_id | admin | systém |
| ruian_validated | admin | systém |
| address_source | admin | systém |

---

### 3.5 Bankovní účty
Viditelnost přes záložku **Účty**:

| Role | Vidí účty | Edituje |
|------|-----------|---------|
| admin | ano | ano |
| user | své | své |
| najemnik | ne | ne |
| finance | ano | ano (může spravovat účty firmy) |

Poznámka: bankovní účty patří do samostatné tabulky a řídí se těmito pravidly.

---

### 3.6 Přihlašovací údaje
| Pole | Vidí | Edituje |
|------|------|---------|
| login | admin, user (sám) | admin, user (sám) |
| password | pouze user (sám) při změně | jen přes bezpečnostní modul |
| two_factor_method | admin, user (sám) | admin, user (sám) |

---

### 3.7 Role & Oprávnění
| Pole | Vidí | Edituje |
|------|------|---------|
| role | admin | admin |
| permissions | admin | admin |

Běžný uživatel nesmí vidět vlastní interní oprávnění, pouze „co může dělat“.

---

### 3.8 Auditní a systémová pole
| Pole | Vidí | Edituje |
|------|------|---------|
| created_at, updated_at | admin | systém |
| created_by, updated_by | admin | systém |
| is_archived | admin | admin |

---

## 4. Oprávnění pro „další uživatele jednotky“ (spolubydlící)

Týká se modulu 050 – nájemník.

| Role | Vidí | Edituje |
|------|------|---------|
| admin | ano | ano |
| najemnik | ano (jen svého seznamu) | ano (jen svého seznamu) |
| pronajimatel | ano | ne |
| servis / finance | ne | ne |

---

## 5. Shrnutí

- **admin**: plná práva nad celým subjektem  
- **user**: může upravit svůj profil a kontaktní údaje  
- **najemnik**: omezený přístup, vidí jen své údaje a spolubydlící  
- **pronajimatel**: vidí nájemníky svých jednotek, neupravuje jejich data  
- **finance**: vidí firemní údaje, ne osobní  
- **servis**: minimum viditelnosti (jméno, kontakt)

Tento dokument je závazný pro modul 010 (správa uživatelů), 020 (můj účet), 050 (nájemníci), 110 (správa subjektů) a další moduly, které pracují se subjekty.
