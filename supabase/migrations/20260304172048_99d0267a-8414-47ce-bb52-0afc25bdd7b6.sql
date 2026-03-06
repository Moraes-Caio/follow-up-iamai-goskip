CREATE OR REPLACE FUNCTION public.handle_new_team_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Skip if this email is already an invited member
  IF EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE lower(email) = lower(COALESCE(NEW.email, ''))
  ) THEN
    -- Link the user_id to the existing invited member record
    UPDATE public.team_members
    SET user_id = NEW.id
    WHERE lower(email) = lower(COALESCE(NEW.email, ''))
      AND user_id IS NULL;
    RETURN NEW;
  END IF;

  INSERT INTO public.team_members (profile_id, full_name, email, role_id, is_owner, is_active, user_id)
  VALUES (NEW.id, NEW.full_name, COALESCE(NEW.email, ''), 'admin', true, true, NEW.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;