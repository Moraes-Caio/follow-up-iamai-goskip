import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/hooks/useWorkspace';
import type { Database } from '@/integrations/supabase/types';

type PatientInsert = Database['public']['Tables']['patients']['Insert'];
type PatientUpdate = Database['public']['Tables']['patients']['Update'];
type PatientRow = Database['public']['Tables']['patients']['Row'];

export type { PatientRow };

export function usePatients() {
  const { user } = useAuth();
  const { workspaceId } = useWorkspace();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['patients', user?.id],
    queryFn: async (): Promise<PatientRow[]> => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const addPatient = useMutation({
    mutationFn: async (patient: Omit<PatientInsert, 'id' | 'profile_id' | 'created_at' | 'updated_at'>): Promise<string> => {
      const { data, error } = await supabase
        .from('patients')
        .insert({ ...patient, profile_id: workspaceId || user!.id })
        .select('id')
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients'] }),
  });

  const updatePatient = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & PatientUpdate) => {
      const { error } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients'] }),
  });

  const deletePatient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients'] }),
  });

  return {
    patients: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    addPatient: addPatient.mutateAsync,
    updatePatient: updatePatient.mutateAsync,
    deletePatient: deletePatient.mutateAsync,
    isAdding: addPatient.isPending,
    isUpdating: updatePatient.isPending,
    isDeleting: deletePatient.isPending,
  };
}
