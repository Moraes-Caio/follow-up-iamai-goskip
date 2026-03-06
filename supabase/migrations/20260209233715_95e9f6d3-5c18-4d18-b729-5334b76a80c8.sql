
-- =============================================
-- ENUM TYPES
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'dentist', 'receptionist');
CREATE TYPE public.gender_type AS ENUM ('male', 'female', 'other');
CREATE TYPE public.relation_type AS ENUM ('mother', 'father', 'guardian', 'spouse', 'son', 'daughter', 'other');
CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE public.message_status AS ENUM ('sent', 'delivered', 'read', 'failed');
CREATE TYPE public.message_type AS ENUM ('periodic_return', 'appointment_confirmation');
CREATE TYPE public.reminder_type AS ENUM ('periodic_return', 'appointment_confirmation');
CREATE TYPE public.interval_unit AS ENUM ('days', 'weeks', 'months', 'years');
CREATE TYPE public.periodic_return_status AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE public.notification_type AS ENUM ('upcoming_appointment', 'completed_appointment');
CREATE TYPE public.notification_priority AS ENUM ('low', 'normal', 'high');

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- USER ROLES TABLE
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'receptionist',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- CLINIC SETTINGS TABLE
-- =============================================
CREATE TABLE public.clinic_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_name TEXT NOT NULL DEFAULT 'Minha Clínica',
  specialty TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  whatsapp_connected BOOLEAN DEFAULT false,
  whatsapp_number TEXT,
  email_notifications BOOLEAN DEFAULT true,
  alert_unconfirmed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view settings" ON public.clinic_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can update settings" ON public.clinic_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- PROCEDURES TABLE
-- =============================================
CREATE TABLE public.procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  professional_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view procedures" ON public.procedures FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage procedures" ON public.procedures FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- PATIENTS TABLE
-- =============================================
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  phone TEXT NOT NULL,
  gender gender_type,
  has_responsible BOOLEAN DEFAULT false,
  responsible_name TEXT,
  responsible_relation relation_type,
  responsible_phone TEXT,
  responsible_gender gender_type,
  responsible_birth_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view patients" ON public.patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update patients" ON public.patients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete patients" ON public.patients FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- TEAM MEMBERS TABLE
-- =============================================
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role_id TEXT NOT NULL DEFAULT 'receptionist',
  specialty TEXT,
  is_active BOOLEAN DEFAULT true,
  is_owner BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view team" ON public.team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage team" ON public.team_members FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- CUSTOM ROLES TABLE
-- =============================================
CREATE TABLE public.custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '👨‍💼',
  permissions JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view roles" ON public.custom_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage roles" ON public.custom_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- APPOINTMENTS TABLE
-- =============================================
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  procedure_type TEXT NOT NULL,
  professional_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  status appointment_status NOT NULL DEFAULT 'pending',
  confirmation_sent BOOLEAN DEFAULT false,
  confirmation_sent_at TIMESTAMPTZ,
  was_performed BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view appointments" ON public.appointments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update appointments" ON public.appointments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete appointments" ON public.appointments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- REMINDER TEMPLATES TABLE
-- =============================================
CREATE TABLE public.reminder_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type reminder_type NOT NULL,
  procedure_name TEXT,
  return_interval INTEGER,
  return_interval_unit interval_unit,
  send_before INTEGER,
  days_before_appointment INTEGER,
  message_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reminder_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view templates" ON public.reminder_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage templates" ON public.reminder_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- PERIODIC RETURNS TABLE
-- =============================================
CREATE TABLE public.periodic_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  reminder_template_id UUID NOT NULL REFERENCES public.reminder_templates(id) ON DELETE CASCADE,
  last_procedure_date DATE NOT NULL,
  next_return_date DATE NOT NULL,
  reminder_sent_at TIMESTAMPTZ,
  status periodic_return_status NOT NULL DEFAULT 'active'
);
ALTER TABLE public.periodic_returns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view returns" ON public.periodic_returns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage returns" ON public.periodic_returns FOR ALL TO authenticated USING (true);

-- =============================================
-- MESSAGES TABLE
-- =============================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  periodic_return_id UUID REFERENCES public.periodic_returns(id) ON DELETE SET NULL,
  type message_type NOT NULL,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  message_content TEXT NOT NULL,
  status message_status NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view messages" ON public.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (true);

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type notification_type NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  priority notification_priority NOT NULL DEFAULT 'normal',
  category TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view notifications" ON public.notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage notifications" ON public.notifications FOR ALL TO authenticated USING (true);

-- =============================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_clinic_settings_updated_at BEFORE UPDATE ON public.clinic_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- SEED DEFAULT DATA
-- =============================================

-- Default clinic settings
INSERT INTO public.clinic_settings (clinic_name, specialty, phone, address, email_notifications, alert_unconfirmed)
VALUES ('Minha Clínica', 'Odontologia Geral', '', '', true, true);

-- Default procedures
INSERT INTO public.procedures (title) VALUES
('Limpeza'), ('Consulta de Rotina'), ('Restauração'), ('Extração'),
('Canal'), ('Clareamento'), ('Ortodontia'), ('Implante'), ('Prótese'), ('Outros');

-- Default custom roles
INSERT INTO public.custom_roles (id, name, description, icon, permissions, is_default) VALUES
(gen_random_uuid(), 'Administrador', 'Acesso completo ao sistema', '👨‍💼',
  '{"viewAppointments":true,"createAppointments":true,"editAppointments":true,"cancelAppointments":true,"confirmAppointments":true,"viewPatients":true,"createPatients":true,"editPatients":true,"deletePatients":true,"viewReminders":true,"manageReminders":true,"viewMessages":true,"sendMessages":true,"viewTeam":true,"addTeamMembers":true,"removeTeamMembers":true,"manageRoles":true,"viewSettings":true,"editSettings":true,"manageIntegrations":true,"viewDashboard":true,"viewReports":true,"exportData":true,"viewNotifications":true,"manageNotifications":true}',
  true),
(gen_random_uuid(), 'Dentista', 'Profissional de saúde', '👨‍⚕️',
  '{"viewAppointments":true,"createAppointments":true,"editAppointments":true,"cancelAppointments":true,"confirmAppointments":true,"viewPatients":true,"createPatients":true,"editPatients":true,"deletePatients":false,"viewReminders":true,"manageReminders":true,"viewMessages":true,"sendMessages":true,"viewTeam":true,"addTeamMembers":false,"removeTeamMembers":false,"manageRoles":false,"viewSettings":true,"editSettings":false,"manageIntegrations":false,"viewDashboard":true,"viewReports":true,"exportData":true,"viewNotifications":true,"manageNotifications":true}',
  true),
(gen_random_uuid(), 'Recepcionista', 'Atendimento e agendamentos', '📋',
  '{"viewAppointments":true,"createAppointments":true,"editAppointments":true,"cancelAppointments":false,"confirmAppointments":true,"viewPatients":true,"createPatients":true,"editPatients":true,"deletePatients":false,"viewReminders":true,"manageReminders":false,"viewMessages":true,"sendMessages":true,"viewTeam":true,"addTeamMembers":false,"removeTeamMembers":false,"manageRoles":false,"viewSettings":false,"editSettings":false,"manageIntegrations":false,"viewDashboard":true,"viewReports":false,"exportData":false,"viewNotifications":true,"manageNotifications":true}',
  true);

-- Default reminder templates
INSERT INTO public.reminder_templates (name, type, procedure_name, return_interval, return_interval_unit, send_before, message_template, is_active) VALUES
('Retorno Limpeza Semestral', 'periodic_return', 'Limpeza', 6, 'months', 7, 'Olá {nome_paciente}! 👋

Este é um lembrete carinhoso da {clinica}.

Já faz 6 meses desde sua última limpeza dental. Que tal agendar seu retorno para manter seu sorriso saudável? 😁

Aguardamos seu contato!', true);

INSERT INTO public.reminder_templates (name, type, days_before_appointment, message_template, is_active) VALUES
('Confirmação de Consulta', 'appointment_confirmation', 1, 'Olá {nome_paciente}! 👋

Lembramos que você tem uma consulta agendada:

📅 Data: {data}
🕐 Horário: {horario}
🏥 {clinica}

Por favor, confirme sua presença respondendo esta mensagem.

Até breve!', true);
