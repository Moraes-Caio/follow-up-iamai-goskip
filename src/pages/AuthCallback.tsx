import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Heart, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Configurando sua conta...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 1. Marcar sessão como ativa (evita sign-out automático)
        sessionStorage.setItem('followup_session_active', 'true');
        localStorage.setItem('followup_remember', 'true');

        // 2. Aguardar sessão do Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          console.error('AuthCallback: No session found', sessionError);
          toast({ title: 'Erro no login', description: 'Não foi possível completar o login. Tente novamente.', variant: 'destructive' });
          navigate('/login', { replace: true });
          return;
        }

        const user = session.user;
        const userEmail = user.email?.toLowerCase() ?? '';
        console.log('AuthCallback: User authenticated', { id: user.id, email: userEmail });

        // 3. Buscar team_member por user_id
        setStatus('Verificando seu perfil...');
        let { data: teamMember } = await supabase
          .from('team_members')
          .select('id, user_id, is_owner, password_changed')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        // 4. Se não encontrou por user_id, buscar por email
        if (!teamMember) {
          const { data: teamByEmail } = await supabase
            .from('team_members')
            .select('id, user_id, is_owner, password_changed')
            .eq('email', userEmail)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();
          teamMember = teamByEmail;
        }

        console.log('AuthCallback: team_member found', teamMember);

        // 5. Lógica de redirecionamento
        if (teamMember) {
          const isFirstLogin = !teamMember.user_id;

          // Vincular user_id se é primeiro login
          if (isFirstLogin) {
            console.log('AuthCallback: First login, linking user_id');
            await supabase
              .from('team_members')
              .update({ user_id: user.id })
              .eq('id', teamMember.id);
          }

          if (!teamMember.is_owner) {
            // É MEMBRO CONVIDADO
            if (isFirstLogin || !teamMember.password_changed) {
              console.log('AuthCallback: Member needs setup -> /member-setup');
              navigate('/member-setup', { replace: true });
              return;
            } else {
              console.log('AuthCallback: Member already set up -> /dashboard');
              navigate('/dashboard', { replace: true });
              return;
            }
          } else {
            // É OWNER
            const { data: profile } = await supabase
              .from('profiles')
              .select('onboarding_completed')
              .eq('id', user.id)
              .maybeSingle();

            if (!profile || !profile.onboarding_completed) {
              console.log('AuthCallback: Owner needs onboarding -> /onboarding');
              navigate('/onboarding', { replace: true });
              return;
            } else {
              console.log('AuthCallback: Owner already onboarded -> /dashboard');
              navigate('/dashboard', { replace: true });
              return;
            }
          }
        } else {
          // Nenhum team_member encontrado — owner novo
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .maybeSingle();

          if (!profile || !profile.onboarding_completed) {
            console.log('AuthCallback: New owner -> /onboarding');
            navigate('/onboarding', { replace: true });
            return;
          } else {
            console.log('AuthCallback: Existing owner -> /dashboard');
            navigate('/dashboard', { replace: true });
            return;
          }
        }
      } catch (err) {
        console.error('AuthCallback: Unexpected error', err);
        toast({ title: 'Erro', description: 'Erro inesperado. Tente novamente.', variant: 'destructive' });
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30">
      <div className="flex items-center gap-2 mb-6">
        <Heart className="h-8 w-8 text-primary" fill="currentColor" />
        <span className="text-2xl font-bold text-foreground">FollowUp</span>
      </div>
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">{status}</p>
    </div>
  );
};

export default AuthCallback;
