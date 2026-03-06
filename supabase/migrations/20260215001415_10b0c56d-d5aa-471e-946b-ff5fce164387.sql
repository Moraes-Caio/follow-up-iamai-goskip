INSERT INTO public.team_members (profile_id, full_name, email, role_id, is_owner, is_active)
SELECT p.id, p.full_name, COALESCE(p.email, ''), 'admin', true, true
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_members tm WHERE tm.profile_id = p.id AND tm.is_owner = true
);