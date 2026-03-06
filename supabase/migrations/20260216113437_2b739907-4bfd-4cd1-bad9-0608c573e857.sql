-- Mark existing active users as onboarding completed
UPDATE public.profiles
SET onboarding_completed = true
WHERE ativo = true;