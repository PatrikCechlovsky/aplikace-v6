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

Layout je postaven přes CSS grid a nachází se v `globals.css`.
> Poznámka: Některé konfigurační číselníky (např. typy subjektů) používají speciální komponentu `GenericTypeTile`.  
> V těchto obrazovkách se nezobrazuje horní lišta `CommonActions` ani sekce příloh – všechny akce (Předchozí/Další/Uložit/Archivovat) jsou součástí samotného formuláře.

---

# 🔐 Autentizace

- přihlášení (email + heslo)
- registrace (email + heslo + jméno)
- reset hesla (Supabase reset mail)
- session listener (`onAuthStateChange`)
- blokace UI pro nepřihlášené uživatele
- Logout

MFA (TOTP) je aktivní v Supabase a bude doplněno do aplikace.

---

# 🎭 Ikony

- seznam ikon v `ikons.md`
- implementace ikon v `app/UI/icons.ts`

```tsx
import { getIcon } from '@/app/UI/icons'

<span>{getIcon('building')}</span>
```

V UI se emoji **nikdy nepíšou přímo** – vždy přes `getIcon()`.

---

# 🧠 Kódové standardy

Viz `docs/CODESTYLE.md`.

Základní pravidla:

- UI komponenty neobsahují logiku Supabase
- logika a DB připojení v `app/lib`
- žádné inline styly
- každá komponenta má hlavičku se „FILE“ a „PURPOSE“
- názvy komponent PascalCase
- moduly pouze přes `module.config.js`

---

# 🚀 Nasazování

Každý push do větve `main` automaticky vytváří nový deployment (Vercel).

Produkční URL:  
https://aplikace-v6.vercel.app

---

# 📌 Stav projektu

- `docs/stav-struktury.md`
- `docs/todo_list.md`

---

# 🔐 Databáze a bezpečnost (Supabase)

Tento projekt používá Supabase jako kompletní backend vrstvu – databázi, autentizaci, REST API (PostgREST) a bezpečnost pomocí **Row Level Security (RLS)**.

Cílem je zajistit, že každý uživatel uvidí **pouze své vlastní záznamy**.

---

# 🧩 Tabulka `public.subjects`

`subjects` je centrální tabulka celého systému (osoby, firmy, nájemníci, pronajímatelé…).

Klíčový sloupec pro bezpečnost:

- **`auth_user_id :: uuid`** — obsahuje `auth.uid()`

Slouží jako *vlastnictví* řádku.

## 🔐 RLS – Subjects

Zapnutí RLS:

```sql
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
```

### SELECT – jen vlastní záznamy

```sql
CREATE POLICY "Subjects: select own"
ON public.subjects
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());
```

### INSERT – uživatel může vkládat pouze své subjekty

```sql
CREATE POLICY "Subjects: insert own"
ON public.subjects
FOR INSERT
TO authenticated
WITH CHECK (auth_user_id = auth.uid());
```

### UPDATE – lze měnit pouze vlastní řádky

```sql
CREATE POLICY "Subjects: update own"
ON public.subjects
FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());
```

### DELETE

```sql
CREATE POLICY "Subjects: delete own"
ON public.subjects
FOR DELETE
TO authenticated
USING (auth_user_id = auth.uid());
```

### ⚠ Důležité pro aplikaci
Frontend **musí při insertech vždy posílat**:

```ts
auth_user_id: auth.uid()
```

---

# 🗂 Číselníky (read-only)

## `public.role_types`

```sql
ALTER TABLE public.role_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Role types: read all"
ON public.role_types
FOR SELECT
TO authenticated
USING (true);
```

## `public.permission_types`

```sql
ALTER TABLE public.permission_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permission types: read all"
ON public.permission_types
FOR SELECT
TO authenticated
USING (true);
```

## `public.subject_types`

```sql
ALTER TABLE public.subject_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subject types: read all"
ON public.subject_types
FOR SELECT
TO authenticated
USING (true);
```

---

# 🏷 Vazební tabulky (role & oprávnění)

## `public.subject_roles`

```sql
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
```

## `public.subject_permissions`

```sql
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
```

---

# 🔧 Další bezpečnostní kroky

## ▶ Funkce `public.set_updated_at` – oprava

```sql
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

## ▶ Supabase Auth

V sekci Authentication → Email:

- zapnout *Leaked Password Protection*

---

# 🧱 Shrnutí

Tato RLS vrstva poskytuje:

- izolaci mezi uživateli,
- globální číselníky (read-only),
- propojení rolí/oprávnění na vlastní subjekty,
- plnou kompatibilitu s modulovým systémem Pronajímatel v6.

Aplikační logika (moduly 010–900) na tom může bezpečně stavět.

