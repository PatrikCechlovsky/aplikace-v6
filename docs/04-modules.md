# /docs/04-modules.md
## Popis: Tento dokument popisuje modulární systém aplikace, strukturu modulů, jejich účel, konfiguraci a stav implementace.
---

# 04 – Modulový systém

## 1. Úvod: Proč moduly?

Aplikace Pronajímatel v6 je navržena jako **modulární systém**, kde každá funkční oblast (Subjekty, Nemovitosti, Smlouvy, Platby…) existuje jako samostatný modul.

Díky tomu:

- UI je přehledné  
- vývoj může probíhat nezávisle po částech  
- oprávnění se dají řídit na úrovni modulů  
- modul lze zapnout/vypnout  
- systém je připravený na rozšíření (budoucí moduly)

---

## 2. Struktura modulu (filesystem)

Každý modul se nachází v cestě:

    app/modules/<id>-<nazev>/

Uvnitř minimálně obsahuje:

