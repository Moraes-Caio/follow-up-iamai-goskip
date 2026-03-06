
-- Create server-only table for API credentials (no RLS = service role only)
CREATE TABLE IF NOT EXISTS public.api_credentials (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  uazapi_server text,
  uazapi_token text,
  updated_at timestamp with time zone DEFAULT now()
);

-- Migrate existing data
INSERT INTO public.api_credentials (profile_id, uazapi_server, uazapi_token)
SELECT id, uazapi_server, uazapi_token FROM public.profiles
WHERE uazapi_server IS NOT NULL OR uazapi_token IS NOT NULL
ON CONFLICT (profile_id) DO NOTHING;

-- Remove sensitive columns from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS uazapi_server;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS uazapi_token;

-- Note: api_credentials has NO RLS enabled intentionally.
-- It is only accessible via service role key (used in edge functions).
-- The anon/authenticated roles should not have access.
REVOKE ALL ON public.api_credentials FROM anon, authenticated;
GRANT SELECT ON public.api_credentials TO service_role;
