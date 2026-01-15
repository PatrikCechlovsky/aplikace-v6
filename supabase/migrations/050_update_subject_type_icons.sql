-- FILE: supabase/migrations/050_update_subject_type_icons.sql
-- PURPOSE: Aktualizace ikon pro typy subjektů podle existujících nastavení v databázi
-- DATE: 2026-01-15

-- Tyto ikony jsou již nastaveny v databázi podle CSV exportu
-- Tato migrace zajišťuje, že jsou ikony konzistentní napříč všemi moduly

-- Ikony v databázi:
-- osoba: user (👤) - jednotlivá osoba bez IČ
-- osvc: briefcase (💼) - živnostník
-- firma: office-building (🏢) - kancelářská budova
-- spolek: users (👥) - skupina lidí (spolek)
-- statni: bank (🏦) - státní instituce/úřad
-- zastupce: link (🔗) - propojení/zastoupení

-- Poznámka: Ikony jsou již v databázi správně nastaveny, 
-- tento soubor slouží jako dokumentace existujícího stavu
