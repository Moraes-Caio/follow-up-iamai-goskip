
-- =============================================
-- WORKSPACE SYSTEM: Tables, Functions, RLS
-- =============================================

-- 1. Update handle_new_team_owner to set user_id = profile owner
CREATE OR REPLACE FUNCTION public.handle_new_team_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.team_members (profile_id, full_name, email, role_id, is_owner, is_active, user_id)
  VALUES (NEW.id, NEW.full_name, COALESCE(NEW.email, ''), 'admin', true, true, NEW.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;

-- 2. Fix existing owner records to have user_id set
UPDATE public.team_members SET user_id = profile_id WHERE is_owner = true AND user_id IS NULL;

-- 3. Index for fast workspace lookup by user_id
CREATE INDEX IF NOT EXISTS idx_team_members_user_id_active ON public.team_members(user_id) WHERE is_active = true;

-- 4. Security definer function: returns workspace owner's profile_id for current user
CREATE OR REPLACE FUNCTION public.get_workspace_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT profile_id FROM public.team_members WHERE user_id = auth.uid() AND is_active = true LIMIT 1),
    auth.uid()
  );
$$;

-- 5. Create workspace_invitations table
CREATE TABLE IF NOT EXISTS public.workspace_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  email text NOT NULL,
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  role_id text NOT NULL DEFAULT 'receptionist',
  status text NOT NULL DEFAULT 'pending',
  invited_by uuid NOT NULL,
  invited_by_name text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  accepted_by uuid
);

ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_select" ON public.workspace_invitations FOR SELECT USING (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_insert" ON public.workspace_invitations FOR INSERT WITH CHECK (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_update" ON public.workspace_invitations FOR UPDATE USING (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_delete" ON public.workspace_invitations FOR DELETE USING (profile_id = public.get_workspace_id());

-- 6. Update RLS on ALL data tables: profile_id = auth.uid() → profile_id = get_workspace_id()

-- patients
DROP POLICY IF EXISTS "users_select_own" ON public.patients;
DROP POLICY IF EXISTS "users_insert_own" ON public.patients;
DROP POLICY IF EXISTS "users_update_own" ON public.patients;
DROP POLICY IF EXISTS "users_delete_own" ON public.patients;
CREATE POLICY "workspace_select" ON public.patients FOR SELECT USING (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_insert" ON public.patients FOR INSERT WITH CHECK (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_update" ON public.patients FOR UPDATE USING (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_delete" ON public.patients FOR DELETE USING (profile_id = public.get_workspace_id());

-- appointments
DROP POLICY IF EXISTS "users_select_own" ON public.appointments;
DROP POLICY IF EXISTS "users_insert_own" ON public.appointments;
DROP POLICY IF EXISTS "users_update_own" ON public.appointments;
DROP POLICY IF EXISTS "users_delete_own" ON public.appointments;
CREATE POLICY "workspace_select" ON public.appointments FOR SELECT USING (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_insert" ON public.appointments FOR INSERT WITH CHECK (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_update" ON public.appointments FOR UPDATE USING (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_delete" ON public.appointments FOR DELETE USING (profile_id = public.get_workspace_id());

-- messages
DROP POLICY IF EXISTS "users_select_own" ON public.messages;
DROP POLICY IF EXISTS "users_insert_own" ON public.messages;
DROP POLICY IF EXISTS "users_update_own" ON public.messages;
DROP POLICY IF EXISTS "users_delete_own" ON public.messages;
CREATE POLICY "workspace_select" ON public.messages FOR SELECT USING (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_insert" ON public.messages FOR INSERT WITH CHECK (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_update" ON public.messages FOR UPDATE USING (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_delete" ON public.messages FOR DELETE USING (profile_id = public.get_workspace_id());

-- team_members
DROP POLICY IF EXISTS "users_select_own" ON public.team_members;
DROP POLICY IF EXISTS "users_insert_own" ON public.team_members;
DROP POLICY IF EXISTS "users_update_own" ON public.team_members;
DROP POLICY IF EXISTS "users_delete_own" ON public.team_members;
CREATE POLICY "workspace_select" ON public.team_members FOR SELECT USING (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_insert" ON public.team_members FOR INSERT WITH CHECK (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_update" ON public.team_members FOR UPDATE USING (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_delete" ON public.team_members FOR DELETE USING (profile_id = public.get_workspace_id());

-- custom_roles
DROP POLICY IF EXISTS "users_select_own" ON public.custom_roles;
DROP POLICY IF EXISTS "users_insert_own" ON public.custom_roles;
DROP POLICY IF EXISTS "users_update_own" ON public.custom_roles;
DROP POLICY IF EXISTS "users_delete_own" ON public.custom_roles;
CREATE POLICY "workspace_select" ON public.custom_roles FOR SELECT USING (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_insert" ON public.custom_roles FOR INSERT WITH CHECK (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_update" ON public.custom_roles FOR UPDATE USING (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_delete" ON public.custom_roles FOR DELETE USING (profile_id = public.get_workspace_id());

-- procedures
DROP POLICY IF EXISTS "users_select_own" ON public.procedures;
DROP POLICY IF EXISTS "users_insert_own" ON public.procedures;
DROP POLICY IF EXISTS "users_update_own" ON public.procedures;
DROP POLICY IF EXISTS "users_delete_own" ON public.procedures;
CREATE POLICY "workspace_select" ON public.procedures FOR SELECT USING (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_insert" ON public.procedures FOR INSERT WITH CHECK (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_update" ON public.procedures FOR UPDATE USING (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_delete" ON public.procedures FOR DELETE USING (profile_id = public.get_workspace_id());

-- reminder_templates
DROP POLICY IF EXISTS "users_select_own" ON public.reminder_templates;
DROP POLICY IF EXISTS "users_insert_own" ON public.reminder_templates;
DROP POLICY IF EXISTS "users_update_own" ON public.reminder_templates;
DROP POLICY IF EXISTS "users_delete_own" ON public.reminder_templates;
CREATE POLICY "workspace_select" ON public.reminder_templates FOR SELECT USING (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_insert" ON public.reminder_templates FOR INSERT WITH CHECK (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_update" ON public.reminder_templates FOR UPDATE USING (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_delete" ON public.reminder_templates FOR DELETE USING (profile_id = public.get_workspace_id());

-- patient_returns
DROP POLICY IF EXISTS "users_select_own" ON public.patient_returns;
DROP POLICY IF EXISTS "users_insert_own" ON public.patient_returns;
DROP POLICY IF EXISTS "users_update_own" ON public.patient_returns;
DROP POLICY IF EXISTS "users_delete_own" ON public.patient_returns;
CREATE POLICY "workspace_select" ON public.patient_returns FOR SELECT USING (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_insert" ON public.patient_returns FOR INSERT WITH CHECK (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_update" ON public.patient_returns FOR UPDATE USING (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_delete" ON public.patient_returns FOR DELETE USING (profile_id = public.get_workspace_id());

-- notifications
DROP POLICY IF EXISTS "users_select_own" ON public.notifications;
DROP POLICY IF EXISTS "users_insert_own" ON public.notifications;
DROP POLICY IF EXISTS "users_update_own" ON public.notifications;
DROP POLICY IF EXISTS "users_delete_own" ON public.notifications;
CREATE POLICY "workspace_select" ON public.notifications FOR SELECT USING (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_insert" ON public.notifications FOR INSERT WITH CHECK (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_update" ON public.notifications FOR UPDATE USING (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_delete" ON public.notifications FOR DELETE USING (profile_id = public.get_workspace_id());

-- clinic_settings
DROP POLICY IF EXISTS "users_select_own" ON public.clinic_settings;
DROP POLICY IF EXISTS "users_insert_own" ON public.clinic_settings;
DROP POLICY IF EXISTS "users_update_own" ON public.clinic_settings;
DROP POLICY IF EXISTS "users_delete_own" ON public.clinic_settings;
CREATE POLICY "workspace_select" ON public.clinic_settings FOR SELECT USING (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_insert" ON public.clinic_settings FOR INSERT WITH CHECK (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_update" ON public.clinic_settings FOR UPDATE USING (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_delete" ON public.clinic_settings FOR DELETE USING (profile_id = public.get_workspace_id());

-- ai_requests
DROP POLICY IF EXISTS "users_select_own" ON public.ai_requests;
DROP POLICY IF EXISTS "users_insert_own" ON public.ai_requests;
DROP POLICY IF EXISTS "users_update_own" ON public.ai_requests;
DROP POLICY IF EXISTS "users_delete_own" ON public.ai_requests;
DROP POLICY IF EXISTS "service_role_update" ON public.ai_requests;
CREATE POLICY "workspace_select" ON public.ai_requests FOR SELECT USING (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_insert" ON public.ai_requests FOR INSERT WITH CHECK (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_update" ON public.ai_requests FOR UPDATE USING (profile_id = public.get_workspace_id());
CREATE POLICY "workspace_delete" ON public.ai_requests FOR DELETE USING (profile_id = public.get_workspace_id());

-- 7. Update profiles RLS: allow workspace members to view owner's profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own or workspace profile" ON public.profiles
FOR SELECT USING (id = auth.uid() OR id = public.get_workspace_id());
