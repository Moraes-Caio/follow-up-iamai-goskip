import { Heart, ShieldAlert, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const NoAccess = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-[440px] bg-card rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-12 animate-in fade-in duration-500 text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Heart className="h-7 w-7 text-primary" fill="currentColor" />
          <span className="text-xl font-bold text-foreground">FollowUp</span>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <ShieldAlert className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">Sem acesso</h2>
          <p className="text-muted-foreground">
            Você não tem acesso a nenhuma clínica no momento.
          </p>
          <p className="text-sm text-muted-foreground">
            Se você recebeu um convite, use o link enviado por e-mail.
          </p>
          <Button variant="outline" className="w-full h-12 rounded-lg text-base mt-4" onClick={() => logout()}>
            <LogOut className="h-5 w-5 mr-2" /> Sair
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NoAccess;
