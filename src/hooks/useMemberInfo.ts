import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  type RolePermissions,
  defaultPermissions,
  basePermissionKeys,
  applyBasePermissions,
  mergePermissions,
} from '@/types';

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

  // Resolve permissions for all roles (supports comma-separated multi-role)
  const roleIds = memberQuery.data?.roleId
    ? memberQuery.data.roleId.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const roleQuery = useQuery({
    queryKey: ['member_roles', roleIds.join(',')],
    queryFn: async (): Promise<{ roles: RoleInfo[]; merged: RolePermissions }> => {
      if (roleIds.length === 0) {
        return { roles: [], merged: applyBasePermissions({ ...defaultPermissions }) };
      }

      // Fetch ALL roles (default + custom) from DB in a single query
      const { data } = await supabase
        .from('custom_roles')
        .select('id, name, permissions, color, icon')
        .in('id', roleIds);

      const resolvedRoles: RoleInfo[] = [];
      if (data) {
        for (const row of data) {
          resolvedRoles.push({
            id: row.id,
            name: row.name,
            permissions: row.permissions as unknown as RolePermissions,
            color: row.color,
            icon: row.icon,
          });
        }
      }

      // Merge all role permissions with OR logic, then apply base permissions
      const merged = applyBasePermissions(
        mergePermissions(...resolvedRoles.map(r => r.permissions))
      );

      return { roles: resolvedRoles, merged };
    },
    enabled: roleIds.length > 0,
  });

  const member = memberQuery.data;
  const isOwner = member?.isOwner ?? false;
  const resolvedRoles = roleQuery.data?.roles ?? [];
  const mergedPermissions = roleQuery.data?.merged ?? applyBasePermissions({ ...defaultPermissions });

  // Use the first role for display purposes (name, color, icon)
  const primaryRole: RoleInfo | null = resolvedRoles.length > 0 ? resolvedRoles[0] : null;

  const hasPermission = (key: keyof RolePermissions): boolean => {
    if (isOwner) return true;
    // Base permissions are always true
    if ((basePermissionKeys as string[]).includes(key)) return true;
    return mergedPermissions[key] ?? false;
  };

  const permissions: RolePermissions = isOwner
    ? Object.keys(defaultPermissions).reduce((acc, key) => {
        acc[key as keyof RolePermissions] = true;
        return acc;
      }, { ...defaultPermissions })
    : mergedPermissions;

  return {
    member,
    role: primaryRole,
    isOwner,
    hasPermission,
    permissions,
    profileId: member?.profileId ?? null,
    isLoading: memberQuery.isLoading || (roleIds.length > 0 && roleQuery.isLoading),
    refetch: memberQuery.refetch,
  };
}
