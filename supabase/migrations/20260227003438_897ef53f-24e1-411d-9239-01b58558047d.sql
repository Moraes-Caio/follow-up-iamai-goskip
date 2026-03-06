
-- Allow users to find their team_member record by email (before user_id is linked)
CREATE POLICY "users_view_by_email"
ON public.team_members
FOR SELECT
USING (lower(email) = lower(auth.email()));

-- Allow users to link their user_id to their team_member record (first login only)
CREATE POLICY "users_can_link_own_membership"
ON public.team_members
FOR UPDATE
USING (lower(email) = lower(auth.email()) AND user_id IS NULL)
WITH CHECK (lower(email) = lower(auth.email()));
