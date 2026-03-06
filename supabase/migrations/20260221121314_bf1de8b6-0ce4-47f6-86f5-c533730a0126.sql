
-- Fix fn_recalc_patient_returns_on_template_change: remove reminder_send_date from UPDATE
CREATE OR REPLACE FUNCTION public.fn_recalc_patient_returns_on_template_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.patient_returns
  SET 
    return_interval_days = COALESCE(NEW.return_interval, 0) - COALESCE(NEW.send_before, 0),
    updated_at = now()
  WHERE procedure_id = NEW.procedure_id
    AND NEW.procedure_id IS NOT NULL;
  
  RETURN NEW;
END;
$function$;

-- Fix fn_patient_returns_set_reminder_fields: remove reminder_send_date assignment
CREATE OR REPLACE FUNCTION public.fn_patient_returns_set_reminder_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_return_interval int;
  v_send_before int;
  v_effective_days int;
BEGIN
  IF NEW.procedure_id IS NULL OR NEW.last_procedure_date IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT rt.return_interval, rt.send_before
    INTO v_return_interval, v_send_before
  FROM public.reminder_templates rt
  WHERE rt.procedure_id = NEW.procedure_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  v_return_interval := COALESCE(v_return_interval, 0);
  v_send_before := COALESCE(v_send_before, 0);
  v_effective_days := v_return_interval - v_send_before;

  NEW.return_interval_days := v_effective_days;
  -- reminder_send_date is a generated column, no need to set it

  RETURN NEW;
END;
$function$;
