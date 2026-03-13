import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';
import type { RolePermissions } from '@/types';

type CustomRoleRow = Database['public']['Tables']['custom_roles']['Row'];

export type { CustomRoleRow };

export function useCustomRoles() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['custom_roles', user?.id],
    queryFn: async (): Promise<CustomRoleRow[]> => {
      const { data, error } = await supabase
        .from('custom_roles')
        .select('*')
        .order('created_at');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const addRole = useMutation({
    mutationFn: async (role: { name: string; description?: string; icon?: string; color?: string; permissions: RolePermissions }) => {
      const { error } = await supabase
        .from('custom_roles')
        .insert({
          name: role.name,
          description: role.description || null,
          icon: role.icon || '👨‍💼',
          color: role.color || '#3b82f6',
          permissions: role.permissions as unknown as Database['public']['Tables']['custom_roles']['Insert']['permissions'],
          is_default: false,
          profile_id: user!.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_roles'] });
      queryClient.invalidateQueries({ queryKey: ['member_roles'] });
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; icon?: string; color?: string; permissions?: RolePermissions }) => {
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.icon) dbUpdates.icon = updates.icon;
      if (updates.color) dbUpdates.color = updates.color;
      if (updates.permissions) dbUpdates.permissions = updates.permissions;
      const { error } = await supabase
        .from('custom_roles')
        .update(dbUpdates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_roles'] });
      queryClient.invalidateQueries({ queryKey: ['member_roles'] });
    },
  });

  const deleteRole = useMutation({
    mutationFn: async (id: string) => {
      // Default roles cannot be deleted — check by is_default flag
      const role = (query.data || []).find(r => r.id === id);
      if (role?.is_default) return;
      const { error } = await supabase
        .from('custom_roles')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_roles'] });
      queryClient.invalidateQueries({ queryKey: ['member_roles'] });
    },
  });

  return {
    roles: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    addRole: addRole.mutateAsync,
    updateRole: updateRole.mutateAsync,
    deleteRole: deleteRole.mutateAsync,
  };
}
