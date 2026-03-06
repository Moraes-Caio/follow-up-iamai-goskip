import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WorkspaceMembership {
  id: string;
  profile_id: string;
  role_id: string;
  is_owner: boolean;
  is_active: boolean;
  full_name: string;
  email: string;
  specialty: string | null;
  user_id: string | null;
}

export function useWorkspace() {
  const { user } = useAuth();

  const membershipQuery = useQuery({
    queryKey: ['workspace_membership', user?.id],
    queryFn: async (): Promise<WorkspaceMembership | null> => {
      if (!user?.id) return null;

      // Find the team_member record for the current user
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data as WorkspaceMembership | null;
    },
    enabled: !!user?.id,
  });

  // Check if user is the workspace owner (profile owner)
  const isOwner = membershipQuery.data?.is_owner ?? false;
  const workspaceId = membershipQuery.data?.profile_id ?? user?.id ?? null;
  const roleIds = membershipQuery.data?.role_id
    ? membershipQuery.data.role_id.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return {
    membership: membershipQuery.data,
    isOwner,
    workspaceId,
    roleIds,
    isLoading: membershipQuery.isLoading,
    hasAccess: !!membershipQuery.data,
    refetch: membershipQuery.refetch,
  };
}
