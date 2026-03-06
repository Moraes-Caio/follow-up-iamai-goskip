
-- Fix search_path on existing functions that don't have it set

CREATE OR REPLACE FUNCTION public.handle_patient_return_dates()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
    template_record RECORD;
BEGIN
    SELECT return_interval, send_before, return_interval_unit 
    INTO template_record
    FROM reminder_templates
    WHERE id = NEW.template_id;

    IF FOUND THEN
        NEW.return_interval_days := template_record.return_interval - template_record.send_before;
        NEW.reminder_send_date := NEW.last_procedure_date + 
            CASE 
                WHEN template_record.return_interval_unit = 'days' THEN make_interval(days => (template_record.return_interval - template_record.send_before))
                WHEN template_record.return_interval_unit = 'months' THEN make_interval(months => (template_record.return_interval - template_record.send_before))
                WHEN template_record.return_interval_unit = 'years' THEN make_interval(years => (template_record.return_interval - template_record.send_before))
                ELSE make_interval(days => (template_record.return_interval - template_record.send_before))
            END;
    END IF;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.fn_calculate_reminder_dates()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
    v_interval INTEGER;
    v_unit TEXT;
BEGIN
    SELECT (return_interval - send_before), return_interval_unit 
    INTO v_interval, v_unit
    FROM reminder_templates
    WHERE id = NEW.procedure_id; 

    IF v_interval IS NOT NULL THEN
        NEW.return_interval_days := v_interval;
        NEW.reminder_send_date := NEW.last_procedure_date + 
            CASE 
                WHEN v_unit = 'days'   THEN make_interval(days => v_interval)
                WHEN v_unit = 'months' THEN make_interval(months => v_interval)
                WHEN v_unit = 'years'  THEN make_interval(years => v_interval)
                ELSE make_interval(days => v_interval)
            END;
    END IF;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_patient_reminder_dates()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  UPDATE patient_returns pr
  SET 
    return_interval_days = (rt.return_interval - rt.send_before),
    reminder_send_date = pr.last_procedure_date + 
      make_interval(
        days => CASE WHEN rt.return_interval_unit = 'days' THEN (rt.return_interval - rt.send_before) ELSE 0 END,
        months => CASE WHEN rt.return_interval_unit = 'months' THEN (rt.return_interval - rt.send_before) ELSE 0 END,
        years => CASE WHEN rt.return_interval_unit = 'years' THEN (rt.return_interval - rt.send_before) ELSE 0 END
      )
  FROM reminder_templates rt
  WHERE pr.template_id = rt.id; 
END;
$function$;
