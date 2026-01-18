# 📊 Data – CSV, Excel a další datové soubory

Tento adresář obsahuje datové exporty, přehledy a strukturované informace z databáze.

---

## 📋 Dostupné soubory

| Soubor | Typ | Popis |
|--------|-----|-------|
| [struktura-aplikace.xlsx](struktura-aplikace.xlsx) | Excel | 📊 **Kompletní struktura aplikace**<br/>- Přehled všech modulů<br/>- Tabulky a jejich pole<br/>- Relace mezi entitami |
| [Supabase Snippet 01_prehled_vsech_poli.csv](Supabase%20Snippet%2001_prehled_vsech_poli.csv) | CSV | 🗄️ **Přehled všech polí**<br/>- Export všech tabulek z Supabase<br/>- Datové typy, constraints |
| [Supabase Snippet 02_vzorky_hodnot_vsech_poli.csv](Supabase%20Snippet%2002_vzorky_hodnot_vsech_poli.csv) | CSV | 📝 **Vzorky hodnot**<br/>- Ukázkové hodnoty z produkční databáze<br/>- Pro testování a development |

---

## 🎯 Účel tohoto adresáře

Datové soubory slouží pro:

1. **📊 Analýzu struktury** – Přehled celé aplikace v jednom místě
2. **🔍 Rychlé hledání** – Grep v CSV pro najití tabulky/sloupce
3. **📈 Reporting** – Excel pro vizualizace a prezentace
4. **🧪 Testing** – Vzorky dat pro testovací scénáře
5. **📚 Dokumentace** – Reference pro nové vývojáře

---

## 🔄 Aktualizace dat

Tyto soubory by měly být aktualizovány:

- **Po každé migraci** – Nové tabulky/sloupce
- **Po větších změnách** – Refaktoring struktury
- **Jednou za měsíc** – Pravidelný refresh vzorků

### Jak aktualizovat Supabase CSV exporty:

```sql
-- V Supabase SQL Editor spusť:
-- 1. Export všech polí
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 2. Export vzorků (upravit dle potřeby)
SELECT * FROM subjects LIMIT 5;
SELECT * FROM properties LIMIT 5;
-- atd.
```

Výsledky zkopíruj do CSV souborů.

---

## 🔗 Související dokumentace

- [06-data-model.md](../06-data-model.md) – Popis datového modelu
- [core/subject-fields.md.](../core/subject-fields.md.) – Pole v subjects tabulce
- [supabase/migrations/](../../supabase/migrations/) – SQL migrace

---

## ⚠️ Důležité poznámky

1. **Necitlivá data** – CSV obsahují pouze struktur nebo anonymizované vzorky
2. **Velikost souborů** – Velké exporty (>10MB) by měly jít do `.gitignore`
3. **Verze** – Pokud možno, verzuj CSV spolu s migrací (např. `fields_after_052.csv`)

---

## 📁 Co NEPATŘÍ do tohoto adresáře?

❌ Citlivá data (osobní údaje, credentials)  
❌ Velké binární soubory (obrázky, videa)  
❌ Dokumentace (ta jde do `docs/`)  
❌ Dočasné exporty (ty jdou do `tmp/` nebo `.gitignore`)

✅ Strukturní přehledy  
✅ Anonymizované vzorky  
✅ Schémata a ERD  
✅ Excel analýzy struktury aplikace

---

**Tip:** Pro práci s CSV v terminálu používej: `csvkit`, `xsv`, nebo `q` (SQL nad CSV).
