import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/hooks/useWorkspace';
import type { Database } from '@/integrations/supabase/types';
import type { CustomRoleRow } from '@/hooks/useCustomRoles';

type TeamMemberRow = Database['public']['Tables']['team_members']['Row'];
type TeamMemberInsert = Database['public']['Tables']['team_members']['Insert'];
type TeamMemberUpdate = Database['public']['Tables']['team_members']['Update'];

export type { TeamMemberRow };

// ===== Permission helper: who can do what to whom =====

/** Check if a member has the "Administrador" role by looking up their role_ids in the roles list */
function memberIsAdmin(member: TeamMemberRow, roles: CustomRoleRow[]): boolean {
  if (!member.role_id) return false;
  const memberRoleIds = member.role_id.split(',').map(r => r.trim()).filter(Boolean);
  return memberRoleIds.some(rid => {
    const role = roles.find(r => r.id === rid);
    return role?.name === 'Administrador' && role?.is_default === true;
  });
}

export interface MemberAction {
  canChangeRole: boolean;
  canRemove: boolean;
  reason?: string;
}

/**
 * Given the current user's team_member, a target member, and the roles list,
 * returns what actions the current user can perform.
 */
export function getMemberActions(
  currentMember: TeamMemberRow | undefined,
  targetMember: TeamMemberRow,
  roles: CustomRoleRow[] = []
): MemberAction {
  if (!currentMember) return { canChangeRole: false, canRemove: false };

  const isSelf = currentMember.id === targetMember.id;
  const callerIsOwner = currentMember.is_owner ?? false;
  const targetIsOwner = targetMember.is_owner ?? false;
  const callerIsAdmin = memberIsAdmin(currentMember, roles);
  const targetIsAdmin = memberIsAdmin(targetMember, roles);

  // Owner can never be removed
  if (targetIsOwner) {
    return {
      canChangeRole: callerIsOwner,
      canRemove: false,
      reason: 'O dono do workspace não pode ser removido.',
    };
  }

  // Owner can do everything to non-owners
  if (callerIsOwner) {
    return { canChangeRole: true, canRemove: !isSelf };
  }

  // Self: nobody changes their own role (except owner, handled above)
  if (isSelf) {
    return { canChangeRole: false, canRemove: false, reason: 'Você não pode alterar sua própria função.' };
  }

  // Admin: can change/remove non-admins only
  if (callerIsAdmin) {
    if (targetIsAdmin) {
      return { canChangeRole: false, canRemove: false, reason: 'Administradores não podem alterar outros administradores.' };
    }
    return { canChangeRole: true, canRemove: true };
  }

  // Regular member: no permissions
  return { canChangeRole: false, canRemove: false, reason: 'Você não tem permissão para esta ação.' };
}

/** Find the admin role from a roles list */
export function findAdminRole(roles: CustomRoleRow[]): CustomRoleRow | undefined {
  return roles.find(r => r.name === 'Administrador' && r.is_default === true);
}

// ===== Hook =====

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

  const updateMemberRole = useMutation({
    mutationFn: async ({ targetMemberId, newRoleIds }: { targetMemberId: string; newRoleIds: string }) => {
      const { data, error } = await (supabase.rpc as any)('update_member_role', {
        target_member_id: targetMemberId,
        new_role_ids: newRoleIds,
      });
      if (error) throw error;
      if (data && !data.success) throw new Error(data.error || 'Erro ao alterar função.');
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team_members'] }),
  });

  const removeMember = useMutation({
    mutationFn: async (targetMemberId: string) => {
      const { data, error } = await (supabase.rpc as any)('remove_team_member', {
        target_member_id: targetMemberId,
      });
      if (error) throw error;
      if (data && !data.success) throw new Error(data.error || 'Erro ao remover membro.');
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team_members'] }),
  });

  const deleteTeamMember = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await (supabase.rpc as any)('remove_team_member', {
        target_member_id: id,
      });
      if (error) throw error;
      if (data && !data.success) throw new Error(data.error || 'Erro ao remover membro.');
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team_members'] }),
  });

  return {
    teamMembers: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    addTeamMember: addTeamMember.mutateAsync,
    updateTeamMember: updateTeamMember.mutateAsync,
    updateMemberRole: updateMemberRole.mutateAsync,
    removeMember: removeMember.mutateAsync,
    deleteTeamMember: deleteTeamMember.mutateAsync,
  };
}
