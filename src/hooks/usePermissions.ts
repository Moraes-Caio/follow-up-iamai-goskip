import { useMemo } from 'react';
import { useWorkspace } from './useWorkspace';
import { useCustomRoles } from './useCustomRoles';
import { type RolePermissions, defaultPermissions } from '@/types';

export function usePermissions() {
  const { isOwner, roleIds, membership } = useWorkspace();
  const { roles } = useCustomRoles();

  const permissions = useMemo((): RolePermissions => {
    // Owner always has all permissions
    if (isOwner) {
      const all = { ...defaultPermissions };
      for (const key of Object.keys(all) as (keyof RolePermissions)[]) {
        all[key] = true;
      }
      return all;
    }

    if (!membership) return { ...defaultPermissions };

    // Merge permissions from all assigned roles (OR logic)
    const merged = { ...defaultPermissions };
    for (const rid of roleIds) {
      const role = roles.find(r => r.id === rid);
      if (!role) continue;
      const perms = role.permissions as unknown as RolePermissions;
      for (const key of Object.keys(merged) as (keyof RolePermissions)[]) {
        if (perms[key]) merged[key] = true;
      }
    }
    return merged;
  }, [isOwner, roleIds, roles, membership]);

  const hasPermission = (key: keyof RolePermissions): boolean => {
    return isOwner || permissions[key];
  };

  return {
    permissions,
    hasPermission,
    isOwner,
  };
}
