import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useMemberInfo } from '@/hooks/useMemberInfo';
import { useProfile } from '@/hooks/useProfile';
import { type RolePermissions } from '@/types';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Bell,
  MessageSquare,
  BellRing,
  Briefcase,
  HelpCircle,
  Menu,
  Heart,
  LogOut,
  Settings,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface MenuItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  permission?: keyof RolePermissions;
  alwaysVisible?: boolean;
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', alwaysVisible: true },
  { icon: Users, label: 'Pacientes', path: '/pacientes', permission: 'viewPatients' },
  { icon: Calendar, label: 'Consultas', path: '/consultas', permission: 'viewAppointments' },
  { icon: Bell, label: 'Lembretes', path: '/lembretes', permission: 'viewReminders' },
  { icon: MessageSquare, label: 'Mensagens', path: '/mensagens', permission: 'viewMessages' },
  { icon: BellRing, label: 'Notificações', path: '/notificacoes', alwaysVisible: true },
  { icon: Briefcase, label: 'Equipe & Procedimentos', path: '/equipe', permission: 'viewTeam' },
  { icon: Settings, label: 'Configurações', path: '/configuracoes', alwaysVisible: true },
  { icon: HelpCircle, label: 'Suporte', path: '/suporte', alwaysVisible: true },
];

function getInitials(name: string): string {
  if (!name) return 'US';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0][0]?.toUpperCase() || 'U';
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { member, role, isOwner, hasPermission } = useMemberInfo();
  const { profile } = useProfile();

  const userName = profile?.full_name || member?.fullName || 'Usuário';
  const roleName = role?.name || 'Membro';
  const initials = getInitials(userName);

  const visibleItems = menuItems.filter(item => {
    if (item.alwaysVisible) return true;
    if (isOwner) return true;
    if (item.permission) return hasPermission(item.permission);
    return true;
  });

  const handleProfileClick = () => {
    navigate('/configuracoes?tab=account');
    onItemClick?.();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    onItemClick?.();
  };

  return (
    <div className="flex h-full flex-col bg-card border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 mb-2 border-b border-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
          <Heart className="h-5 w-5 text-primary-foreground" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground tracking-tight">FollowUp</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-0.5">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={onItemClick}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-accent text-accent-foreground border-l-[3px] border-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" strokeWidth={2} />
                  <span className="flex-1">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="border-t border-border px-4 py-4 space-y-1">
        <div 
          className="flex items-center gap-3 cursor-pointer hover:bg-muted rounded-lg p-2.5 transition-colors"
          onClick={handleProfileClick}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate">{roleName}</p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="flex items-center gap-3 w-full rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" strokeWidth={2} />
              Sair
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sair da conta</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja sair? Você precisará fazer login novamente para acessar o sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Sair
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Heart className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <span className="font-semibold text-foreground">FollowUp</span>
          </div>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <SidebarContent onItemClick={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <SidebarContent />
      </aside>
    </>
  );
}
