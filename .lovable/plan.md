

# Fix: Google OAuth ignoring onboarding/member-setup redirects

## Root Cause

The Google OAuth `redirectTo` is set to `/dashboard`. After OAuth callback, the browser lands on `/dashboard` where `PrivateRoute` runs and should handle routing. The `PrivateRoute` logic is correct, BUT there's a critical issue:

When a new user signs in via Google, the `handle_new_user` trigger creates a `profiles` row, which then fires `handle_new_team_owner` trigger creating a `team_members` record with `is_owner = true` and `user_id = NEW.id`. For invited members, this creates a DUPLICATE record (one invited with `is_owner=false, user_id=null` and one auto-created with `is_owner=true, user_id=auth.uid()`). The `PrivateRoute` query with `.limit(1)` may pick the wrong one.

Additionally, for the owner who already completed onboarding, the `PrivateRoute` works. But for new owners via Google, the flow depends on `onboardingCompleted` state which has a race condition with the profile creation.

## Changes

### 1. Database: Fix `handle_new_team_owner` trigger

Modify the trigger to skip creating an owner record if the user's email already exists in `team_members` (i.e., they were invited). This prevents the duplicate record problem.

```sql
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
    RETURN NEW;
  END IF;

  INSERT INTO public.team_members (profile_id, full_name, email, role_id, is_owner, is_active, user_id)
  VALUES (NEW.id, NEW.full_name, COALESCE(NEW.email, ''), 'admin', true, true, NEW.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
```

### 2. `src/App.tsx` - PrivateRoute: also query by user_id

The current query only uses `email`. Add a fallback query by `user_id` to handle cases where the member's `user_id` was already linked (e.g., after completing member-setup, the email might differ from Google email case).

### 3. `src/pages/Login.tsx` - Change redirectTo

Change `redirectTo` from `/dashboard` to just the origin root (`/`). The root route (`/`) already redirects to `/dashboard` via `<Navigate>`, and `PrivateRoute` handles the rest. This is cosmetic but clearer.

## Files

| File | Action |
|---|---|
| Migration SQL | Fix `handle_new_team_owner` to skip invited members |
| `src/App.tsx` | Minor: query team_members by user_id as fallback |
| `src/pages/Login.tsx` | Change `redirectTo` to `window.location.origin` |

