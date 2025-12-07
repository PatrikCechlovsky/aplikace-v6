# /docs/archive/02-architecture-notes.md
## Popis: Archiv poznámek, starých návrhů, konceptů a úvah, které souvisely s architekturou, ale nepatří do finální dokumentace.
---

# ARCHIV – Architecture Notes

Tento dokument obsahuje původní texty, úvahy a částečné koncepty, které během vývoje vznikly, ale nejsou vhodné pro finální verzi architektonického dokumentu.  
Slouží pouze jako historická reference.  
NIC Z TOHOTO OBSAHU NENÍ SMAZÁNO – je pouze přesunuto z hlavní dokumentace.

---

## 🔸 1. Původní neupravené části z PREHLED-APLIKACE.md (architektura)

- “Aplikace bude mít služby backend logiky, ale zatím nejsou vytvořeny…”
- “Moduly budou mít svoje API…”
- “RLS možná budeme řešit později…”
- “Tile systém by mohl být automatický…”

Tyto části jsou nyní přepracované a doplněné v kapitole **02 – Architecture**.

---

## 🔸 2. Staré myšlenkové mapy o podobě složek projektu

Původní návrhy:

```
/api/
/src/
/code/
```

nebo:

```
app/
shared/
core/
```

Nakonec jsme přešli na:

```
app/
  modules/
  UI/
  services/
```

---

## 🔸 3. Experimentální návrhy architektury, které nebyly použity

Například:

- složité dělení modulů na „read/write části“  
- fragmentovaný modulový systém  
- koncept “překryvných vrstev UI”  
- detailní popisy, které byly nahrazeny moderním modelem  

Nyní jsou zachovány pouze z historických důvodů.

---

## 🔸 4. Staré testovací popisy Supabase integrace

Tyto komentáře pocházely z počáteční fáze vývoje:

- ruční validace row-level filtrů  
- testovací SQL skripty  
- poznámky k deprecated API  
- úvahy o ukládání session ručně  

Vše bylo překonáno následnou architekturou.

---

## 🔸 5. Zápisy o alternativních renderovacích strategiích (React)

Například:

- využít Context API globálně pro navigaci  
- používat Redux pro správu stavu modulů  
- ukládat stav UI do localStorage  
- zkoumat možnost odděleného renderu pro každou sekci UI  

Nakonec se aplikace řídí moderním minimalistickým přístupem:

- centralizovaná modulová logika  
- čisté služby  
- minimální global state  
- stateless UI, kde je to možné  

---

## 🔸 6. Poznámky k plánovaným optimalizacím

Staré poznámky jako:

- “možná použijeme SWR globálně?”
- “optimistic update pro moduly”
- “prefetch dat na úrovni modulu”

Tyto úvahy dávají smysl do budoucna, ale nepatří do finální architektury.

---

## 🔸 7. Další kusy textu, které byly během vývoje uloženy bokem

Tato sekce obsahuje texty, které nebylo možné zařadit do konkrétní kapitoly:

### Příklad:
- komentáře o UI layoutu  
- komentáře o plánování struktury složek  
- různé testovací popisy modulů  
- staré logické poznámky  

Vše bylo uložené zde, aby se nic neztratilo.

---

# 📌 Závěr archivu

Tento dokument slouží jako stabilní místo pro všechny původní části související s architekturou, které nejsou vhodné do finální dokumentace, ale je nezbytné je uchovat.

Archivní dokumenty se nečistí, nesmí se mazat – jsou to důležité zdroje pro budoucí rekonstrukci vývoje.

