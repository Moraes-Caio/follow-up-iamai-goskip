
-- Drop and recreate trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS trg_patient_returns_set_reminder_fields ON public.patient_returns;

CREATE TRIGGER trg_patient_returns_set_reminder_fields
  BEFORE INSERT OR UPDATE ON public.patient_returns
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_patient_returns_set_reminder_fields();
