# /docs/05-auth-rls.md
## Popis: Tento dokument popisuje autentizační tok, práci se session, metadata uživatele a základy Supabase RLS v aplikaci Pronajímatel v6.
---

# 05 – Autentizace & RLS

## 1. Přehled autentizace

Aplikace Pronajímatel v6 používá:

- **Supabase Auth** (email + heslo)
- **uživatelská metadata** (displayName)
- **persistovanou session** v prohlížeči
- **UI režim přihlášený / nepřihlášený uživatel**

Přihlášení je nutné pro vstup do hlavní části aplikace. Nepřihlášený uživatel vidí pouze přihlašovací panel.

### Použitý typ uživatele

    type SessionUser = {
      email: string | null
      displayName?: string | null
    }

Tento typ aplikace používá všude — v HomeActions, AppShell, UI i modulech.

---

## 2. Logika zpracování přihlášení

### 2.1 Načtení session při načtení aplikace

- `getCurrentSession()` se volá v AppShell při startu.
- výsledek uložen do **sessionUser** (globální stav UI).

### 2.2 Reakce na změny stavu

- `onAuthStateChange()` detekuje login nebo logout.
- UI se okamžitě přepne mezi:
  - **guest mode** → přihlašovací panel
  - **authenticated mode** → AppShell + Sidebar + moduly

### 2.3 Odhlášení

- volá se `supabase.auth.signOut()`
- UI vymaže session uživatele
- zobrazí se přihlašovací UI

---

## 3. Získání displayName (logika z layout_auth_ui)

Aplikace preferuje jméno uživatele v tomto pořadí:

1. `session.user.user_metadata.display_name`
2. `session.user.user_metadata.full_name`
3. `session.user.user_metadata.name`
4. `session.user.email`
5. fallback: `"Uživatel"`

Výhodou je, že pokud někdo nemá jméno, UI stále funguje.

### Logika použití

DisplayName se používá v:

- HomeActions (pravý horní roh)
- budoucím UserMenu (nastavení profilu)
- logování aktivit
- notifikacích

---

## 4. Práva a přístupy (High-level)

Aplikace už nyní připravuje:

### Role systému (zatím koncept)

- **admin** – vidí vše, spravuje moduly, může nastavovat typy
- **owner / pronajímatel** – vidí jen své subjekty a své nemovitosti
- **manager / správce** – může spravovat portfolio dle přidělených práv
- **accountant** – přístup do faktur, plateb, vyúčtování

Role budou implementovány přes:

- **Supabase Table: `subject_roles`**
- **Supabase Table: `subject_permissions`**
- UI logiku, která podle role povolí/zakáže akce

---

## 5. Row Level Security (RLS)

Supabase RLS zajistí, aby uživatel viděl **pouze své vlastní záznamy**.

Základní struktura RLS bude:

1. Tabulka obsahuje `owner_subject_id` nebo `created_by`
2. Politika RLS omezuje SELECT / UPDATE / DELETE na:
   
       owner_subject_id = auth.uid()

3. Pro administrátora bude speciální RLS pravidlo:

       role = 'admin'

### Příklady chystaných politik

#### 5.1 SELECT politika

    create policy "Uživatel vidí pouze své záznamy"
    on subjects
    for select
    using ( owner_id = auth.uid() );

#### 5.2 Insert politika

    create policy "Uživatel může přidávat pouze své vlastní záznamy"
    on subjects
    for insert
    with check( owner_id = auth.uid() );

#### 5.3 Admin politika

    create policy "Admin vidí vše"
    on subjects
    for select
    using ( auth.role() = 'admin' );

*(Pozn.: přesný tvar bude upraven podle finální struktury tabulek.)*

---

## 6. Napojení RLS na UI

UI bude brát oprávnění z:

- `session.user.id`
- `session.user.user_metadata.role`
- případně tabulek v Supabase (`subject_permissions`)

Díky tomu budou části UI:

- **skryté** (není povoleno)
- **disabled** (povoleno, ale nesplněná podmínka)
- **viditelné a aktivní** (povoleno)

### Nejdůležitější navázané části UI:

- Sidebar (moduly podle role)
- CommonActions (akce podle oprávnění)
- Tabulkové přehledy (SELECT filtrován podle RLS)
- Formuláře (Update/Delete omezeny podle RLS)

---

## 7. UI pro autentizaci (z layout_auth_ui.md)

Aplikace používá vlastní login formulář:

- pole Email  
- pole Heslo  
- tlačítko **Přihlásit se**  
- stav „Načítání“  
- zobrazování chybového hlášení  

Dále:

- User menu bude rozšířeno v dalších fázích  
- 2FA bude možné zapnout později (Supabase již podporuje)  

---

## 8. Budoucí směry vývoje

### 8.1 Implementace role-based access (RBAC)
- přidání tabulky `roles`  
- definice rozhraní na úrovni modulů  
- mapování rolí na CommonActions  

### 8.2 Permission systém 2.0
- UI engine bude rozhodovat o viditelnosti akcí  
- podmínky: vybraná položka, čistota formuláře, role, modulový stav  

### 8.3 Logování akcí uživatele
- auditní log změn v datech  
- historie přístupů  
- logování odeslaných e-mailů  

---

## 9. Poznámky a další obsah k zařazení

Zde budeme přesouvat vše, co se nehodí do hlavní struktury, ale patří k tématu:

- možnost přidat OAuth2 (Google, Microsoft)  
- přepnutí na Magic Link (bez hesla)  
- ukládání profilu uživatele do vlastní tabulky  
- budoucí přehled aktivních session  

*(zatím nebylo rozpracováno, ale ponecháno pro pozdější použití)*

---

## 10. Závěr

Tento dokument slouží jako:
- referenční popis autentizace,
- plán RLS logiky,
- přehled rolí a oprávnění,
- propojení autentizace s UI systémem.

Detailní implementace bude probíhat po dokončení modulů a datového modelu.

