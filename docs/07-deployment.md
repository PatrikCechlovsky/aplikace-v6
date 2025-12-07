# /docs/07-deployment.md
## Popis: Tento dokument popisuje způsob nasazení aplikace, práci s prostředími, .env proměnnými a CI/CD procesem.
---

# 07 – Deployment

## 1. Přehled prostředí

Aplikace Pronajímatel v6 je nasazena na:

- **Vercel** – produkční i testovací prostředí
- **Supabase** – backend (auth + PostgreSQL + storage)

### Typy prostředí:

| Prostředí | Popis |
|-----------|--------|
| **development** | lokální vývoj na PC |
| **preview** | automatické buildy pro pull requesty (Vercel) |
| **production** | hlavní produkční verze |

Aplikace je připravena pro multi-tenant provoz (v budoucnu).

---

## 2. .env proměnné

Projekt vyžaduje následující proměnné:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=   # nepoužívat v browseru!
SUPABASE_JWT_SECRET=
```

### Doporučení:
- `.env.local` není verzován (v .gitignore)
- `.env.production` je spravováno přímo ve Vercel dashboardu

---

## 3. Build a start aplikace

### Lokální vývoj

```
npm install
npm run dev
```

Aplikace běží na:

```
http://localhost:3000
```

---

### Produkční build

```
npm run build
npm start
```

Vercel při deploy provede automaticky:

- `npm install`
- `npm run build`
- optimalizaci serverových komponent
- generování bundlů

---

## 4. Deployment na Vercel

### 4.1 Automatické buildy

Každý push do hlavní větve (`main`) → okamžitý deploy.

PR do „main“ → preview deployment (Vercel URL).

### 4.2 Nastavení ve Vercelu

Sekce **Environment Variables** obsahuje:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- a další proměnné pro budoucí funkce

### 4.3 Vercel logs

Vercel poskytuje:
- serverové logy
- build logy
- edge logy

Slouží k ladění chyb produkční verze.

---

## 5. Napojení na Supabase

### 5.1 Klient

Aplikace používá klienta:

```
import { createClient } from '@supabase/supabase-js'
```

Ve verzi vhodné pro:

- RLS politiku  
- autentizaci v browseru  
- práci s databází  

### 5.2 Databázové migrace

Aktuálně se provádí v Supabase přes webové UI.  
Do budoucna se plánuje přechod na:

- `supabase migration push`
- verzované SQL soubory v /supabase/migrations

### 5.3 Storage

Pro dokumenty a přílohy:
- bucket `documents`
- budoucí šifrování/složky podle tenantů

---

## 6. CI/CD (budoucí stav)

CI část (GitHub Actions) bude zahrnovat:

- kontrolu TypeScript chyby (`tsc --noEmit`)
- kontrolu eslint pravidel (budoucí `npm run lint`)
- ověření migrací (pokud přejdeme na CLI)
- běh unit testů (vitest/jest)

CD část (Vercel):
- vytvoření preview buildu
- spuštění produkčního buildu

---

## 7. Deployment checklist

Před nasazením:

- [ ] ověřit, že build proběhne lokálně  
- [ ] zkontrolovat .env proměnné  
- [ ] mít sjednocené typy a číselníky v modulu 900  
- [ ] otestovat login/logout  
- [ ] zkontrolovat změny v RLS  
- [ ] otestovat přehledy a formuláře aktivních modulů  

---

## 8. Plán rozšíření deploymentu

- dockerizace aplikace  
- možnost vlastního hostingu mimo Vercel  
- S3 compatible storage místo Supabase Storage  
- multi-environment CI pipelines  
- automatické generování PDF v Edge Functions  
- testy proti mockovanému Supabase  

---

## 9. Poznámky (uchováváme všechno)

- původní verze aplikace běžela bez CI/CD, nyní standardizujeme proces  
- plánuje se generátor dokumentů (PDF) — vyžaduje edge funkce  
- budoucí integrace s cron úlohami (např. připomenutí splatnosti nájmů)  

---

## 10. Závěr

Tento dokument definuje způsob deploymentu v současné podobě:

- Vercel jako hosting,
- Supabase jako backend a databáze,
- `.env` řízení konfigurace,
- build procesy a budoucí CI/CD.

Slouží jako referenční příručka pro provoz aplikace v různých prostředích.

