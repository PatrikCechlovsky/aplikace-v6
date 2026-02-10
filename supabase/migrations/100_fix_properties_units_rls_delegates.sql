-- FILE: supabase/migrations/100_fix_properties_units_rls_delegates.sql
-- PURPOSE: Allow properties/units access for delegated users (subject_delegates)
-- DATE: 2026-02-10

-- =========================
-- PROPERTIES
-- =========================
DROP POLICY IF EXISTS "properties_landlord_select" ON public.properties;
DROP POLICY IF EXISTS "properties_landlord_insert" ON public.properties;
DROP POLICY IF EXISTS "properties_landlord_update" ON public.properties;
DROP POLICY IF EXISTS "properties_landlord_delete" ON public.properties;

CREATE POLICY "properties_landlord_select"
  ON public.properties
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.subjects s
      WHERE s.id = properties.landlord_id
      AND (
        (s.auth_user_id IS NOT NULL AND s.auth_user_id = auth.uid())
        OR (
          s.email IS NOT NULL
          AND s.email = COALESCE((auth.jwt() ->> 'email'), '')
          AND COALESCE((auth.jwt() ->> 'email'), '') != ''
        )
        OR EXISTS (
          SELECT 1
          FROM public.subject_delegates sd
          JOIN public.subjects u ON u.id = sd.delegate_subject_id
          WHERE sd.subject_id = s.id
          AND (
            (u.auth_user_id IS NOT NULL AND u.auth_user_id = auth.uid())
            OR (
              u.email IS NOT NULL
              AND u.email = COALESCE((auth.jwt() ->> 'email'), '')
              AND COALESCE((auth.jwt() ->> 'email'), '') != ''
            )
          )
        )
      )
    )
  );

CREATE POLICY "properties_landlord_insert"
  ON public.properties
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.subjects s
      WHERE s.id = landlord_id
      AND (
        (s.auth_user_id IS NOT NULL AND s.auth_user_id = auth.uid())
        OR (
          s.email IS NOT NULL
          AND s.email = COALESCE((auth.jwt() ->> 'email'), '')
          AND COALESCE((auth.jwt() ->> 'email'), '') != ''
        )
        OR EXISTS (
          SELECT 1
          FROM public.subject_delegates sd
          JOIN public.subjects u ON u.id = sd.delegate_subject_id
          WHERE sd.subject_id = s.id
          AND (
            (u.auth_user_id IS NOT NULL AND u.auth_user_id = auth.uid())
            OR (
              u.email IS NOT NULL
              AND u.email = COALESCE((auth.jwt() ->> 'email'), '')
              AND COALESCE((auth.jwt() ->> 'email'), '') != ''
            )
          )
        )
      )
    )
  );

CREATE POLICY "properties_landlord_update"
  ON public.properties
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.subjects s
      WHERE s.id = properties.landlord_id
      AND (
        (s.auth_user_id IS NOT NULL AND s.auth_user_id = auth.uid())
        OR (
          s.email IS NOT NULL
          AND s.email = COALESCE((auth.jwt() ->> 'email'), '')
          AND COALESCE((auth.jwt() ->> 'email'), '') != ''
        )
        OR EXISTS (
          SELECT 1
          FROM public.subject_delegates sd
          JOIN public.subjects u ON u.id = sd.delegate_subject_id
          WHERE sd.subject_id = s.id
          AND (
            (u.auth_user_id IS NOT NULL AND u.auth_user_id = auth.uid())
            OR (
              u.email IS NOT NULL
              AND u.email = COALESCE((auth.jwt() ->> 'email'), '')
              AND COALESCE((auth.jwt() ->> 'email'), '') != ''
            )
          )
        )
      )
    )
  );

CREATE POLICY "properties_landlord_delete"
  ON public.properties
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.subjects s
      WHERE s.id = properties.landlord_id
      AND (
        (s.auth_user_id IS NOT NULL AND s.auth_user_id = auth.uid())
        OR (
          s.email IS NOT NULL
          AND s.email = COALESCE((auth.jwt() ->> 'email'), '')
          AND COALESCE((auth.jwt() ->> 'email'), '') != ''
        )
        OR EXISTS (
          SELECT 1
          FROM public.subject_delegates sd
          JOIN public.subjects u ON u.id = sd.delegate_subject_id
          WHERE sd.subject_id = s.id
          AND (
            (u.auth_user_id IS NOT NULL AND u.auth_user_id = auth.uid())
            OR (
              u.email IS NOT NULL
              AND u.email = COALESCE((auth.jwt() ->> 'email'), '')
              AND COALESCE((auth.jwt() ->> 'email'), '') != ''
            )
          )
        )
      )
    )
  );

-- =========================
-- UNITS
-- =========================
DROP POLICY IF EXISTS "units_landlord_select" ON public.units;
DROP POLICY IF EXISTS "units_landlord_insert" ON public.units;
DROP POLICY IF EXISTS "units_landlord_update" ON public.units;
DROP POLICY IF EXISTS "units_landlord_delete" ON public.units;

CREATE POLICY "units_landlord_select"
  ON public.units
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.properties p
      JOIN public.subjects s ON s.id = p.landlord_id
      WHERE p.id = units.property_id
      AND (
        (s.auth_user_id IS NOT NULL AND s.auth_user_id = auth.uid())
        OR (
          s.email IS NOT NULL
          AND s.email = COALESCE((auth.jwt() ->> 'email'), '')
          AND COALESCE((auth.jwt() ->> 'email'), '') != ''
        )
        OR EXISTS (
          SELECT 1
          FROM public.subject_delegates sd
          JOIN public.subjects u ON u.id = sd.delegate_subject_id
          WHERE sd.subject_id = s.id
          AND (
            (u.auth_user_id IS NOT NULL AND u.auth_user_id = auth.uid())
            OR (
              u.email IS NOT NULL
              AND u.email = COALESCE((auth.jwt() ->> 'email'), '')
              AND COALESCE((auth.jwt() ->> 'email'), '') != ''
            )
          )
        )
      )
    )
  );

CREATE POLICY "units_landlord_insert"
  ON public.units
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.properties p
      JOIN public.subjects s ON s.id = p.landlord_id
      WHERE p.id = property_id
      AND (
        (s.auth_user_id IS NOT NULL AND s.auth_user_id = auth.uid())
        OR (
          s.email IS NOT NULL
          AND s.email = COALESCE((auth.jwt() ->> 'email'), '')
          AND COALESCE((auth.jwt() ->> 'email'), '') != ''
        )
        OR EXISTS (
          SELECT 1
          FROM public.subject_delegates sd
          JOIN public.subjects u ON u.id = sd.delegate_subject_id
          WHERE sd.subject_id = s.id
          AND (
            (u.auth_user_id IS NOT NULL AND u.auth_user_id = auth.uid())
            OR (
              u.email IS NOT NULL
              AND u.email = COALESCE((auth.jwt() ->> 'email'), '')
              AND COALESCE((auth.jwt() ->> 'email'), '') != ''
            )
          )
        )
      )
    )
  );

CREATE POLICY "units_landlord_update"
  ON public.units
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.properties p
      JOIN public.subjects s ON s.id = p.landlord_id
      WHERE p.id = units.property_id
      AND (
        (s.auth_user_id IS NOT NULL AND s.auth_user_id = auth.uid())
        OR (
          s.email IS NOT NULL
          AND s.email = COALESCE((auth.jwt() ->> 'email'), '')
          AND COALESCE((auth.jwt() ->> 'email'), '') != ''
        )
        OR EXISTS (
          SELECT 1
          FROM public.subject_delegates sd
          JOIN public.subjects u ON u.id = sd.delegate_subject_id
          WHERE sd.subject_id = s.id
          AND (
            (u.auth_user_id IS NOT NULL AND u.auth_user_id = auth.uid())
            OR (
              u.email IS NOT NULL
              AND u.email = COALESCE((auth.jwt() ->> 'email'), '')
              AND COALESCE((auth.jwt() ->> 'email'), '') != ''
            )
          )
        )
      )
    )
  );

CREATE POLICY "units_landlord_delete"
  ON public.units
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.properties p
      JOIN public.subjects s ON s.id = p.landlord_id
      WHERE p.id = units.property_id
      AND (
        (s.auth_user_id IS NOT NULL AND s.auth_user_id = auth.uid())
        OR (
          s.email IS NOT NULL
          AND s.email = COALESCE((auth.jwt() ->> 'email'), '')
          AND COALESCE((auth.jwt() ->> 'email'), '') != ''
        )
        OR EXISTS (
          SELECT 1
          FROM public.subject_delegates sd
          JOIN public.subjects u ON u.id = sd.delegate_subject_id
          WHERE sd.subject_id = s.id
          AND (
            (u.auth_user_id IS NOT NULL AND u.auth_user_id = auth.uid())
            OR (
              u.email IS NOT NULL
              AND u.email = COALESCE((auth.jwt() ->> 'email'), '')
              AND COALESCE((auth.jwt() ->> 'email'), '') != ''
            )
          )
        )
      )
    )
  );

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 100 complete: properties + units RLS updated for delegates.';
END $$;
