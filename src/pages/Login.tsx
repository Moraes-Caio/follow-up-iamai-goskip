import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Calendar, Bell, ShieldCheck, Loader2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const { login, isLoading } = useAuth();
  const emailRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [authError, setAuthError] = useState('');
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const emailError = emailTouched && email.trim() !== '' && !emailRegex.test(email.trim());
  const passwordError = passwordTouched && password !== '' && password.length < 6;
  const isValid = emailRegex.test(email.trim()) && password.length >= 6;

  useEffect(() => { emailRef.current?.focus(); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEmail('');
        setPassword('');
        setAuthError('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || submitting) return;
    setAuthError('');
    setSubmitting(true);
    const result = await login(email.trim(), password, rememberMe);
    setSubmitting(false);
    if (result.success) {
      // If there's an invite token, try to accept it after login
      if (inviteToken) {
        try {
          const response = await supabase.functions.invoke('accept-invite', {
            body: { token: inviteToken },
          });
          if (response.data?.success) {
            toast({ title: 'Convite aceito!', description: 'Você foi adicionado à equipe.' });
          } else if (response.data?.error) {
            toast({ title: 'Aviso', description: response.data.error, variant: 'destructive' });
          }
        } catch (err) {
          console.warn('Failed to accept invite:', err);
        }
      }
      toast({ title: 'Login realizado com sucesso!', description: 'Bem-vindo ao FollowUp.' });

      // Post-login: check team_members by email
      const userEmail = email.trim().toLowerCase();
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('id, user_id, is_owner')
        .eq('email', userEmail)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (teamMember) {
        const wasFirstLogin = !teamMember.user_id;
        // Link user_id if null (first login)
        if (wasFirstLogin) {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            await supabase
              .from('team_members')
              .update({ user_id: authUser.id })
              .eq('id', teamMember.id);
          }
        }
        // Member first login → member-setup
        if (!teamMember.is_owner && wasFirstLogin) {
          navigate('/member-setup', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        // No team_member found → owner flow (new clinic or existing)
        navigate(result.onboardingCompleted === false ? '/onboarding' : '/dashboard', { replace: true });
      }
    } else {
      setAuthError(result.error || 'Email ou senha incorretos.');
      setPassword('');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side */}
      <div className="hidden md:flex md:w-[40%] relative bg-gradient-to-br from-primary to-[hsl(221,83%,53%)] text-primary-foreground flex-col items-center justify-center p-12">
        <div className="relative z-10 text-center max-w-md space-y-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="h-10 w-10" fill="currentColor" />
            <span className="text-3xl font-bold tracking-tight">FollowUp</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight">Gestão Inteligente de Pacientes</h1>
          <p className="text-lg text-blue-100 leading-relaxed">
            Automatize lembretes, confirmações e acompanhamento de retornos para sua clínica odontológica
          </p>
        </div>
        <Calendar className="absolute bottom-12 left-12 h-[120px] w-[120px] opacity-[0.08]" strokeWidth={1} />
        <Bell className="absolute bottom-24 right-16 h-[80px] w-[80px] opacity-[0.08]" strokeWidth={1} />
        <div className="absolute bottom-6 right-6 flex items-center gap-1.5 text-blue-200 text-xs">
          <ShieldCheck className="h-4 w-4" />
          Conexão segura SSL
        </div>
      </div>

      {/* Right side */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div
          className={`w-full max-w-[440px] bg-card rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-12 animate-in fade-in duration-500 ${shake ? 'animate-shake' : ''}`}
        >
          {/* Mobile logo */}
          <div className="flex md:hidden items-center justify-center gap-2 mb-8">
            <Heart className="h-7 w-7 text-primary" fill="currentColor" />
            <span className="text-xl font-bold text-foreground">FollowUp</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground">Bem-vindo de volta!</h2>
            <p className="text-muted-foreground mt-1">Faça login para acessar sua clínica</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  ref={emailRef}
                  type="email"
                  placeholder="exemplo@email.com"
                  className={`pl-11 h-11 rounded-lg ${emailError ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                  value={email}
                  onChange={e => { setEmail(e.target.value.replace(/\s/g, '')); setAuthError(''); }}
                  onBlur={() => setEmailTouched(true)}
                  aria-invalid={emailError}
                  aria-describedby={emailError ? 'email-error' : undefined}
                />
              </div>
              {emailError && <p id="email-error" className="text-destructive text-sm">Digite um email válido</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`pl-11 pr-11 h-11 rounded-lg ${passwordError ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setAuthError(''); }}
                  onBlur={() => setPasswordTouched(true)}
                  aria-invalid={passwordError}
                  aria-describedby={passwordError ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {passwordError && <p id="password-error" className="text-destructive text-sm">A senha deve ter no mínimo 6 caracteres</p>}
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" checked={rememberMe} onCheckedChange={v => setRememberMe(!!v)} />
                <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">Lembrar-me</Label>
              </div>
              <Link to="/esqueci-senha" className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">
                Esqueci minha senha
              </Link>
            </div>

            {/* Auth error */}
            {authError && (
              <Alert variant="destructive" className="bg-destructive/5 border-destructive/20">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}

            {/* Submit */}
            <Button type="submit" className="w-full h-12 rounded-lg text-base" disabled={!isValid || submitting}>
              {submitting ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Entrando...</>
              ) : (
                'Entrar'
              )}
            </Button>

            {/* Separator */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            {/* Google */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 rounded-lg text-base gap-3"
              disabled={googleLoading || submitting}
              onClick={async () => {
                setGoogleLoading(true);
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: { redirectTo: `${window.location.origin}/auth/callback` },
                });
                if (error) {
                  toast({ title: 'Erro ao conectar com Google', description: error.message, variant: 'destructive' });
                  setGoogleLoading(false);
                }
              }}
            >
              {googleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              Entrar com Google
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Não tem conta? Entre em contato pelo WhatsApp{' '}
              <a href="https://wa.me/5511952138636" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">+55 11 95213-8636</a>
            </p>
          </div>

          <div className="mt-6 text-center space-x-3">
            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">Termos de Uso</button>
            <span className="text-xs text-muted-foreground">|</span>
            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">Política de Privacidade</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
