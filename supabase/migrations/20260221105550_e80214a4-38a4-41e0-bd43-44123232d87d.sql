
-- 1) Add updated_at to reminder_templates
ALTER TABLE public.reminder_templates
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

-- Trigger to auto-update updated_at on reminder_templates
CREATE TRIGGER update_reminder_templates_updated_at
  BEFORE UPDATE ON public.reminder_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- 2) Function to auto-create default appointment confirmation template for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_default_templates()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.reminder_templates (
    profile_id, name, type, message_template, is_active, days_before_appointment
  ) VALUES (
    NEW.id,
    'Confirmação de Consulta',
    'appointment_confirmation',
    'Olá {nome_responsavel}! 😊

Passando para lembrar que {nome_paciente} tem uma consulta agendada para o dia {data} às {horario}.

📍 {clinica}
🦷 Procedimento: {procedimento}

Por favor, confirme sua presença respondendo esta mensagem.

Caso precise reagendar, entre em contato conosco. Estamos à disposição! 💙',
    true,
    1
  );
  RETURN NEW;
END;
$function$;

-- Create trigger on profiles table (fires after new profile is created)
CREATE TRIGGER trg_new_user_default_templates
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_default_templates();
