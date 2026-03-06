-- Mark existing users who already have clinic data as onboarding completed
UPDATE public.profiles
SET onboarding_completed = true
WHERE full_name != ''
  AND nome_clinica IS NOT NULL
  AND nome_clinica != ''
  AND nome_clinica != 'Minha Clínica';