
-- Add address and specialty to profiles for clinic settings
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS endereco text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS especialidade text DEFAULT '';

-- Add color column to custom_roles for role color picker
ALTER TABLE public.custom_roles ADD COLUMN IF NOT EXISTS color text DEFAULT '#3b82f6';
