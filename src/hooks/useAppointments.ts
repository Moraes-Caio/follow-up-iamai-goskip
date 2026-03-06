import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/hooks/useWorkspace';

export interface AppointmentRow {
  id: string;
  profile_id: string | null;
  patient_id: string;
  date: string;
  time: string;
  end_time: string | null;
  procedure_name: string;
  procedure_id: string | null;
  professional_id: string | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  confirmation_sent: boolean | null;
  confirmation_sent_at: string | null;
  was_performed: boolean | null;
  lembrete_enviado: boolean | null;
  lembrete_mensagem: string | null;
  lembrete_enviado_em: string | null;
  created_at: string;
}

export function useAppointments() {
  const { user } = useAuth();
  const { workspaceId } = useWorkspace();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['appointments', user?.id],
    queryFn: async (): Promise<AppointmentRow[]> => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const addAppointment = useMutation({
    mutationFn: async (appointment: Pick<AppointmentRow, 'patient_id' | 'date' | 'time' | 'procedure_name' | 'procedure_id' | 'professional_id' | 'confirmation_sent'> & { end_time?: string | null }) => {
      const { error } = await supabase
        .from('appointments')
        .insert({ ...appointment, profile_id: workspaceId || user!.id });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const updateAppointment = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<AppointmentRow>) => {
      const { error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const deleteAppointment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  return {
    appointments: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    addAppointment: addAppointment.mutateAsync,
    updateAppointment: updateAppointment.mutateAsync,
    deleteAppointment: deleteAppointment.mutateAsync,
  };
}
