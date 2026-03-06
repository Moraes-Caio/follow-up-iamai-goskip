
-- 1. Add return_interval_days to procedures
ALTER TABLE public.procedures ADD COLUMN IF NOT EXISTS return_interval_days integer;

-- 2. Create patient_return_status enum
DO $$ BEGIN
  CREATE TYPE patient_return_status AS ENUM ('pendente', 'enviado', 'confirmado', 'ignorado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Create patient_returns table
CREATE TABLE public.patient_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  procedure_id uuid NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
  last_procedure_date date NOT NULL,
  return_interval_days integer NOT NULL,
  reminder_send_date date GENERATED ALWAYS AS (last_procedure_date + return_interval_days) STORED,
  lembrete_enviado boolean DEFAULT false,
  lembrete_enviado_em timestamptz,
  lembrete_mensagem text,
  status patient_return_status DEFAULT 'pendente',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Indices for n8n performance
CREATE INDEX idx_patient_returns_profile ON public.patient_returns(profile_id);
CREATE INDEX idx_patient_returns_send_date ON public.patient_returns(reminder_send_date);
CREATE INDEX idx_patient_returns_pending ON public.patient_returns(lembrete_enviado, reminder_send_date)
  WHERE lembrete_enviado = FALSE AND status = 'pendente';

-- 5. RLS
ALTER TABLE public.patient_returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON public.patient_returns FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "users_insert_own" ON public.patient_returns FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "users_update_own" ON public.patient_returns FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "users_delete_own" ON public.patient_returns FOR DELETE USING (profile_id = auth.uid());

-- 6. Trigger for updated_at
CREATE TRIGGER set_patient_returns_updated_at
  BEFORE UPDATE ON public.patient_returns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
