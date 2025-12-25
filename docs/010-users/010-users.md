# Modul 010 – Správa uživatelů

## 1. Účel modulu

Modul **010 – Správa uživatelů** slouží k řízení přístupu osob do aplikace *Aplikace Pronajímatel*.
Řeší celý životní cyklus uživatele od pozvání až po aktivní používání aplikace.

Modul umožňuje:

* evidenci uživatelů (osob),
* přiřazení rolí a oprávnění,
* pozvání nových i existujících osob do aplikace,
* audit přístupů a stavů pozvánek.

Modul **neřeší**:

* billing a platby,
* správu tarifů,
* onboarding plátců (plánováno do budoucna).

---

## 2. Základní pojmy

**Uživatel**
Osoba, která může (nebo bude moci) přistupovat do aplikace.

**Subjekt**
Technická entita reprezentující osobu v databázi. Uživatel je vždy typ subjektu.

**Role**
Určuje rozsah oprávnění uživatele v aplikaci.

**Pozvánka**
Proces, kterým je uživateli umožněn první vstup do aplikace.

---

## 3. Architektura modulu

Modul je postaven na jednotném UI vzoru:

* Seznam uživatelů
* Detail uživatele
* Pozvánka (samostatný proces)

Navigace je **stavová**, nikoli historická.
Stav obrazovky je řízen parametry URL a interním stavem modulu.

---

## 4. Seznam uživatelů

Seznam uživatelů slouží jako centrální přehled osob v aplikaci.

Zobrazuje:

* jméno,
* e-mail,
* roli,
* stav archivace.

Umožňuje:

* otevřít detail uživatele,
* editovat uživatele,
* odeslat pozvánku,
* vytvořit nového uživatele.

---

## 5. Detail uživatele

Detail uživatele slouží ke správě konkrétní osoby.

### Záložky detailu

* Detail – základní údaje,
* Role – role a oprávnění,
* Pozvánka – odeslání pozvánky existujícímu uživateli,
* Přílohy – systémové dokumenty (read-only),
  > Pozn.: Záložka **Přílohy** v detailu uživatele je vždy **read-only**.  
  > Plná správa příloh se otevírá přes **📎 v CommonActions** jako samostatný tile „Správa příloh“.
* Systém – auditní informace.

### Chování

* režim čtení / editace,
* ochrana proti ztrátě neuložených změn,
* jednotné ovládání přes centrální akce.

---

## 6. Pozvánky – obecný koncept

Pozvánka je **samostatný proces**, nikoli jen tlačítko.

Cílem pozvánky je:

* umožnit první přihlášení uživatele,
* bezpečně navázat uživatele na aplikaci.

Pozvánka existuje nezávisle na tom, zda uživatel již má vytvořený záznam.

---

## 7. Typy pozvánek

### Pozvání ke spolupráci

Základní typ pozvánky používaný dnes.

Použití:

* spolupráce na správě nemovitostí,
* účetní, správci, rodinní příslušníci.

Vlastnosti:

* role je povinná,
* uživatel není plátce aplikace,
* lze znovu odeslat při splnění podmínek.

### Budoucí rozšíření – plátce

Pozvánka pro hlavního pronajímatele (plátce aplikace).
Zatím není implementována, architektura s ní počítá.

---

## 8. Režimy pozvánky

### Existující uživatel

* dostupné v detailu uživatele,
* lze odeslat pouze pokud se uživatel ještě nepřihlásil,
* po odeslání se zobrazí systémové informace.

### Nový uživatel

* samostatná obrazovka „Pozvat uživatele“,
* při odeslání:

  * vytvoření subjektu,
  * odeslání pozvánky,
  * zobrazení systémových informací.

---

## 9. Stavový model pozvánky

Pozvánka může být ve stavech:

* koncept,
* odesláno,
* expirováno,
* přijato,
* blokováno.

---

## 10. Pravidla odesílání a opakování

Odeslání je **povoleno**, pokud:

* uživatel se nikdy nepřihlásil,
* pozvánka neexistuje nebo expirovala.

Odeslání je **zakázáno**, pokud:

* uživatel se již přihlásil,
* pozvánka je aktivní a neexpirovala.

---

## 11. Systémová sekce (audit)

Zobrazuje:

* kdo pozvánku odeslal,
* kdy byla odeslána,
* do kdy platí,
* aktuální stav,
* datum prvního přihlášení.

Sekce je vždy pouze pro čtení.

---

## 12. Navigace a chování tlačítek

**Zavřít**

* zavře pouze aktuální úroveň,
* detail → seznam,
* pozvánka → seznam,
* seznam → modul.

Historie prohlížeče se nepoužívá.

**Klik v menu**

* reaguje okamžitě,
* při neuložených změnách zobrazí dotaz.

---

## 13. Bezpečnost

* řízení rolí a oprávnění,
* omezení přístupu k datům,
* časově omezené pozvánky,
* první přihlášení uzavírá možnost dalšího odesílání.

---

## 14. Vztah k dalším modulům

**Modul 020 – Můj účet**

* sdílí koncept subjektu,
* jiný kontext použití.

**Modul 900 – Nastavení**

* správa rolí a oprávnění,
* ovlivňuje chování modulu 010.

---

## 15. Budoucí rozšíření

* onboarding plátců,
* automatická expirace pozvánek,
* historie pozvánek,
* notifikace,
* tarifní logika.

---

## 16. Shrnutí

Tento dokument je **hlavní a sjednocenou specifikací modulu 010 – Správa uživatelů**
a nahrazuje roztříštěné poznámky v dalších souborech.
