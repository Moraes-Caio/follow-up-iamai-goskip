import React from 'react';
import { Navigate } from 'react-router-dom';
import { useMemberInfo } from '@/hooks/useMemberInfo';
import { type RolePermissions } from '@/types';
import { Loader2 } from 'lucide-react';

interface PermissionRouteProps {
  children: React.ReactNode;
  permission?: keyof RolePermissions;
}

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export function PermissionRoute({ children, permission }: PermissionRouteProps) {
  const { isOwner, hasPermission, isLoading } = useMemberInfo();

  if (isLoading) return <LoadingSpinner />;

  // No permission required or owner has all access
  if (!permission || isOwner) return <>{children}</>;

  // Check permission
  if (!hasPermission(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
