
-- Auto-create team_member as owner when a new profile is created
CREATE OR REPLACE FUNCTION public.handle_new_team_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.team_members (profile_id, full_name, email, role_id, is_owner, is_active)
  VALUES (
    NEW.id,
    NEW.full_name,
    COALESCE(NEW.email, ''),
    'admin',
    true,
    true
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_add_owner
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_team_owner();

-- Prevent updating is_owner to false or deleting owner
CREATE OR REPLACE FUNCTION public.protect_owner()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD.is_owner = true THEN
    RAISE EXCEPTION 'Cannot delete the account owner';
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.is_owner = true AND NEW.is_owner = false THEN
    RAISE EXCEPTION 'Cannot remove owner status';
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.is_owner = false AND NEW.is_owner = true THEN
    RAISE EXCEPTION 'Cannot set owner via update';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_team_owner
  BEFORE UPDATE OR DELETE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_owner();
