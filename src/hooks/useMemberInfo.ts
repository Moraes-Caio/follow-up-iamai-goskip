import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { type RolePermissions, defaultPermissions } from '@/types';

export interface MemberInfo {
  id: string;
  fullName: string;
  email: string;
  roleId: string;
  specialty: string | null;
  phone: string | null;
  isOwner: boolean;
  isActive: boolean;
  profileId: string | null;
  userId: string | null;
  passwordChanged: boolean;
}

export interface RoleInfo {
  id: string;
  name: string;
  permissions: RolePermissions;
  color: string | null;
  icon: string | null;
}

export function useMemberInfo() {
  const { user } = useAuth();

  const memberQuery = useQuery({
    queryKey: ['member_info', user?.id],
    queryFn: async (): Promise<MemberInfo | null> => {
      if (!user?.id) return null;

      let { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!data && user.email) {
        const res = await supabase
          .from('team_members')
          .select('*')
          .eq('email', user.email)
          .eq('is_active', true)
          .maybeSingle();
        data = res.data;
        error = res.error;
      }

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        fullName: data.full_name,
        email: data.email,
        roleId: data.role_id,
        specialty: data.specialty,
        phone: (data as any).phone ?? null,
        isOwner: data.is_owner ?? false,
        isActive: data.is_active ?? true,
        profileId: data.profile_id,
        userId: data.user_id,
        passwordChanged: data.user_id !== null,
      };
    },
    enabled: !!user?.id,
  });

  const roleQuery = useQuery({
    queryKey: ['member_role', memberQuery.data?.roleId],
    queryFn: async (): Promise<RoleInfo | null> => {
      const roleId = memberQuery.data?.roleId;
      if (!roleId) return null;

      // If it's a default role name (not UUID), skip the DB query
      const defaultRoleNames: Record<string, string> = {
        admin: 'Administrador',
        dentist: 'Dentista',
        receptionist: 'Recepcionista',
      };

      if (defaultRoleNames[roleId]) {
        return {
          id: roleId,
          name: defaultRoleNames[roleId],
          permissions: { ...defaultPermissions },
          color: null,
          icon: null,
        };
      }

      // It's a UUID (custom role) — query the DB
      const { data } = await supabase
        .from('custom_roles')
        .select('id, name, permissions, color, icon')
        .eq('id', roleId)
        .maybeSingle();

      if (data) {
        return {
          id: data.id,
          name: data.name,
          permissions: data.permissions as unknown as RolePermissions,
          color: data.color,
          icon: data.icon,
        };
      }

      return {
        id: roleId,
        name: roleId,
        permissions: { ...defaultPermissions },
        color: null,
        icon: null,
      };
    },
    enabled: !!memberQuery.data?.roleId,
  });

  const member = memberQuery.data;
  const role = roleQuery.data;
  const isOwner = member?.isOwner ?? false;

  const hasPermission = (key: keyof RolePermissions): boolean => {
    if (isOwner) return true;
    return role?.permissions?.[key] ?? false;
  };

  const permissions: RolePermissions = isOwner
    ? Object.keys(defaultPermissions).reduce((acc, key) => {
        acc[key as keyof RolePermissions] = true;
        return acc;
      }, { ...defaultPermissions })
    : (role?.permissions ?? { ...defaultPermissions });

  return {
    member,
    role,
    isOwner,
    hasPermission,
    permissions,
    profileId: member?.profileId ?? null,
    isLoading: memberQuery.isLoading || (!!member?.roleId && roleQuery.isLoading),
    refetch: memberQuery.refetch,
  };
}
