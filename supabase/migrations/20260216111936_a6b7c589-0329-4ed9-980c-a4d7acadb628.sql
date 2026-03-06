
-- Remove the protect_team_owner trigger from team_members
DROP TRIGGER IF EXISTS protect_team_owner ON public.team_members;

-- Remove the protect_owner function
DROP FUNCTION IF EXISTS public.protect_owner();
