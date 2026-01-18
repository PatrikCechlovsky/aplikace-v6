-- Manual fix: Nastavit is_user pro subjekty s auth_user_id
-- Tento dotaz opraví data pro stávající subjekty

-- 1. Nastavit is_user pro subjekty, které mají auth_user_id (jsou propojené s auth.users)
UPDATE public.subjects
SET is_user = true
WHERE auth_user_id IS NOT NULL AND is_user = false;

-- 2. Nastavit is_landlord=false pro subjekty, které jsou jen uživatelé (nemají pronajímatelská data)
-- Ponecháme is_landlord=true pro všechny ostatní, protože byly vytvořeny jako pronajímatelé

-- 3. Zobrazit výsledek
SELECT 
  id,
  display_name,
  subject_type,
  is_user,
  is_landlord,
  is_tenant,
  auth_user_id IS NOT NULL as has_auth_user
FROM public.subjects
ORDER BY display_name;
