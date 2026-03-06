import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/hooks/useWorkspace';
import type { Database } from '@/integrations/supabase/types';

type ReminderTemplateRow = Database['public']['Tables']['reminder_templates']['Row'];
type ReminderTemplateInsert = Database['public']['Tables']['reminder_templates']['Insert'];
type ReminderTemplateUpdate = Database['public']['Tables']['reminder_templates']['Update'];

export type { ReminderTemplateRow };

export function useReminderTemplates() {
  const { user } = useAuth();
  const { workspaceId } = useWorkspace();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['reminder_templates', user?.id],
    queryFn: async (): Promise<ReminderTemplateRow[]> => {
      const { data, error } = await supabase
        .from('reminder_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const addTemplate = useMutation({
    mutationFn: async (template: Omit<ReminderTemplateInsert, 'id' | 'profile_id' | 'created_at'>) => {
      const { error } = await supabase
        .from('reminder_templates')
        .insert({ ...template, profile_id: workspaceId || user!.id });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminder_templates'] }),
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & ReminderTemplateUpdate) => {
      const { error } = await supabase
        .from('reminder_templates')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminder_templates'] }),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reminder_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminder_templates'] }),
  });

  return {
    templates: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    addTemplate: addTemplate.mutateAsync,
    updateTemplate: updateTemplate.mutateAsync,
    deleteTemplate: deleteTemplate.mutateAsync,
  };
}
