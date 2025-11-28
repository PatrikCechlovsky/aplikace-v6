# Pronajímatel v6 – Modulární SaaS pro správu nájemních vztahů

Toto je 6. generace aplikace „Pronajímatel“, kompletně přepsaná do moderní modulární architektury.

---

# 🚀 Technologie

- Next.js 14 (App Router)
- TypeScript / TSX
- Supabase (Auth + DB)
- Vercel (CI/CD + produkční hosting)
- Ručně tvořený UI systém bez externích knihoven

---

# 📂 Struktura projektu

```txt
app/
  UI/
    Breadcrumbs.tsx
    CommonActions.tsx
    DetailView.tsx
    HomeActions.tsx
    HomeButton.tsx
    ListView.tsx
    LoginPanel.tsx
    Sidebar.tsx
    Tabs.tsx
    icons.ts
  lib/
    supabaseClient.ts
  modules/
    010-sprava-uzivatelu/
    020-muj-ucet/
    030-pronajimatel/
    040-nemovitost/
    050-najemnik/
    060-smlouva/
    070-sluzby/
    080-platby/
    090-finance/
    100-energie/
    120-dokumenty/
    130-komunikace/
    900-nastaveni/
  globals.css
  layout.tsx
  modules.index.js
  page.tsx

docs/
  CODESTYLE.md
  UI-specifikace.md
  layout_auth_ui.md
  stav-struktury.md
  todo_list.md

ikons.md
README.md
next.config.mjs
package.json
tsconfig.json
```

---

# 🧩 Modulový systém

Moduly jsou umístěné v `app/modules/`.

Každý modul má strukturu:

```
module.config.js
tiles/
forms/
services/
```

### Ukázka konfigurace modulu

```js
/*
 * FILE: app/modules/040-nemovitost/module.config.js
 * PURPOSE: Konfigurace modulu „Nemovitosti“
 */

import { ICONS } from '@/app/UI/icons'

export default {
  id: '040-nemovitost',
  label: 'Nemovitosti',
  icon: 'building',
  order: 40,
  enabled: true
}
```

Moduly jsou dynamicky načítané podle `modules.index.js`.

---

# 🎨 UI – 6 hlavních částí aplikace

Celý layout aplikace je rozdělen na:

1. **HomeButton** – název aplikace vlevo nahoře
2. **Sidebar** – seznam modulů
3. **Breadcrumbs** – drobečková navigace
4. **HomeActions** – horní panel vpravo
5. **CommonActions** – lišta obecných akcí
6. **Content** – hlavní plocha (dashboard, přehled, formuláře)

Glóbalní styly a grid definované v `globals.css`.

---

# 🔐 Autentizace

- přihlášení (email + heslo)
- registrace (email + heslo + jméno)
- reset hesla (Supabase reset mail)
- session listener (`onAuthStateChange`)
- blokace UI pro nepřihlášené uživatele
- Logout

MFA (TOTP) je aktivní v Supabase a bude doplněno v budoucí fázi.

---

# 🎭 Ikony

- seznam ikon v `ikons.md`
- implementace ikon v `app/UI/icons.ts`

Použití:

```tsx
import { getIcon } from '@/app/UI/icons'

<span>{getIcon('building')}</span>
```

V UI se emoji **nikdy nepíší přímo**, vždy přes `getIcon()`.

---

# 🧠 Kódové standardy

Viz `docs/CODESTYLE.md`.

Shrnutí:

- UI komponenty neobsahují logiku Supabase
- logika a DB připojení v `app/lib`
- žádné inline styly
- každá komponenta má povinnou hlavičku:

```ts
/*
 * FILE: app/UI/Sidebar.tsx
 * PURPOSE: Popis účelu souboru
 */
```

- názvy komponent PascalCase
- názvy funkcí camelCase
- moduly pouze přes `module.config.js`

---

# 🧾 Dokumentace

V adresáři `docs/` jsou tyto soubory:

- UI-specifikace.md
- layout_auth_ui.md
- stav-struktury.md
- todo_list.md
- CODESTYLE.md

---

# 🚀 Nasazování

Každý push do větve `main` automaticky vytváří nový deployment (Vercel).

Produkční URL:  
https://aplikace-v6.vercel.app

---

# 📌 Stav projektu

Viz:

- docs/stav-struktury.md
- docs/todo_list.md

# Databáze a bezpečnost (Supabase)

## Přehled

Projekt používá Supabase (PostgreSQL + Auth + PostgREST) jako backend.  
Bezpečnost je postavena na:

- Supabase Auth
- Row Level Security (RLS)
- číselnících pro role, typy subjektů a oprávnění

Níže je přehled klíčových tabulek a politik.

---

## Tabulka `public.subjects`

Centrální tabulka pro všechny subjekty (osoby, firmy, nájemníky, pronajímatele atd.).

Důležité sloupce:

- `id :: uuid` – primární klíč
- `subject_type :: text` – typ subjektu (navázáno na `subject_types`)
- `auth_user_id :: uuid` – vazba na Supabase uživatele (`auth.uid()`)
- `first_name`, `last_name`, `company_name`, `display_name` – identifikace subjektu
- `ic`, `dic`, `ic_valid`, `dic_valid` – IČ / DIČ a jejich validace
- `country`, `city`, `street`, `house_number`, `orientation_number`, `postal_code` – adresa
- `address_source :: text` – zdroj adresy (ručně, ARES, RÚIAN…)
- `phone`, `email` – kontaktní údaje
- `bank_account_id :: uuid` – vazba na bankovní účet (budoucí modul Finance)
- `delegate_id :: uuid` – vazba na delegáta / zástupce
- `login`, `password_hash` – volitelné přihlašovací údaje (pokud se použijí)
- `ares_json :: jsonb` – syrová data z ARES
- `audit :: jsonb` – auditní metadata
- `origin_module :: text` – identifikace modulu, kde byl záznam založen
- `origin_entity :: text` – typ entity v rámci modulu
- `created_at`, `updated_at`, `created_by :: uuid` – audit

### RLS (Row Level Security)

RLS je zapnuté:

```sql
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
Policy:

SELECT – uživatel vidí pouze subjekty, kde auth_user_id = auth.uid():

CREATE POLICY "Subjects: select own"
ON public.subjects
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());


INSERT – uživatel může vložit subjekt pouze s vlastním auth_user_id:

CREATE POLICY "Subjects: insert own"
ON public.subjects
FOR INSERT
TO authenticated
WITH CHECK (auth_user_id = auth.uid());


UPDATE – uživatel může měnit jen své subjekty:

CREATE POLICY "Subjects: update own"
ON public.subjects
FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());


DELETE – uživatel může mazat jen své subjekty:

CREATE POLICY "Subjects: delete own"
ON public.subjects
FOR DELETE
TO authenticated
USING (auth_user_id = auth.uid());


V UI je nutné při insertech do subjects vždy nastavovat auth_user_id = auth.uid().

Číselníky
public.role_types

Definuje typy rolí, např. owner, tenant, admin, accountant, …

RLS:

ALTER TABLE public.role_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Role types: read all"
ON public.role_types
FOR SELECT
TO authenticated
USING (true);

public.permission_types

Definuje typy oprávnění, např. can_view_payments, can_edit_contracts, …

RLS:

ALTER TABLE public.permission_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permission types: read all"
ON public.permission_types
FOR SELECT
TO authenticated
USING (true);

public.subject_types

Definuje typy subjektů, např. person, company, landlord, tenant, …

RLS:

ALTER TABLE public.subject_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subject types: read all"
ON public.subject_types
FOR SELECT
TO authenticated
USING (true);

Vazby: role a oprávnění
public.subject_roles

Vazba subjekt ↔ role (např. subjekt je pronajímatel, nájemník…).

RLS:

ALTER TABLE public.subject_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subject roles: own"
ON public.subject_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.subjects s
    WHERE s.id = subject_roles.subject_id
      AND s.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.subjects s
    WHERE s.id = subject_roles.subject_id
      AND s.auth_user_id = auth.uid()
  )
);

public.subject_permissions

Vazba subjekt ↔ oprávnění (např. subjekt může vidět platby, editovat smlouvy…).

RLS:

ALTER TABLE public.subject_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subject permissions: own"
ON public.subject_permissions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.subjects s
    WHERE s.id = subject_permissions.subject_id
      AND s.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.subjects s
    WHERE s.id = subject_permissions.subject_id
      AND s.auth_user_id = auth.uid()
  )
);

Další bezpečnostní kroky

Funkce public.set_updated_at:

nastavit SET search_path = public v definici funkce.

Supabase Auth:

zapnout Leaked Password Protection (kontrola hesel přes HaveIBeenPwned).
