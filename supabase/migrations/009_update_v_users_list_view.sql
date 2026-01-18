-- Migration: Přidat sloupec is_user do view v_users_list
-- Date: 2026-01-14
-- Purpose: Umožnit filtrování uživatelů podle příznaku is_user

-- Drop existing views (CASCADE protože v_users_invite_gate závisí na v_users_list)
DROP VIEW IF EXISTS public.v_users_invite_gate CASCADE;
DROP VIEW IF EXISTS public.v_users_list CASCADE;

-- Recreate view with is_user column
CREATE VIEW public.v_users_list AS
SELECT 
  s.id,
  s.display_name,
  s.email,
  s.phone,
  s.subject_type,
  s.is_archived,
  s.created_at,
  s.title_before,
  s.first_name,
  s.last_name,
  s.first_login_at,
  s.last_login_at,
  s.is_user,
  s.is_landlord,
  s.is_tenant,
  s.is_delegate,
  sr.role_code,
  (SELECT sent_at FROM public.subject_invites WHERE subject_id = s.id ORDER BY sent_at DESC LIMIT 1) as last_invite_sent_at,
  (SELECT expires_at FROM public.subject_invites WHERE subject_id = s.id ORDER BY sent_at DESC LIMIT 1) as last_invite_expires_at,
  (SELECT status FROM public.subject_invites WHERE subject_id = s.id ORDER BY sent_at DESC LIMIT 1) as last_invite_status
FROM public.subjects s
LEFT JOIN public.subject_roles sr ON s.id = sr.subject_id;

-- Grant select permissions
GRANT SELECT ON public.v_users_list TO authenticated;

-- Recreate dependent view v_users_invite_gate
CREATE VIEW public.v_users_invite_gate AS
SELECT 
  u.*,
  CASE
    WHEN u.last_invite_status = 'pending' AND u.last_invite_expires_at > NOW() THEN true
    ELSE false
  END as has_pending_invite
FROM public.v_users_list u;

-- Grant select permissions
GRANT SELECT ON public.v_users_invite_gate TO authenticated;
