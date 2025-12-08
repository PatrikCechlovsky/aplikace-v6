# /docs/07-deployment.md
## Popis: Detailní návrh deploymentu aplikace Pronajímatel v6 – prostředí, build, Vercel, Supabase, CI/CD, secrets a release checklist.
---

# 07 – Deployment

---

## 1. Cíl a kontext

Tento dokument popisuje, jak nasazovat aplikaci Pronajímatel v6:

- jaká prostředí používáme (DEV / STAGE / PROD),
- jak probíhá build a nasazení Next.js aplikace,
- jak nasazujeme změny v Supabase (DB, RLS),
- jaké používáme secrets a env proměnné,
- jak by měla vypadat CI/CD pipeline,
- jak kontrolovat release před nasazením na produkci.

---

## 2. Prostředí

Doporučený model prostředí:

| Prostředí | Popis | URL (příklad) |
|-----------|--------|----------------|
| **DEV**   | Lokální vývoj | http://localhost:3000 |
| **STAGE** | Preview prostředí (Vercel preview) | https://aplikace-v6-git-feature.vercel.app |
| **PROD**  | Produkční provoz | https://app.pronajimatel.cz |

### DEV (lokální)
- `npm run dev`
- používá jen vývojové env proměnné
- databáze DEV

### STAGE (preview)
- automaticky pro každou branch
- testování před merge
- může mít vlastní Supabase STAGE projekt

### PROD
- hlavní produkční deployment
- přísná pravidla pro RLS, migrace i secrets

---

## 3. Workflow nasazení

1. Vývoj → commit → push.
2. Vercel vytvoří **preview**.
3. Po schválení merge do `main`.
4. Vercel vytvoří **production build**.
5. Supabase migrace se aplikují ručně nebo CI skriptem.
6. Release se ověří podle checklistu.

---

## 4. Build Next.js 14

### Build příkazy

Lokálně:
```bash
npm install
npm run build
npm run start
```

Na Vercelu:
- Build command: `npm run build`
- Output: `.next`

### Nutné env proměnné:

- NEXT_PUBLIC_SUPABASE_URL  
- NEXT_PUBLIC_SUPABASE_ANON_KEY  
- SUPABASE_SERVICE_ROLE_KEY *(jen server)*  
- APP_BASE_URL  
- SENTRY_DSN *(pokud používáme monitoring)*

### Typické chyby:

- chybějící env → build error  
- TS error → build neproběhne  
- špatný import cesty  

Řešení:  
před commitem spustit:

```
npm run build
```

---

## 5. Vercel Deployment

### Preview deploymenty (*pro každou branch*)

Vercel vytvoří URL:

```
https://aplikace-v6-git-feature-xyz.vercel.app
```

Slouží pro testování UI, zátěže i bezpečnosti.

### Production deployment

- trigger: push do `main`
- nasazení na hlavní doménu
- používá PROD env proměnné

### Doporučení

- nikdy necommitovat `.env.local`
- vždy mít zvlášť DEV / STAGE / PROD proměnné

---

## 6. Supabase Deployment

### Schéma a migrace

Supabase spravuje:

- tabulky  
- RLS politiky  
- funkce  
- views  

### Doporučený postup:

1. Úprava DB v DEV projektu.
2. Export SQL skriptu změny.
3. Uložit do repa → `/supabase/migrations/`.
4. Otestovat na DEV.
5. Spustit ručně na PROD.

### Struktura:

```
/supabase/
  migrations/
    001-init.sql
    002-add-roles.sql
    003-add-meters.sql
  seeds/
    dev_seed.sql
```

### RLS zásady:

- nikdy nenasazovat na PROD bez otestování  
- testovat SELECT/INSERT/UPDATE/DELETE pro různé role  
- ověřit, že owner_id / created_by jsou správně nastavené  

---

## 7. CI/CD pipeline (GitHub Actions)

Základní workflow pro kontrolu:

```
.github/workflows/ci.yml
```

### Příklad:

```yaml
name: CI

on:
  push:
    branches: [ main, develop, feature/** ]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install deps
        run: npm install

      - name: Lint & typecheck
        run: |
          npm run lint --if-present
          npm run typecheck --if-present

      - name: Build
        run: npm run build
```

---

## 8. Environment & Secrets Management

### Kde mají být secrets?

| Platforma | Typ secrets | K čemu slouží |
|-----------|-------------|----------------|
| **Vercel** | runtime env proměnné | přístup k Supabase, Sentry, API |
| **GitHub Secrets** | CI pipeline | build/test/migrace |
| **Lokální `.env.local`** | vývoj | nikdy necommitovat |

### Pravidla:

- žádné hesla v repozitáři  
- `.env.local` ignorovat pomocí `.gitignore`  
- SERVICE_ROLE_KEY nikdy nesmí jít na frontend  

---

## 9. Monitoring a logování

### Logging
- Vercel Logs – chyby buildu a runtime
- Supabase Logs – DB dotazy, RLS chyby

### Error monitoring (doporučeno)
Použití:

- **Sentry**  
  - JS chyby na frontendu  
  - serverové chyby  
  - výkon (slow transactions)  

---

## 10. Release checklist

Před nasazením nové verze:

### Kód
- [ ] Build lokálně proběhl (`npm run build`)
- [ ] CI prošlo (lint, typecheck, build)
- [ ] Kód v `main` je čistý

### UI
- [ ] Otestováno na preview
- [ ] Přihlášení funguje
- [ ] Sidebar se načítá
- [ ] Žádné error hlášky v konzoli

### Supabase
- [ ] Migrace otestována na DEV
- [ ] SQL připravené a schválené
- [ ] RLS chování ověřeno

### Vercel
- [ ] ENV proměnné jsou nastavené
- [ ] Doména správně směřuje na production deployment

---

## 11. Budoucí rozšíření deploymentu

- automatické migrace (CI → Supabase)
- Docker verze aplikace
- Kubernetes orchestrace
- canary deployment pro postupné nasazení
- automatizovaný rollback
- audit log nasazení

---

## 12. Závěr

Deployment architektura Pronajímatel v6 je postavena na:

- Next.js + Vercel  
- Supabase (DB + Auth + RLS)  
- GitHub Actions  

Tento dokument definuje **stabilní, bezpečný a opakovatelný** proces nasazení.


---

## 🟧 07B – historické části (teď skoro prázdné, ale připravené)

Dokument 07 byl doteď prázdný, takže nemáme reálné staré texty, ale chci dodržet tvůj systém: mít v každém dokumentu místo pro staré verze.

Vlož tohle **na konec `/docs/07-deployment.md`**:

```markdown
---

# 📜 Historické části dokumentu – DEPLOYMENT  
*(zatím prázdné, připravené pro budoucí staré verze – NESMAZAT)*

_Pro tento dokument zatím neexistují starší použitelné texty.  
Až budeš mít první verzi, kterou nahradíme novější, starou sem přesuneme a označíme jako ~~zastaralou~~._

```

