-- 1. Drop the old trigger on patient_returns that references removed return_interval_unit column
DROP TRIGGER IF EXISTS trg_update_reminder_before_save ON public.patient_returns;

-- 2. Drop old functions that reference the removed column
DROP FUNCTION IF EXISTS public.fn_calculate_reminder_dates();
DROP FUNCTION IF EXISTS public.handle_patient_return_dates();
DROP FUNCTION IF EXISTS public.update_patient_reminder_dates();

-- 3. Create trigger to auto-sync procedure return_interval_days to reminder_templates.return_interval
CREATE OR REPLACE FUNCTION public.fn_sync_procedure_to_reminder_templates()
RETURNS TRIGGER AS $$
BEGIN
  -- When a procedure's return_interval_days changes, update all linked reminder_templates
  UPDATE public.reminder_templates
  SET return_interval = NEW.return_interval_days,
      updated_at = now()
  WHERE procedure_id = NEW.id
    AND type = 'periodic_return';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_procedure_return_interval ON public.procedures;
CREATE TRIGGER trg_sync_procedure_return_interval
AFTER UPDATE OF return_interval_days ON public.procedures
FOR EACH ROW
WHEN (OLD.return_interval_days IS DISTINCT FROM NEW.return_interval_days)
EXECUTE FUNCTION public.fn_sync_procedure_to_reminder_templates();
