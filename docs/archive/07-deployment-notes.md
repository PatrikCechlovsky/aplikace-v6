🟨 07C – archivní soubor /docs/archive/07-deployment-notes.md
# /docs/archive/07-deployment-notes.md
## Popis: Archiv poznámek, nápadů a alternativních návrhů k deploymentu a infrastruktuře.
---

# ARCHIV – Deployment (poznámky a koncepty)

Tento archiv slouží k ukládání všech volných poznámek, úvah a konceptů, které se týkají nasazení, ale nepatří přímo do hlavního dokumentu 07 – Deployment.

NIC se nesmí mazat, pouze přidávat.

---

## 🔸 1. Možné budoucí varianty infrastruktury

- Nasadit aplikaci místo na Vercel na vlastní VPS (Docker + nginx).
- Použít Railway / Fly.io / render.com.
- Použít Kubernetes cluster, pokud bude aplikace velmi růst.
- Rozdělit frontend a backend (Next.js + samostatné API).

---

## 🔸 2. Alternativní CI/CD nástroje

- GitLab CI místo GitHub Actions.
- CircleCI, Travis CI, Jenkins.
- “No-CI” varianta: ruční build a deploy Artefaktu na server.

---

## 🔸 3. Poznámky k vývoji

Zde mohou být ukládány třeba tyto typy poznámek:

- “Na Vercelu mi to padalo kvůli chybějící env proměnné…”
- “Supabase měla jiné URL mezi DEV a PROD, musel jsem to přepsat.”
- “Build selhal kvůli chybějícímu exportu komponenty v AppShell.tsx.”

---

## 🔸 4. Úvahy o rollbacku

- Možnost ručně přepnout Vercel na předchozí deployment.
- Možnost mít skripty pro rollback Supabase migrací.
- Možnost držet “backup” databáze před velkým nasazením.

---

## 🔸 5. Budoucí integrace s monitoringem

- Sentry / LogRocket / Datadog.
- Vlastní audit logování do Supabase tabulek.

---

# 📌 Závěr

Tento archiv se používá jako “odkladiště” všech technických poznámek k deploymentu, které by jinak skončily v chatu, v hlavě nebo v náhodném TODO.
