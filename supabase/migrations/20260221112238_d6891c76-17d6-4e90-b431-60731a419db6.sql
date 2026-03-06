
-- 1. Convert existing return_interval to days based on current unit
UPDATE public.reminder_templates
SET return_interval = CASE
  WHEN return_interval_unit = 'weeks' THEN return_interval * 7
  WHEN return_interval_unit = 'months' THEN return_interval * 30
  WHEN return_interval_unit = 'years' THEN return_interval * 365
  ELSE return_interval -- already days or null
END
WHERE return_interval IS NOT NULL;

-- 2. Convert existing send_before to days based on send_before_unit
UPDATE public.reminder_templates
SET send_before = CASE
  WHEN send_before_unit = 'weeks' THEN send_before * 7
  WHEN send_before_unit = 'months' THEN send_before * 30
  ELSE send_before -- already days or null
END
WHERE send_before IS NOT NULL;

-- 3. Drop unit columns
ALTER TABLE public.reminder_templates DROP COLUMN IF EXISTS return_interval_unit;
ALTER TABLE public.reminder_templates DROP COLUMN IF EXISTS send_before_unit;

-- 4. Recreate the trigger function - now assumes everything is in days
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
  NEW.reminder_send_date := (NEW.last_procedure_date + make_interval(days => v_effective_days))::date;

  RETURN NEW;
END;
$function$;

-- 5. Ensure trigger exists on patient_returns for INSERT and UPDATE
DROP TRIGGER IF EXISTS trg_patient_returns_set_reminder_fields ON public.patient_returns;
CREATE TRIGGER trg_patient_returns_set_reminder_fields
  BEFORE INSERT OR UPDATE ON public.patient_returns
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_patient_returns_set_reminder_fields();

-- 6. Create function to recalculate patient_returns when reminder_templates change
CREATE OR REPLACE FUNCTION public.fn_recalc_patient_returns_on_template_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.patient_returns
  SET 
    return_interval_days = COALESCE(NEW.return_interval, 0) - COALESCE(NEW.send_before, 0),
    reminder_send_date = (last_procedure_date + make_interval(days => COALESCE(NEW.return_interval, 0) - COALESCE(NEW.send_before, 0)))::date,
    updated_at = now()
  WHERE procedure_id = NEW.procedure_id
    AND NEW.procedure_id IS NOT NULL;
  
  RETURN NEW;
END;
$function$;

-- 7. Create trigger on reminder_templates for UPDATE
DROP TRIGGER IF EXISTS trg_recalc_returns_on_template_change ON public.reminder_templates;
CREATE TRIGGER trg_recalc_returns_on_template_change
  AFTER UPDATE ON public.reminder_templates
  FOR EACH ROW
  WHEN (
    OLD.return_interval IS DISTINCT FROM NEW.return_interval
    OR OLD.send_before IS DISTINCT FROM NEW.send_before
    OR OLD.procedure_id IS DISTINCT FROM NEW.procedure_id
  )
  EXECUTE FUNCTION public.fn_recalc_patient_returns_on_template_change();
