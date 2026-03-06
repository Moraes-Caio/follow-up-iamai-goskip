import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/hooks/useWorkspace';
import type { Database } from '@/integrations/supabase/types';

type TeamMemberRow = Database['public']['Tables']['team_members']['Row'];
type TeamMemberInsert = Database['public']['Tables']['team_members']['Insert'];
type TeamMemberUpdate = Database['public']['Tables']['team_members']['Update'];

export type { TeamMemberRow };

export function useTeamMembers() {
  const { user } = useAuth();
  const { workspaceId } = useWorkspace();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['team_members', user?.id],
    queryFn: async (): Promise<TeamMemberRow[]> => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const addTeamMember = useMutation({
    mutationFn: async (member: Omit<TeamMemberInsert, 'id' | 'profile_id' | 'created_at'>) => {
      const { error } = await supabase
        .from('team_members')
        .insert({ ...member, profile_id: workspaceId || user!.id });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team_members'] }),
  });

  const updateTeamMember = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & TeamMemberUpdate) => {
      const { error } = await supabase
        .from('team_members')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team_members'] }),
  });

  const deleteTeamMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team_members'] }),
  });

  return {
    teamMembers: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    addTeamMember: addTeamMember.mutateAsync,
    updateTeamMember: updateTeamMember.mutateAsync,
    deleteTeamMember: deleteTeamMember.mutateAsync,
  };
}
