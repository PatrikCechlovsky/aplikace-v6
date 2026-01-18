-- FILE: supabase/migrations/050_update_subject_type_icons.sql
-- PURPOSE: Aktualizace ikon pro typy subjektů - oprava chybějících ikon pro státní a zástupce
-- DATE: 2026-01-15

-- Aktualizace ikon pro všechny typy subjektů podle existujícího mapování v icons.ts
UPDATE subject_types SET icon = 'user' WHERE code = 'osoba';
UPDATE subject_types SET icon = 'briefcase' WHERE code = 'osvc';
UPDATE subject_types SET icon = 'office-building' WHERE code = 'firma';
UPDATE subject_types SET icon = 'users' WHERE code = 'spolek';
UPDATE subject_types SET icon = 'bank' WHERE code = 'statni';
UPDATE subject_types SET icon = 'link' WHERE code = 'zastupce';

-- Přehled ikon podle icons.ts:
-- osoba: 👤 (user) - jednotlivá osoba bez IČ
-- osvc: 💼 (briefcase) - živnostník
-- firma: 🏬 (office-building) - kancelářská budova
-- spolek: 👥 (users) - skupina lidí (spolek/SVJ)
-- statni: 🏦 (bank) - státní instituce/úřad
-- zastupce: 🔗 (link) - propojení/zastoupení
