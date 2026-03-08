import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMemberInfo } from '@/hooks/useMemberInfo';
import { type RolePermissions } from '@/types';
import { Loader2, ShieldAlert } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';

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
  const { isOwner, hasPermission, isLoading, role } = useMemberInfo();
  const navigate = useNavigate();

  if (isLoading) return <LoadingSpinner />;

  // No permission required or owner has all access
  if (!permission || isOwner) return <>{children}</>;

  // Check permission — show inline "no access" message (stays in the app with sidebar)
  if (!hasPermission(permission)) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <ShieldAlert className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Acesso restrito</h2>
          <p className="text-muted-foreground mb-1">
            Sua função{role ? ` (${role.name})` : ''} não tem permissão para acessar esta página.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Entre em contato com o administrador da clínica para solicitar acesso.
          </p>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Voltar ao Dashboard
          </Button>
        </div>
      </MainLayout>
    );
  }

  return <>{children}</>;
}
