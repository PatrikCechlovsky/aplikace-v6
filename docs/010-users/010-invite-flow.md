# Modul 010 – Pozvat uživatele (Invite flow)

## 1. Účel
Pozvání uživatele je **samostatný proces**, oddělený od správy profilu uživatele.

Cílem je:
- umožnit administrátorům pozvat uživatele do aplikace,
- podporovat **existující i nové uživatele**,
- minimalizovat povinná pole,
- zajistit audit, stav a dohledatelnost,
- zachovat konzistentní chování UI a CommonActions.

Pozvánka **není editace uživatele**.

---

## 2. Umístění v aplikaci

### Modul
- **010 – Správa uživatelů**

### Přístup z UI
- obrazovka **Seznam uživatelů (ListView)**

### CommonActions v seznamu
- Přidat uživatele (plný detail)
- Pozvat uživatele (Invite flow)

Akce „Pozvat uživatele“:
- nikdy neotevírá detail uživatele,
- vždy otevírá samostatnou obrazovku pozvánky.

---

## 3. Obrazovka „Pozvat uživatele“

Pozvánka je samostatná obrazovka:
- používá stejný rámec jako ostatní detaily (DetailFrame),
- **není svázaná s UserDetailFrame**,
- má vlastní stav a audit.

### Záložky
1. **Pozvánka** – editovatelná
2. **Systém** – pouze pro čtení (až po vytvoření pozvánky)

---

## 4. Režimy pozvánky

Uživatel volí jeden z režimů:

- Pozvat **existujícího** uživatele
- Pozvat **nového** uživatele

Zvolený režim:
- mění povinná pole,
- mění chování validace,
- nemění výsledný proces (vždy vzniká pozvánka).

---

## 5. Režim A – Pozvat existujícího uživatele

### Povinné kroky
- výběr existujícího subjektu (uživatele),
- výběr role.

### Předvyplnění
Po výběru uživatele se předvyplní:
- email,
- zobrazované jméno,
- aktuální role (pokud existuje).

### Editovatelnost
- Email: read-only
- Zobrazované jméno: editovatelné
- Role: povinná
- Poznámka: volitelná

---

## 6. Režim B – Pozvat nového uživatele

### Povinná pole
- Email
- Role

### Volitelná pole
- Zobrazované jméno
- Poznámka

### Nepoužívaná pole
- login
- heslo
- osobní údaje

Email je jediná identita nového uživatele.

---

## 7. Validace

Validace probíhá:
- v service vrstvě,
- UI pouze zobrazuje chyby.

### Společná pravidla
- role je povinná,
- nelze odeslat bez validních dat.

### Režim A
- musí být vybraný uživatel.

### Režim B
- email je povinný,
- email musí mít validní formát,
- unikátnost řeší backend.

---

## 8. CommonActions – chování

### Na obrazovce pozvánky
- Odeslat pozvánku
- Zrušit

### Pravidla
- nelze odeslat při validačních chybách,
- platí dirty guard,
- Zrušit vrací zpět do seznamu uživatelů.

---

## 9. Backend proces (koncept)

### Existující uživatel
- ověření subjektu,
- přiřazení role (pokud je změněna),
- vytvoření záznamu pozvánky,
- odeslání emailu.

### Nový uživatel
- vytvoření minimálního subjektu (pending),
- přiřazení role,
- vytvoření pozvánky,
- odeslání emailu.

Heslo se **nikdy nezadává** v invite procesu.

---

## 10. Záložka „Systém“

Zobrazuje se pouze po vytvoření pozvánky.

### Zobrazená metadata
- ID pozvánky
- Stav
- Datum vytvoření
- Kdo pozvánku vytvořil
- Datum odeslání

Záložka je pouze pro čtení.

---

## 11. Oprávnění a bezpečnost

- Pozvání je administrátorská akce.
- Řízeno přes role a RLS.
- Běžný uživatel:
  - akci nevidí,
  - nemá přístup k pozvánkám jiných uživatelů.

---

## 12. Shrnutí
- Invite je samostatný proces.
- Oddělený od správy profilu.
- Minimum povinných polí.
- Auditovatelný a rozšiřitelný.
- Konzistentní s architekturou aplikace-v6.

---

## 13. Zobrazení stavu pozvánky u uživatele (ListView)

V seznamu uživatelů zobrazujeme odvozené informace o pozvánkách:

### Zobrazované sloupce
- invite_status (none/pending/sent/accepted/expired/canceled)
- invite_sent_at
- invite_accepted_at (pokud existuje)

### Význam
- „Pozvánka odeslána“ = invite_sent_at != null
- „Zaregistrován“ = invite_status = accepted (nebo accepted_at != null)

### Implementační princip
- Stav pozvánky se neukládá jako pole uživatele.
- Použije se DB view (v_users_list) nebo join, který vrátí poslední pozvánku pro uživatele.
- UI pouze zobrazuje hodnoty (bez business logiky).
