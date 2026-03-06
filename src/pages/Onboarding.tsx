import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Building2, User, Phone, MapPin, Stethoscope, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, refreshOnboarding } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    full_name: user?.name || '',
    nome_clinica: '',
    telefone: '',
    endereco: '',
    especialidade: '',
  });

  const isValid =
    form.full_name.trim().length >= 3 &&
    form.nome_clinica.trim().length >= 2 &&
    form.telefone.trim().length >= 10 &&
    form.endereco.trim().length >= 5 &&
    form.especialidade.trim().length >= 3;

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !user?.id || submitting) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name.trim(),
          nome_clinica: form.nome_clinica.trim(),
          telefone: form.telefone.trim(),
          endereco: form.endereco.trim(),
          especialidade: form.especialidade.trim(),
          onboarding_completed: true,
        } as any)
        .eq('id', user.id);

      if (error) throw error;

      await refreshOnboarding();
      toast({ title: 'Configuração concluída!', description: 'Seja bem-vindo ao FollowUp.' });
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Erro ao salvar configurações.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const fields = [
    { key: 'full_name' as const, label: 'Seu nome completo', placeholder: 'Dr. João Silva', icon: User },
    { key: 'nome_clinica' as const, label: 'Nome da clínica', placeholder: 'Clínica Sorriso', icon: Building2 },
    { key: 'telefone' as const, label: 'Telefone', placeholder: '(19) 99999-9999', icon: Phone },
    { key: 'endereco' as const, label: 'Endereço', placeholder: 'Rua das Flores, 123 - Centro', icon: MapPin },
    { key: 'especialidade' as const, label: 'Especialidade', placeholder: 'Odontologia Geral', icon: Stethoscope },
  ];

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
            Vamos configurar sua clínica em poucos segundos
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 h-2 rounded-full bg-primary" />
          <div className={`flex-1 h-2 rounded-full transition-colors duration-300 ${isValid ? 'bg-primary' : 'bg-muted'}`} />
        </div>

        {/* Form */}
        <Card className="shadow-lg border-border/50">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {fields.map(({ key, label, placeholder, icon: Icon }) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key} className="text-foreground font-medium">{label} *</Label>
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    {key === 'telefone' ? (
                      <PhoneInput
                        id={key}
                        value={form[key]}
                        onChange={(val) => setForm(prev => ({ ...prev, telefone: val }))}
                        className="pl-10 h-11"
                      />
                    ) : (
                      <Input
                        id={key}
                        value={form[key]}
                        onChange={handleChange(key)}
                        placeholder={placeholder}
                        className="pl-10 h-11"
                        maxLength={200}
                      />
                    )}
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full h-12 text-base gap-2"
                  disabled={!isValid || submitting}
                >
                  {submitting ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Salvando...</>
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

export default Onboarding;
