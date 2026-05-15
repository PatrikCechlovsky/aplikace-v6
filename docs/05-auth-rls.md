# /docs/05-auth-rls.md
## Popis: Tento dokument popisuje autentizační tok, práci se session, uživatelská metadata a základy Supabase RLS v aplikaci Pronajímatel v6.
---

# 05 – Autentizace & RLS

## 1. Přehled autentizace

Aplikace Pronajímatel v6 používá:

- **Supabase Auth** (email + heslo)
- **uživatelská metadata** (displayName)
- **persistovanou session** v prohlížeči
- **UI režim přihlášený / nepřihlášený uživatel**

Přihlášení je nutné pro vstup do hlavní části aplikace. Nepřihlášený uživatel vidí pouze přihlašovací panel.

---

## 2. Přihlášení

Přihlášení probíhá standardním způsobem:

- uživatel zadá email a heslo
- Supabase ověří údaje
- vrátí session token
- session se uloží do prohlížeče

```ts
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
})
```

---

## 3. Session & User Metadata

Po přihlášení získáme objekt:

```ts
session.user.user_metadata
```

Metadata mohou obsahovat:

- `display_name`
- `full_name`
- `name`
- další hodnoty dle potřeby

### Výběr zobrazovaného jména uživatele

Aplikace používá tento algoritmus:

1. `display_name`
2. `full_name`
3. `name`
4. `email`
5. `"Uživatel"`

Tím je zajištěno, že se uživateli **vždy** zobrazí nějaké jméno.

---

## 4. Odhlašování

Uživatel se odhlásí pomocí:

```ts
await supabase.auth.signOut()
```

Po odhlášení:

- session je zrušena
- UI se přepne do režimu přihlášení
- Sidebar, CommonActions a obsah aplikace jsou deaktivované

---

## 5. Přihlášený / nepřihlášený stav v UI

UI aplikace reaguje na session:

### Nepřihlášený uživatel
- vidí **jen login panel**
- Sidebar je prázdný
- CommonActions jsou deaktivované
- Breadcrumbs zobrazuje pouze "Přihlášení"

### Přihlášený uživatel
- vidí Sidebar s moduly
- nahoře se zobrazí **displayName**
- má přístup do celého systému (dle oprávnění)

---

## 6. Role uživatele (plán)

Aplikace bude používat následující základní role:

- **superadmin** – plný přístup
- **pronajímatel** – přístup ke svým objektům
- **správce** – správa operativy
- **technik / údržba** – přístup k servisním modulům
- **nájemník (budoucnost)** – omezený přístup

Role budou uložené v Supabase v tabulce:

```
user_roles
```

Každý uživatel může mít 1–N rolí.

---

## 7. Permission systém (plán)

Každý modul může definovat:

```
permissions: {
  view: [...roleIds],
  edit: [...roleIds],
  delete: [...roleIds],
}
```

Permission engine v UI:

- deaktivuje tlačítka
- skrývá moduly
- určuje chování CommonActions
- omezí určité druhy akcí

Permission engine v RLS:

- zajistí, že uživatel nemůže mazat nebo měnit, co mu nepatří

---

## 8. RLS – Row Level Security

### RLS (Row-Level Security)

Supabase umožňuje omezit, **které řádky v databázi může uživatel vidět nebo měnit**.

Každá tabulka má pravidla typu:

```sql
CREATE POLICY "Uživatel vidí jen své záznamy"
ON nemovitosti
FOR SELECT
USING (created_by = auth.uid());
```

### Základní principy:

- Uživatel **nikdy** nesmí vidět data jiných uživatelů / pronajímatelů
- Každý záznam má:

```
created_by uuid DEFAULT auth.uid()
```

To umožňuje filtrovat přes RLS.

### Specifické pravidlo: Bankovní účty

Pro tabulku `bank_accounts` platí, že uživatel může číst/upravovat/vytvářet účet:

- pokud je **vlastníkem subjektu** (auth_user_id),
- nebo má **oprávnění** přes `subject_permissions` (admin/manage),
- nebo je **zástupcem** subjektu přes vazbu `subject_delegates`.

### Specifické pravidlo: Nemovitosti a jednotky

Pro tabulky `properties` a `units` platí, že uživatel může číst/upravovat/vytvářet záznamy:

- pokud je **vlastníkem pronajímatele** (auth_user_id / email),
- nebo je **zástupcem pronajímatele** přes vazbu `subject_delegates`.

---

## 9. Doporučené RLS politiky

### SELECT – může číst jen vlastní záznamy

```sql
USING (created_by = auth.uid())
```

### INSERT – může vytvářet jen vlastní záznamy

```sql
WITH CHECK (created_by = auth.uid())
```

### UPDATE – může upravit jen svoje záznamy

```sql
USING (created_by = auth.uid())
```

### DELETE – pouze role superadmin

```sql
USING (auth.role() = 'superadmin')
```

---

## 10. Chyby a varování Supabase (řešené během vývoje)

### Varování: *RLS Disabled*
Toto varování znamenalo, že některé tabulky neměly aktivované RLS.  
Bylo opraveno zapnutím RLS a doplněním politik.

### Varování: *Search Path Mutable*
Bezpečnostní doporučení Supabase –  
není problém pro vývoj, ale pro produkci budeme používat stabilní schéma.

---

## 11. Budoucí rozšíření

- přidání MFA (dvoufázové ověření)  
- přihlášení pomocí magic linku  
- přidání audit logů  
- definice granular permissions pro každé pole ve formuláři  
- dynamické skrývání modulů podle licence / role  

---

## 12. Závěr

Tento dokument slouží jako:

- referenční popis autentizace,
- plán RLS logiky,
- přehled rolí a oprávnění,
- propojení autentizace s UI systémem.

Detailní implementace bude probíhat po dokončení modulů a datového modelu.

## Autentizace a autorizace – základní principy

- Autentizace a autorizace jsou v aplikaci striktně oddělené pojmy.
- Autentizace řeší identitu uživatele.
- Autorizace řeší oprávnění k provádění akcí.

---

## Stav uživatele

- Stav uživatele je určen systémovými daty.
- Aktivní uživatel je ten, který se alespoň jednou přihlásil.
- Neaktivní uživatel je uživatel bez prvního přihlášení.

- Stav uživatele není ručně editovatelný.
- UI se vždy řídí aktuálním stavem uživatele.

---

## Pozvánky uživatelů

- Pozvánka je samostatný proces.
- Pozvánky se používají pouze pro neaktivní uživatele.
- Aktivní uživatel nemůže být znovu pozván.

- Proces pozvání je oddělen od správy profilu.
- Pozvánka nesmí měnit existující data uživatele.

---

## Role a oprávnění

- Role a oprávnění jsou řízeny centrálně.
- Role určuje obecný rámec přístupu.
- Oprávnění určují konkrétní akce.

- Role a oprávnění se přiřazují explicitně.
- Neexistují implicitní nebo automatická oprávnění.

---

## RLS (Row Level Security)

- RLS je primární ochranný mechanismus dat.
- UI nikdy nesmí obcházet RLS pravidla.
- RLS pravidla jsou považována za zdroj pravdy.

- Každá změna dat musí projít RLS kontrolou.
- Chyba RLS je považována za chybu návrhu nebo konfigurace.

---

## Vztah UI a RLS

- UI nesmí předpokládat oprávnění.
- Dostupnost akcí v UI se řídí:
  - rolí uživatele,
  - explicitními oprávněními,
  - RLS pravidly.

- Skrytí akce v UI nenahrazuje RLS ochranu.
- RLS ochrana je vždy nadřazená UI logice.

---

## Audit a dohledatelnost

- Všechny bezpečnostně významné operace musí být dohledatelné.
- Historie změn nesmí být zpětně měněna.
- Auditní data jsou považována za neměnná.

---

## Závaznost

- Tato pravidla jsou závazná pro celý projekt.
- Platí pro všechny moduly a entity.
- Porušení těchto pravidel je považováno za kritickou chybu.
