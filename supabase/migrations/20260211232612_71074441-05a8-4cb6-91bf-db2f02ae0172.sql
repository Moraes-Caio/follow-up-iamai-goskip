
-- =============================================
-- STEP 1: Add new columns to profiles
-- =============================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS nome_clinica text DEFAULT 'Minha Clínica',
  ADD COLUMN IF NOT EXISTS nome_responsavel text DEFAULT '',
  ADD COLUMN IF NOT EXISTS telefone text DEFAULT '',
  ADD COLUMN IF NOT EXISTS uazapi_server text,
  ADD COLUMN IF NOT EXISTS uazapi_token text,
  ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true NOT NULL;

-- =============================================
-- STEP 2: Update handle_new_user trigger
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, nome_responsavel, nome_clinica)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'clinic_name', 'Minha Clínica')
  );
  RETURN NEW;
END;
$$;

-- =============================================
-- STEP 3: Add profile_id to all data tables
-- =============================================
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS lembrete_enviado boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS lembrete_mensagem text,
  ADD COLUMN IF NOT EXISTS lembrete_enviado_em timestamptz;

ALTER TABLE public.procedures
  ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.reminder_templates
  ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.periodic_returns
  ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS webhook_id text;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.custom_roles
  ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.clinic_settings
  ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

-- =============================================
-- STEP 4: Drop ALL old RLS policies
-- =============================================
-- patients
DROP POLICY IF EXISTS "Admins can delete patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated can insert patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated can update patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated can view patients" ON public.patients;

-- appointments
DROP POLICY IF EXISTS "Admins can delete appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated can insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated can view appointments" ON public.appointments;

-- procedures
DROP POLICY IF EXISTS "Admins can manage procedures" ON public.procedures;
DROP POLICY IF EXISTS "Authenticated can view procedures" ON public.procedures;

-- reminder_templates
DROP POLICY IF EXISTS "Admins can manage templates" ON public.reminder_templates;
DROP POLICY IF EXISTS "Authenticated can view templates" ON public.reminder_templates;

-- periodic_returns
DROP POLICY IF EXISTS "Authenticated can manage returns" ON public.periodic_returns;
DROP POLICY IF EXISTS "Authenticated can view returns" ON public.periodic_returns;

-- messages
DROP POLICY IF EXISTS "Authenticated can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated can view messages" ON public.messages;

-- notifications
DROP POLICY IF EXISTS "Authenticated can manage notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated can view notifications" ON public.notifications;

-- team_members
DROP POLICY IF EXISTS "Admins can manage team" ON public.team_members;
DROP POLICY IF EXISTS "Authenticated can view team" ON public.team_members;

-- custom_roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.custom_roles;
DROP POLICY IF EXISTS "Authenticated can view roles" ON public.custom_roles;

-- clinic_settings
DROP POLICY IF EXISTS "Admins can update settings" ON public.clinic_settings;
DROP POLICY IF EXISTS "Authenticated can view settings" ON public.clinic_settings;

-- =============================================
-- STEP 5: Create new RLS policies (profile_id based)
-- =============================================

-- patients
CREATE POLICY "users_select_own" ON public.patients FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "users_insert_own" ON public.patients FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "users_update_own" ON public.patients FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "users_delete_own" ON public.patients FOR DELETE USING (profile_id = auth.uid());

-- appointments
CREATE POLICY "users_select_own" ON public.appointments FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "users_insert_own" ON public.appointments FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "users_update_own" ON public.appointments FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "users_delete_own" ON public.appointments FOR DELETE USING (profile_id = auth.uid());

-- procedures
CREATE POLICY "users_select_own" ON public.procedures FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "users_insert_own" ON public.procedures FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "users_update_own" ON public.procedures FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "users_delete_own" ON public.procedures FOR DELETE USING (profile_id = auth.uid());

-- reminder_templates
CREATE POLICY "users_select_own" ON public.reminder_templates FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "users_insert_own" ON public.reminder_templates FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "users_update_own" ON public.reminder_templates FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "users_delete_own" ON public.reminder_templates FOR DELETE USING (profile_id = auth.uid());

-- periodic_returns
CREATE POLICY "users_select_own" ON public.periodic_returns FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "users_insert_own" ON public.periodic_returns FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "users_update_own" ON public.periodic_returns FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "users_delete_own" ON public.periodic_returns FOR DELETE USING (profile_id = auth.uid());

-- messages
CREATE POLICY "users_select_own" ON public.messages FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "users_insert_own" ON public.messages FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "users_update_own" ON public.messages FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "users_delete_own" ON public.messages FOR DELETE USING (profile_id = auth.uid());

-- notifications
CREATE POLICY "users_select_own" ON public.notifications FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "users_insert_own" ON public.notifications FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "users_update_own" ON public.notifications FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "users_delete_own" ON public.notifications FOR DELETE USING (profile_id = auth.uid());

-- team_members
CREATE POLICY "users_select_own" ON public.team_members FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "users_insert_own" ON public.team_members FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "users_update_own" ON public.team_members FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "users_delete_own" ON public.team_members FOR DELETE USING (profile_id = auth.uid());

-- custom_roles
CREATE POLICY "users_select_own" ON public.custom_roles FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "users_insert_own" ON public.custom_roles FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "users_update_own" ON public.custom_roles FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "users_delete_own" ON public.custom_roles FOR DELETE USING (profile_id = auth.uid());

-- clinic_settings
CREATE POLICY "users_select_own" ON public.clinic_settings FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "users_insert_own" ON public.clinic_settings FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "users_update_own" ON public.clinic_settings FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "users_delete_own" ON public.clinic_settings FOR DELETE USING (profile_id = auth.uid());

-- =============================================
-- STEP 6: Create indices for n8n performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_appointments_profile ON public.appointments(profile_id);
CREATE INDEX IF NOT EXISTS idx_appointments_data ON public.appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_lembrete ON public.appointments(lembrete_enviado, date)
  WHERE lembrete_enviado = FALSE AND status = 'pending';
CREATE INDEX IF NOT EXISTS idx_patients_profile ON public.patients(profile_id);

-- =============================================
-- STEP 7: Drop orphaned functions
-- =============================================
DROP FUNCTION IF EXISTS public.fn_calc_idade() CASCADE;
DROP FUNCTION IF EXISTS public.set_data_apos_6_meses() CASCADE;
