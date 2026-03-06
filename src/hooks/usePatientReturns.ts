import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/hooks/useWorkspace';
import { toast } from '@/hooks/use-toast';

export type PatientReturnStatus = 'pendente' | 'enviado' | 'confirmado' | 'ignorado';

export interface PatientReturnRow {
  id: string;
  profile_id: string | null;
  patient_id: string;
  procedure_id: string;
  last_procedure_date: string;
  return_interval_days: number;
  reminder_send_date: string;
  lembrete_enviado: boolean | null;
  lembrete_enviado_em: string | null;
  lembrete_mensagem: string | null;
  status: PatientReturnStatus;
  created_at: string;
  updated_at: string;
  patients?: { full_name: string; phone: string };
  procedures?: { title: string };
}

export function usePatientReturns() {
  const { user } = useAuth();
  const { workspaceId } = useWorkspace();
  const queryClient = useQueryClient();

  const { data: returns = [], isLoading } = useQuery({
    queryKey: ['patient_returns', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_returns')
        .select(`
          *,
          patients!patient_returns_patient_id_fkey ( full_name, phone ),
          procedures!patient_returns_procedure_id_fkey ( title )
        `)
        .order('reminder_send_date', { ascending: true });
      if (error) throw error;
      return data as unknown as PatientReturnRow[];
    },
    enabled: !!user?.id,
  });

  const addReturn = useMutation({
    mutationFn: async (input: { patient_id: string; procedure_id: string; last_procedure_date: string; return_interval_days: number }) => {
      const { data, error } = await supabase
        .from('patient_returns')
        .insert({
          patient_id: input.patient_id,
          procedure_id: input.procedure_id,
          last_procedure_date: input.last_procedure_date,
          return_interval_days: input.return_interval_days,
          profile_id: workspaceId || user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient_returns'] });
      toast({ title: 'Sucesso', description: 'Retorno registrado!' });
    },
    onError: (err: Error) => toast({ title: 'Erro', description: err.message, variant: 'destructive' }),
  });

  const updateReturn = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: PatientReturnStatus; lembrete_enviado?: boolean; lembrete_enviado_em?: string; lembrete_mensagem?: string }) => {
      const { error } = await supabase
        .from('patient_returns')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patient_returns'] }),
    onError: (err: Error) => toast({ title: 'Erro', description: err.message, variant: 'destructive' }),
  });

  const deleteReturn = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('patient_returns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient_returns'] });
      toast({ title: 'Sucesso', description: 'Retorno excluído!' });
    },
    onError: (err: Error) => toast({ title: 'Erro', description: err.message, variant: 'destructive' }),
  });

  return { returns, isLoading, addReturn, updateReturn, deleteReturn };
}
