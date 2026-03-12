import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Appointments from "./pages/Appointments";
import Reminders from "./pages/Reminders";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import Support from "./pages/Support";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Onboarding from "./pages/Onboarding";
import MemberSetup from "./pages/MemberSetup";
import AuthCallback from "./pages/AuthCallback";
import NoAccess from "./pages/NoAccess";
import NotFound from "./pages/NotFound";
import { PermissionRoute } from "./components/PermissionRoute";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

const queryClient = new QueryClient();

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, onboardingCompleted, user } = useAuth();
  const [accessState, setAccessState] = React.useState<'loading' | 'no-access' | 'member-setup' | 'owner' | 'ok'>('loading');

  React.useEffect(() => {
    if (!isAuthenticated || !user) {
      setAccessState('loading');
      return;
    }
    let cancelled = false;
    (async () => {
      let { data } = await supabase
        .from('team_members')
        .select('id, user_id, is_owner, setup_completed')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1);
      if (cancelled) return;
      if (!data || data.length === 0) {
        const res = await supabase
          .from('team_members')
          .select('id, user_id, is_owner, setup_completed')
          .eq('email', user.email?.toLowerCase() ?? '')
          .eq('is_active', true)
          .limit(1);
        if (cancelled) return;
        data = res.data;
      }
      if (!data || data.length === 0) {
        setAccessState('no-access');
      } else if (!data[0].is_owner && !data[0].setup_completed) {
        setAccessState('member-setup');
      } else if (data[0].is_owner) {
        setAccessState('owner');
      } else {
        setAccessState('ok');
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, user]);

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (accessState === 'loading') return <LoadingSpinner />;
  if (accessState === 'member-setup') return <Navigate to="/member-setup" replace />;
  if (accessState === 'ok') return <>{children}</>;

  if (accessState === 'owner') {
    if (onboardingCompleted === null) return <LoadingSpinner />;
    if (onboardingCompleted === false) return <Navigate to="/onboarding" replace />;
    return <>{children}</>;
  }

  if (accessState === 'no-access') {
    if (onboardingCompleted === null) return <LoadingSpinner />;
    if (onboardingCompleted === false) return <Navigate to="/onboarding" replace />;
    return <NoAccess />;
  }

  return <>{children}</>;
};

const MemberSetupRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, onboardingCompleted } = useAuth();

  if (isLoading || (isAuthenticated && onboardingCompleted === null)) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (onboardingCompleted === true) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

const SessionConflictDialog = () => {
  const { sessionConflict } = useAuth();

  return (
    <AlertDialog open={sessionConflict}>
      <AlertDialogContent className="[&>button]:hidden">
        <AlertDialogHeader>
          <AlertDialogTitle>Sessão ativa em outro dispositivo</AlertDialogTitle>
          <AlertDialogDescription>
            Sua conta foi acessada em outro dispositivo. Feche a sessão no outro dispositivo e atualize esta página para continuar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => window.location.reload()}>
            Atualizar página
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const AppRoutes = () => (
  <>
    <SessionConflictDialog />
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/no-access" element={<NoAccess />} />
      <Route path="/esqueci-senha" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />
      <Route path="/member-setup" element={<MemberSetupRoute><MemberSetup /></MemberSetupRoute>} />

      {/* Base routes — always accessible for any authenticated member */}
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/notificacoes" element={<PrivateRoute><Notifications /></PrivateRoute>} />
      <Route path="/configuracoes" element={<PrivateRoute><Settings /></PrivateRoute>} />
      <Route path="/suporte" element={<PrivateRoute><Support /></PrivateRoute>} />

      {/* Permission-gated routes */}
      <Route path="/pacientes" element={<PrivateRoute><PermissionRoute permission="viewPatients"><Patients /></PermissionRoute></PrivateRoute>} />
      <Route path="/consultas" element={<PrivateRoute><PermissionRoute permission="viewAppointments"><Appointments /></PermissionRoute></PrivateRoute>} />
      <Route path="/lembretes" element={<PrivateRoute><PermissionRoute permission="viewReminders"><Reminders /></PermissionRoute></PrivateRoute>} />
      <Route path="/mensagens" element={<PrivateRoute><PermissionRoute permission="viewMessages"><Messages /></PermissionRoute></PrivateRoute>} />
      <Route path="/equipe" element={<PrivateRoute><PermissionRoute permission="viewTeam"><Team /></PermissionRoute></PrivateRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  </>
);

const App = () => {
  React.useEffect(() => {
    const handler = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'number') {
        (target as HTMLInputElement).blur();
      }
    };
    document.addEventListener('wheel', handler, { passive: true });
    return () => document.removeEventListener('wheel', handler);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
