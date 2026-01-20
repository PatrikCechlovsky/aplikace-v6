# Migrace 069: UI View Preferences

## ⚠️ Důležité - Tato migrace musí být spuštěna ručně!

Migrace `069_create_ui_view_prefs.sql` vytváří tabulku pro uložení uživatelských preferencí (šířky sloupců, řazení, skryté sloupce v ListView).

## Jak spustit migraci v Supabase Dashboard:

### Krok 1: Otevři Supabase Dashboard
1. Jdi na https://supabase.com/dashboard
2. Vyber projekt `aplikace-v6`
3. Klikni na **SQL Editor** v levém menu

### Krok 2: Zkopíruj SQL obsah
1. Otevři soubor `069_create_ui_view_prefs.sql`
2. Zkopíruj celý obsah (všechny řádky)

### Krok 3: Spusť SQL v editoru
1. V SQL Editoru klikni na **New query**
2. Vlož zkopírovaný SQL
3. Klikni na **Run** (nebo Ctrl+Enter / Cmd+Enter)

### Krok 4: Ověř, že migrace proběhla
```sql
-- Spusť v SQL Editoru:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'ui_view_prefs';
```

Měl bys vidět jeden řádek s `ui_view_prefs`.

## Co tabulka dělá

- **Ukládá** preference uživatelů pro každý ListView v aplikaci
- **RLS políčky** zajišťují, že každý uživatel vidí pouze své vlastní preferences
- **Fallback** do localStorage funguje i bez této tabulky

## Troubleshooting

### Chyba "relation already exists"
Tabulka už existuje - vše je v pořádku, migrace už proběhla.

### Chyba "permission denied"
Použij admin účet nebo správný database connection string s superuser právy.

### Chyba 400 v browser console
```
Failed to load resource: the server responded with a status of 400
/rest/v1/ui_view_prefs
```

To znamená, že tabulka ještě neexistuje. Postupuj podle kroků výše.

## Po spuštění migrace

1. **Refresh aplikace** v browseru
2. Chyby 400 zmizí
3. Preferences budou uložené v DB místo pouze v localStorage
4. Funguje synchronizace mezi zařízeními (stejný uživatel = stejné preferences)
