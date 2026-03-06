import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/hooks/useWorkspace';
import { toast } from '@/hooks/use-toast';

export interface ProcedureRow {
  id: string;
  title: string;
  description: string | null;
  professional_ids: string[] | null;
  return_interval_days: number | null;
  duration_minutes: number | null;
  cleanup_minutes: number | null;
  profile_id: string | null;
  created_at: string;
}

export function useProcedures() {
  const { user } = useAuth();
  const { workspaceId } = useWorkspace();
  const queryClient = useQueryClient();

  const { data: procedures = [], isLoading } = useQuery({
    queryKey: ['procedures', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procedures')
        .select('*')
        .order('title', { ascending: true });
      if (error) throw error;
      return data as ProcedureRow[];
    },
    enabled: !!user?.id,
  });

  const addProcedure = useMutation({
    mutationFn: async (proc: { title: string; description?: string; professional_ids?: string[]; return_interval_days?: number; duration_minutes?: number; cleanup_minutes?: number }) => {
      const { data, error } = await supabase
        .from('procedures')
        .insert({
          title: proc.title,
          description: proc.description || null,
          professional_ids: proc.professional_ids || [],
          return_interval_days: proc.return_interval_days ?? null,
          duration_minutes: proc.duration_minutes ?? null,
          cleanup_minutes: proc.cleanup_minutes ?? 15,
          profile_id: workspaceId || user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procedures'] }),
    onError: (err: Error) => toast({ title: 'Erro', description: err.message, variant: 'destructive' }),
  });

  const updateProcedure = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; description?: string | null; professional_ids?: string[]; return_interval_days?: number | null; duration_minutes?: number | null; cleanup_minutes?: number | null }) => {
      const { error } = await supabase
        .from('procedures')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procedures'] }),
    onError: (err: Error) => toast({ title: 'Erro', description: err.message, variant: 'destructive' }),
  });

  const deleteProcedure = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('procedures').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procedures'] }),
    onError: (err: Error) => toast({ title: 'Erro', description: err.message, variant: 'destructive' }),
  });

  return { procedures, isLoading, addProcedure, updateProcedure, deleteProcedure };
}
