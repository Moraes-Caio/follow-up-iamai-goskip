
-- Tabela clinic_hours: horários por dia da semana
CREATE TABLE public.clinic_hours (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_open boolean NOT NULL DEFAULT true,
  open_time text NOT NULL DEFAULT '08:00',
  close_time text NOT NULL DEFAULT '18:00',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(profile_id, day_of_week)
);

ALTER TABLE public.clinic_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_select" ON public.clinic_hours FOR SELECT USING (profile_id = get_workspace_id());
CREATE POLICY "workspace_insert" ON public.clinic_hours FOR INSERT WITH CHECK (profile_id = get_workspace_id());
CREATE POLICY "workspace_update" ON public.clinic_hours FOR UPDATE USING (profile_id = get_workspace_id());
CREATE POLICY "workspace_delete" ON public.clinic_hours FOR DELETE USING (profile_id = get_workspace_id());

CREATE TRIGGER update_clinic_hours_updated_at
  BEFORE UPDATE ON public.clinic_hours
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Tabela clinic_breaks: pausas
CREATE TABLE public.clinic_breaks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL,
  day_of_week integer CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6)),
  start_time text NOT NULL,
  end_time text NOT NULL,
  label text NOT NULL DEFAULT 'Pausa',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.clinic_breaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_select" ON public.clinic_breaks FOR SELECT USING (profile_id = get_workspace_id());
CREATE POLICY "workspace_insert" ON public.clinic_breaks FOR INSERT WITH CHECK (profile_id = get_workspace_id());
CREATE POLICY "workspace_update" ON public.clinic_breaks FOR UPDATE USING (profile_id = get_workspace_id());
CREATE POLICY "workspace_delete" ON public.clinic_breaks FOR DELETE USING (profile_id = get_workspace_id());

-- Tabela clinic_extra_sessions: sessões extras
CREATE TABLE public.clinic_extra_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL,
  date date NOT NULL,
  open_time text NOT NULL DEFAULT '08:00',
  close_time text NOT NULL DEFAULT '18:00',
  label text NOT NULL DEFAULT 'Sessão Extra',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.clinic_extra_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_select" ON public.clinic_extra_sessions FOR SELECT USING (profile_id = get_workspace_id());
CREATE POLICY "workspace_insert" ON public.clinic_extra_sessions FOR INSERT WITH CHECK (profile_id = get_workspace_id());
CREATE POLICY "workspace_update" ON public.clinic_extra_sessions FOR UPDATE USING (profile_id = get_workspace_id());
CREATE POLICY "workspace_delete" ON public.clinic_extra_sessions FOR DELETE USING (profile_id = get_workspace_id());

-- Função para criar horários padrão para novos perfis
CREATE OR REPLACE FUNCTION public.handle_new_user_default_clinic_hours()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.clinic_hours (profile_id, day_of_week, is_open, open_time, close_time)
  VALUES
    (NEW.id, 0, false, '08:00', '18:00'),
    (NEW.id, 1, true, '08:00', '18:00'),
    (NEW.id, 2, true, '08:00', '18:00'),
    (NEW.id, 3, true, '08:00', '18:00'),
    (NEW.id, 4, true, '08:00', '18:00'),
    (NEW.id, 5, true, '08:00', '18:00'),
    (NEW.id, 6, false, '08:00', '18:00');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_default_clinic_hours
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_default_clinic_hours();
