-- FILE: supabase/migrations/050_update_subject_type_icons.sql
-- PURPOSE: Aktualizace ikon pro typy subjektů podle jednotného návrhu
-- DATE: 2026-01-15

-- Aktualizace ikon pro typy subjektů
-- Použití konzistentních ikon pro pronajímatele i nájemníky

UPDATE subject_types SET icon = 'account' WHERE code = 'osoba';
UPDATE subject_types SET icon = 'briefcase' WHERE code = 'osvc';
UPDATE subject_types SET icon = 'office-building' WHERE code = 'firma';
UPDATE subject_types SET icon = 'groups' WHERE code = 'spolek';
UPDATE subject_types SET icon = 'bank' WHERE code = 'statni';
UPDATE subject_types SET icon = 'link' WHERE code = 'zastupce';

-- Přehled ikon:
-- osoba: 👤 (account) - jednotlivá osoba bez IČ
-- osvc: 💼 (briefcase) - živnostník
-- firma: 🏢 (office-building) - kancelářská budova
-- spolek: 👥 (groups) - skupina lidí
-- statni: 🏦 (bank) - státní instituce/úřad
-- zastupce: 🔗 (link) - propojení/zastoupení
