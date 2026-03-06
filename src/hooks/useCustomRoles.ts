import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';
import type { RolePermissions } from '@/types';
import { allPermissionsEnabled } from '@/types';

type CustomRoleRow = Database['public']['Tables']['custom_roles']['Row'];

export type { CustomRoleRow };

// Default roles that are always available (not stored in DB)
const defaultRoles: CustomRoleRow[] = [
  {
    id: 'admin',
    name: 'Administrador',
    description: 'Acesso completo ao sistema',
    icon: '👨‍💼',
    color: '#3b82f6',
    permissions: allPermissionsEnabled as unknown as Database['public']['Tables']['custom_roles']['Row']['permissions'],
    is_default: true,
    profile_id: null,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'dentist',
    name: 'Dentista',
    description: 'Profissional de saúde',
    icon: '👨‍⚕️',
    color: '#10b981',
    permissions: {
      viewAppointments: true, createAppointments: true, editAppointments: true,
      cancelAppointments: true, confirmAppointments: true,
      viewPatients: true, createPatients: true, editPatients: true,
      deletePatients: false, viewSensitiveData: true,
      viewReminders: true, manageReminders: true, viewMessages: true, sendMessages: true,
      viewTeam: true, addTeamMembers: false, removeTeamMembers: false, manageRoles: false,
      viewSettings: true, editSettings: false, manageIntegrations: false,
      viewDashboard: true, viewReports: true, exportData: true,
      viewNotifications: true, manageNotifications: true,
    } as unknown as Database['public']['Tables']['custom_roles']['Row']['permissions'],
    is_default: true,
    profile_id: null,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'receptionist',
    name: 'Recepcionista',
    description: 'Atendimento e agendamentos',
    icon: '📋',
    color: '#f59e0b',
    permissions: {
      viewAppointments: true, createAppointments: true, editAppointments: true,
      cancelAppointments: false, confirmAppointments: true,
      viewPatients: true, createPatients: true, editPatients: true,
      deletePatients: false, viewSensitiveData: false,
      viewReminders: true, manageReminders: false, viewMessages: true, sendMessages: true,
      viewTeam: true, addTeamMembers: false, removeTeamMembers: false, manageRoles: false,
      viewSettings: false, editSettings: false, manageIntegrations: false,
      viewDashboard: true, viewReports: false, exportData: false,
      viewNotifications: true, manageNotifications: true,
    } as unknown as Database['public']['Tables']['custom_roles']['Row']['permissions'],
    is_default: true,
    profile_id: null,
    created_at: '2024-01-01T00:00:00Z',
  },
];

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
      // Merge default roles with custom ones from DB
      return [...defaultRoles, ...(data || [])];
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['custom_roles'] }),
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; icon?: string; color?: string; permissions?: RolePermissions }) => {
      // Don't update default roles in DB
      if (['admin', 'dentist', 'receptionist'].includes(id)) return;
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['custom_roles'] }),
  });

  const deleteRole = useMutation({
    mutationFn: async (id: string) => {
      if (['admin', 'dentist', 'receptionist'].includes(id)) return;
      const { error } = await supabase
        .from('custom_roles')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['custom_roles'] }),
  });

  return {
    roles: query.data || defaultRoles,
    isLoading: query.isLoading,
    error: query.error,
    addRole: addRole.mutateAsync,
    updateRole: updateRole.mutateAsync,
    deleteRole: deleteRole.mutateAsync,
  };
}
