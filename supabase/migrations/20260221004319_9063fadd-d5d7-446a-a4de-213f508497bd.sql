
-- Allow users to see their own team_member records (needed for removed members to check their status)
CREATE POLICY "users_view_own_membership" ON public.team_members 
FOR SELECT USING (user_id = auth.uid());

-- Ensure the trigger for auto-creating team owner record exists
DROP TRIGGER IF EXISTS on_profile_created_team_owner ON public.profiles;
CREATE TRIGGER on_profile_created_team_owner
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_team_owner();
