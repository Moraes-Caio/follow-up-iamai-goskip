import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Heart, User, Phone, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const MemberSetup = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isValid =
    form.fullName.trim().length >= 3 &&
    form.phone.replace(/\D/g, '').length >= 10 &&
    form.password.length >= 6 &&
    form.password === form.confirmPassword;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (form.fullName.trim().length < 3) newErrors.fullName = 'Nome deve ter pelo menos 3 caracteres';
    if (form.phone.replace(/\D/g, '').length < 10) newErrors.phone = 'Telefone inválido';
    if (form.password.length < 6) newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'As senhas não coincidem';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await (supabase.rpc as any)('complete_member_onboarding', {
        new_password: form.password,
        member_name: form.fullName.trim(),
        member_phone: form.phone.trim(),
      });

      const result = data as any;
      if (error) throw error;
      if (result && result.success === false) throw new Error(result.error || 'Erro ao configurar conta');

      toast({ title: 'Conta configurada!', description: 'Bem-vindo ao FollowUp.' });
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Erro ao configurar conta.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-8 w-8 text-primary" fill="currentColor" />
            <span className="text-2xl font-bold text-foreground">FollowUp</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Bem-vindo ao FollowUp! 🎉</h1>
          <p className="text-muted-foreground mt-2">
            Vamos configurar seu acesso em poucos segundos
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`flex-1 h-2 rounded-full transition-colors duration-300 ${isValid ? 'bg-primary' : 'bg-muted'}`} />
        </div>

        {/* Form */}
        <Card className="shadow-lg border-border/50">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-foreground font-medium">Seu nome completo *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    value={form.fullName}
                    onChange={(e) => { setForm(p => ({ ...p, fullName: e.target.value })); setErrors(p => ({ ...p, fullName: '' })); }}
                    placeholder="João Silva"
                    className="pl-10 h-11"
                    maxLength={100}
                  />
                </div>
                {errors.fullName && <p className="text-destructive text-sm">{errors.fullName}</p>}
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground font-medium">Telefone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <PhoneInput
                    id="phone"
                    value={form.phone}
                    onChange={(val) => { setForm(p => ({ ...p, phone: val })); setErrors(p => ({ ...p, phone: '' })); }}
                    className="pl-10 h-11"
                  />
                </div>
                {errors.phone && <p className="text-destructive text-sm">{errors.phone}</p>}
              </div>

              {/* Nova senha */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">Nova senha *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => { setForm(p => ({ ...p, password: e.target.value })); setErrors(p => ({ ...p, password: '' })); }}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-11"
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
              </div>

              {/* Confirmar senha */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground font-medium">Confirmar nova senha *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => { setForm(p => ({ ...p, confirmPassword: e.target.value })); setErrors(p => ({ ...p, confirmPassword: '' })); }}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-11"
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-destructive text-sm">{errors.confirmPassword}</p>}
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full h-12 text-base gap-2" disabled={!isValid || submitting}>
                  {submitting ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Configurando...</>
                  ) : (
                    <>Começar a usar <ArrowRight className="h-5 w-5" /></>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Você poderá alterar essas informações a qualquer momento nas configurações.
        </p>
      </div>
    </div>
  );
};

export default MemberSetup;
