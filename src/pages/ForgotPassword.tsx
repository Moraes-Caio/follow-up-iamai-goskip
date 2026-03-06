import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, KeyRound, Calendar, Bell, ShieldCheck, Heart, ArrowLeft, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPassword = () => {
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState(false);

  const emailError = touched && email.trim() !== '' && !emailRegex.test(email.trim());
  const isValid = emailRegex.test(email.trim());

  useEffect(() => { emailRef.current?.focus(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const numeroWhatsApp = "5511952138636";
    const mensagem = `Olá! Esqueci minha senha e preciso de ajuda para recuperar o acesso. Meu e-mail cadastrado é: ${email.trim()}`;
    const linkWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;

    setSent(true);
    window.open(linkWhatsApp, '_blank');
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
        <div className="w-full max-w-[440px] bg-card rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-12 animate-in fade-in duration-500">
          <div className="flex md:hidden items-center justify-center gap-2 mb-8">
            <Heart className="h-7 w-7 text-primary" fill="currentColor" />
            <span className="text-xl font-bold text-foreground">FollowUp</span>
          </div>

          {sent ? (
            <div className="text-center space-y-4 animate-in fade-in duration-300">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
                  <MessageCircle className="h-8 w-8 text-emerald-500" />
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-foreground">Redirecionado para o WhatsApp!</h2>
              <p className="text-muted-foreground leading-relaxed">
                Você será redirecionado para o WhatsApp. Mantenha esta aba aberta caso precise voltar.
              </p>
              <Button asChild className="w-full h-12 rounded-lg mt-4">
                <Link to="/login">Voltar para login</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <KeyRound className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-foreground">Esqueceu sua senha?</h2>
                <p className="text-muted-foreground mt-1 leading-relaxed">
                  Digite seu email e você será redirecionado ao nosso suporte via WhatsApp
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
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
                      onChange={e => setEmail(e.target.value.replace(/\s/g, ''))}
                      onBlur={() => setTouched(true)}
                      aria-invalid={emailError}
                    />
                  </div>
                  {emailError && <p className="text-destructive text-sm">Digite um email válido</p>}
                </div>

                <Button type="submit" className="w-full h-12 rounded-lg text-base gap-2" disabled={!isValid}>
                  <MessageCircle className="h-5 w-5" /> Enviar via WhatsApp
                </Button>

                <div className="text-center">
                  <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Voltar para login
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
