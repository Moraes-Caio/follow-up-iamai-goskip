import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useMemberInfo } from '@/hooks/useMemberInfo';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Building2, User, CheckCircle2, Loader2, Clock } from 'lucide-react';
import { ClinicHoursTab } from '@/components/settings/ClinicHoursTab';
import { supabase } from '@/integrations/supabase/client';

function MemberAccountTab() {
  const { user } = useAuth();
  const { member, role } = useMemberInfo();

  const [memberName, setMemberName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [originalPhone, setOriginalPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (member) {
      setMemberName(member.fullName || '');
      setOriginalName(member.fullName || '');
      setMemberPhone(member.phone || '');
      setOriginalPhone(member.phone || '');
    }
  }, [member]);

  const hasChanges = memberName !== originalName || memberPhone !== originalPhone;

  const initials = getInitials(member?.fullName || user?.name || 'US');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data, error } = await (supabase.rpc as any)('update_member_profile', {
        member_name: memberName.trim(),
        member_phone: memberPhone.trim(),
      });
      if (error) throw error;
      const result = data as any;
      if (result && result.success === false) throw new Error(result.error || 'Erro ao atualizar');

      setOriginalName(memberName);
      setOriginalPhone(memberPhone);
      toast({ title: 'Sucesso', description: 'Informações atualizadas!' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Erro ao atualizar informações.', variant: 'destructive' });
    }
    setIsSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sua Conta</CardTitle>
        <CardDescription>Informações da sua conta</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xl">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-lg">{member?.fullName || user?.name || 'Usuário'}</p>
            <p className="text-sm text-muted-foreground">{role?.name || 'Membro'}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="memberName">Nome</Label>
            <Input
              id="memberName"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="memberEmail">Email</Label>
            <Input id="memberEmail" type="email" value={member?.email || user?.email || ''} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="memberPhone">Telefone</Label>
            <PhoneInput
              id="memberPhone"
              value={memberPhone}
              onChange={(val) => setMemberPhone(val)}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Para alterar seu email, entre em contato com o suporte.
        </p>

        {hasChanges && (
          <div className="flex justify-end animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
            <Button onClick={handleSave} className="gap-2" disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Salvar Alterações
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getInitials(name: string): string {
  if (!name) return 'US';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0][0]?.toUpperCase() || 'U';
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export default function Settings() {
  const { user } = useAuth();
  const { profile, isLoading, updateProfile, isUpdating, updateAccountName, isUpdatingName } = useProfile();
  const { isOwner, isLoading: memberLoading } = useMemberInfo();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl === 'account' ? 'account' : tabFromUrl === 'hours' ? 'hours' : 'clinic');

  const [formData, setFormData] = useState({ nome_clinica: '', telefone: '', endereco: '', especialidade: '' });
  const [originalData, setOriginalData] = useState({ nome_clinica: '', telefone: '', endereco: '', especialidade: '' });
  const [accountName, setAccountName] = useState('');
  const [originalAccountName, setOriginalAccountName] = useState('');
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  const hasUnsavedChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
  const hasUnsavedAccountChanges = accountName !== originalAccountName;

  useEffect(() => {
    if (profile) {
      const data = {
        nome_clinica: profile.nome_clinica || '',
        telefone: profile.telefone || '',
        endereco: profile.endereco || '',
        especialidade: profile.especialidade || '',
      };
      setFormData(data);
      setOriginalData(data);
      const name = profile.full_name || '';
      setAccountName(name);
      setOriginalAccountName(name);
    }
  }, [profile]);

  useEffect(() => {
    if (tabFromUrl === 'account') setActiveTab('account');
    else if (tabFromUrl === 'hours') setActiveTab('hours');
  }, [tabFromUrl]);

  // For non-owners, force account tab
  useEffect(() => {
    if (!memberLoading && !isOwner) {
      setActiveTab('account');
    }
  }, [isOwner, memberLoading]);

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setOriginalData({ ...formData });
      toast({ title: 'Sucesso', description: 'Configurações salvas com sucesso!' });
    } catch {
      toast({ title: 'Erro', description: 'Erro ao salvar configurações.', variant: 'destructive' });
    }
  };

  const handleSaveAccountName = async () => {
    try {
      await updateAccountName(accountName);
      setOriginalAccountName(accountName);
      toast({ title: 'Sucesso', description: 'Nome atualizado com sucesso!' });
    } catch {
      toast({ title: 'Erro', description: 'Erro ao atualizar o nome.', variant: 'destructive' });
    }
  };

  const handleTabChange = (newTab: string) => {
    if ((activeTab === 'clinic' && hasUnsavedChanges) || (activeTab === 'account' && hasUnsavedAccountChanges)) {
      setPendingTab(newTab);
      setShowExitWarning(true);
      return;
    }
    setActiveTab(newTab);
  };

  const handleDiscardAndExit = () => {
    setFormData({ ...originalData });
    setAccountName(originalAccountName);
    if (pendingTab) setActiveTab(pendingTab);
    setPendingTab(null);
    setShowExitWarning(false);
  };

  const handleSaveAndExit = async () => {
    if (activeTab === 'clinic') await handleSave();
    if (activeTab === 'account') await handleSaveAccountName();
    if (pendingTab) setActiveTab(pendingTab);
    setPendingTab(null);
    setShowExitWarning(false);
  };

  const initials = getInitials(profile?.full_name || user?.name || 'US');

  if (isLoading || memberLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  // Non-owner: show only Conta tab
  if (!isOwner) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Configurações</h1>
            <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
          </div>
          <MemberAccountTab />
        </div>
      </MainLayout>
    );
  }

  // Owner: show all tabs
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Configurações</h1>
          <p className="text-muted-foreground">Gerencie as configurações da sua clínica</p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="clinic" className="gap-2">
              <Building2 className="h-4 w-4 hidden sm:inline" />
              Clínica
            </TabsTrigger>
            <TabsTrigger value="hours" className="gap-2">
              <Clock className="h-4 w-4 hidden sm:inline" />
              Horários
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-2">
              <User className="h-4 w-4 hidden sm:inline" />
              Conta
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clinic" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Clínica</CardTitle>
                <CardDescription>Dados básicos da sua clínica</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="clinicName">Nome da Clínica</Label>
                    <Input
                      id="clinicName"
                      value={formData.nome_clinica}
                      onChange={(e) => setFormData({ ...formData, nome_clinica: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <PhoneInput
                      id="phone"
                      value={formData.telefone}
                      onChange={(val) => setFormData({ ...formData, telefone: val })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      placeholder="Rua, número, bairro, cidade..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Especialidade</Label>
                    <Input
                      id="specialty"
                      value={formData.especialidade}
                      onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
                      placeholder="Ex: Odontologia Geral, Ortodontia..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {hasUnsavedChanges && (
              <div className="flex justify-end animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
                <Button onClick={handleSave} className="gap-2" disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Salvar Alterações
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="hours" className="space-y-6 mt-6">
            <ClinicHoursTab />
          </TabsContent>

          <TabsContent value="account" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Sua Conta</CardTitle>
                <CardDescription>Informações da sua conta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xl">
                    {initials}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{profile?.full_name || user?.name || 'Usuário'}</p>
                    <p className="text-sm text-muted-foreground">Administrador</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="accountName">Nome</Label>
                    <Input
                      id="accountName"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountEmail">Email</Label>
                    <Input id="accountEmail" type="email" value={profile?.email || user?.email || ''} disabled className="bg-muted" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Para alterar seu email, entre em contato com o suporte.
                </p>
              </CardContent>
            </Card>
            {hasUnsavedAccountChanges && (
              <div className="flex justify-end animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
                <Button onClick={handleSaveAccountName} className="gap-2" disabled={isUpdatingName}>
                  {isUpdatingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Salvar Alterações
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={showExitWarning} onOpenChange={setShowExitWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterações não salvas</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas na seção Clínica. Deseja sair sem salvar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscardAndExit} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sair sem salvar
            </AlertDialogAction>
            <Button onClick={handleSaveAndExit} disabled={isUpdating} className="gap-1">
              {isUpdating && <Loader2 className="h-3 w-3 animate-spin" />}
              Salvar e sair
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
