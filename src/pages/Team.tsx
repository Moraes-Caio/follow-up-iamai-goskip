import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamMembers, getMemberActions, type TeamMemberRow } from '@/hooks/useTeamMembers';
import { useProfile } from '@/hooks/useProfile';
import { useInvitations } from '@/hooks/useInvitations';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCustomRoles } from '@/hooks/useCustomRoles';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, UsersRound, Trash2, Mail, Stethoscope, Crown, Settings, Loader2, Shield, Send, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { RoleManagementDialog } from '@/components/team/RoleManagementDialog';
import { useProcedures } from '@/hooks/useProcedures';
import { type RolePermissions, defaultPermissions } from '@/types';

export default function Team() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { teamMembers, addTeamMember, updateTeamMember, updateMemberRole, deleteTeamMember, isLoading } = useTeamMembers();
  const { roles } = useCustomRoles();
  const { procedures, isLoading: proceduresLoading, addProcedure, updateProcedure, deleteProcedure } = useProcedures();
  const { teamMembers: allMembers } = useTeamMembers();
  const { invitations, pendingInvitations, sendInvite, isSending, cancelInvite, resendInvite, isLoading: invitationsLoading } = useInvitations();

  const [activeTab, setActiveTab] = useState('team');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRolesDialogOpen, setIsRolesDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMemberRow | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMemberRow | null>(null);

  // Invite dialog state
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', roleId: 'receptionist' });

  // Procedures inline state
  const [isProcDialogOpen, setIsProcDialogOpen] = useState(false);
  const [editingProc, setEditingProc] = useState<typeof procedures[0] | null>(null);
  const [procForm, setProcForm] = useState({ title: '', description: '', returnInterval: '', returnIntervalUnit: 'months' as 'days' | 'weeks' | 'months' | 'years', durationMinutes: '', selectedProfessionals: [] as string[] });

  const dentists = allMembers.filter((m) => {
    const memberRoleIds = m.role_id ? m.role_id.split(',').map(s => s.trim()).filter(Boolean) : [];
    return memberRoleIds.some(rid => {
      const role = roles.find((r) => r.id === rid);
      return role?.name.toLowerCase().includes('dentista');
    }) && m.is_active;
  });

  const daysToUnit = (days: number) => {
    if (days % 365 === 0) return { value: days / 365, unit: 'years' as const };
    if (days % 30 === 0) return { value: days / 30, unit: 'months' as const };
    if (days % 7 === 0) return { value: days / 7, unit: 'weeks' as const };
    return { value: days, unit: 'days' as const };
  };

  const unitToDays = (value: number, unit: string) => {
    const factors: Record<string, number> = { years: 365, months: 30, weeks: 7, days: 1 };
    return value * (factors[unit] || 1);
  };

  const toggleProfessional = (id: string) => {
    setProcForm((prev) => ({
      ...prev,
      selectedProfessionals: prev.selectedProfessionals.includes(id)
        ? prev.selectedProfessionals.filter((p) => p !== id)
        : [...prev.selectedProfessionals, id],
    }));
  };

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    roleIds: [] as string[],
    specialty: '',
  });

  const resetForm = () => {
    setFormData({ fullName: '', email: '', roleIds: [], specialty: '' });
    setSelectedMember(null);
  };

  const handleOpenDialog = (member?: TeamMemberRow) => {
    if (member) {
      setSelectedMember(member);
      const roleIds = member.role_id ? member.role_id.split(',').map(s => s.trim()).filter(Boolean) : [];
      setFormData({
        fullName: member.is_owner ? (profile?.full_name || member.full_name) : member.full_name,
        email: member.email,
        roleIds,
        specialty: member.specialty || '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => { setIsDialogOpen(false); resetForm(); };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.email || formData.roleIds.length === 0) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios.', variant: 'destructive' });
      return;
    }
    if (!isValidEmail(formData.email)) {
      toast({ title: 'Erro', description: 'Insira um email válido.', variant: 'destructive' });
      return;
    }

    try {
      if (selectedMember) {
        const actions = getMemberActions(currentMember, selectedMember);
        const newRoleId = formData.roleIds.join(', ');
        const roleChanged = newRoleId !== selectedMember.role_id;

        // If role changed, use the secure RPC
        if (roleChanged && actions.canChangeRole) {
          await updateMemberRole({ targetMemberId: selectedMember.id, newRoleIds: newRoleId });
        } else if (roleChanged && !actions.canChangeRole) {
          toast({ title: 'Erro', description: actions.reason || 'Você não tem permissão para alterar esta função.', variant: 'destructive' });
          return;
        }

        // Update specialty if it changed (only allowed for own record or via separate logic)
        if (formData.specialty !== (selectedMember.specialty || '')) {
          await updateTeamMember({ id: selectedMember.id, specialty: formData.specialty || null });
        }

        toast({ title: 'Sucesso', description: 'Membro atualizado com sucesso!' });
      } else {
        const memberData = {
          full_name: formData.fullName,
          email: formData.email,
          role_id: formData.roleIds.join(', '),
          specialty: formData.specialty || null,
          is_active: true,
        };
        await addTeamMember(memberData);
        toast({ title: 'Sucesso', description: 'Membro adicionado com sucesso!' });
      }
      handleCloseDialog();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteMember = async () => {
    if (memberToDelete) {
      try {
        await deleteTeamMember(memberToDelete.id);
        toast({ title: 'Sucesso', description: 'Membro removido com sucesso!' });
      } catch (err: any) {
        toast({ title: 'Erro', description: err.message, variant: 'destructive' });
      }
      setMemberToDelete(null);
      setIsDeleteDialogOpen(false);
      setIsDialogOpen(false);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteForm.email || !isValidEmail(inviteForm.email)) {
      toast({ title: 'Erro', description: 'Insira um email válido.', variant: 'destructive' });
      return;
    }
    // Check if the email already belongs to an existing team member
    const existingMember = teamMembers.find(
      (m) => m.email.toLowerCase() === inviteForm.email.toLowerCase() && m.is_active
    );
    if (existingMember) {
      toast({ title: 'Erro', description: `O email "${inviteForm.email}" já pertence a um membro da equipe (${existingMember.full_name}).`, variant: 'destructive' });
      return;
    }
    try {
      await sendInvite({
        email: inviteForm.email,
        roleId: inviteForm.roleId,
        invitedByName: profile?.full_name || user?.name || 'Equipe',
      });
      toast({ title: 'Convite enviado!', description: `Convite enviado para ${inviteForm.email}` });
      setIsInviteDialogOpen(false);
      setInviteForm({ email: '', roleId: 'receptionist' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleCancelInvite = async (id: string) => {
    try {
      await cancelInvite(id);
      toast({ title: 'Convite cancelado.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleResendInvite = async (id: string) => {
    try {
      await resendInvite(id);
      toast({ title: 'Convite reenviado!' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const getRoleById = (roleId: string) => roles.find((r) => r.id === roleId);

  const getRoleBadgeColor = (roleId: string) => {
    if (roleId === 'admin') return 'bg-primary/10 text-primary border-primary/20';
    if (roleId === 'dentist') return 'bg-secondary/10 text-secondary border-secondary/20';
    if (roleId === 'receptionist') return 'bg-info/10 text-info border-info/20';
    return 'bg-warning/10 text-warning border-warning/20';
  };

  const getRoleLabels = (member: TeamMemberRow) => {
    const ids = member.role_id ? member.role_id.split(',').map(s => s.trim()).filter(Boolean) : [];
    return ids.map(id => getRoleById(id)?.name || 'Sem função');
  };

  const sortedMembers = [...teamMembers].sort((a, b) => {
    if (a.is_owner && !b.is_owner) return -1;
    if (!a.is_owner && b.is_owner) return 1;
    return a.full_name.localeCompare(b.full_name);
  });

  const currentMember = teamMembers.find((m) => m.user_id === user?.id || m.profile_id === user?.id);
  const isOwner = currentMember?.is_owner ?? false;

  const getMergedPermissions = (member: TeamMemberRow | undefined): RolePermissions => {
    if (!member) return { ...defaultPermissions };
    const roleIds = member.role_id ? member.role_id.split(',').map(s => s.trim()).filter(Boolean) : [];
    const merged = { ...defaultPermissions };
    for (const rid of roleIds) {
      const role = getRoleById(rid);
      if (!role) continue;
      const perms = role.permissions as unknown as RolePermissions;
      for (const key of Object.keys(merged) as (keyof RolePermissions)[]) {
        if (perms[key]) merged[key] = true;
      }
    }
    return merged;
  };

  const currentPermissions = getMergedPermissions(currentMember);
  const canAddEditMembers = isOwner || (currentPermissions.addTeamMembers ?? false);

  const getProfessionalNames = (ids?: string[] | null) => {
    if (!ids || ids.length === 0) return 'Todos os profissionais';
    return ids.map((id) => allMembers.find((m) => m.id === id)?.full_name).filter(Boolean).join(', ');
  };

  const toggleRole = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter(id => id !== roleId)
        : [...prev.roleIds, roleId],
    }));
  };

  const getInviteStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    if (status === 'accepted') return <Badge className="bg-secondary/10 text-secondary border-secondary/20"><CheckCircle className="h-3 w-3 mr-1" />Aceito</Badge>;
    if (status === 'cancelled') return <Badge variant="outline" className="text-muted-foreground"><XCircle className="h-3 w-3 mr-1" />Cancelado</Badge>;
    if (isExpired) return <Badge variant="outline" className="text-warning border-warning/20"><Clock className="h-3 w-3 mr-1" />Expirado</Badge>;
    return <Badge className="bg-primary/10 text-primary border-primary/20"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
  };

  if (isLoading) {
    return <MainLayout><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Equipe & Procedimentos</h1>
          <p className="text-muted-foreground">Gerencie membros, convites e procedimentos da sua clínica</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="team" className="gap-2">
              <UsersRound className="h-4 w-4 hidden sm:inline" />
              Equipe
            </TabsTrigger>
            <TabsTrigger value="invites" className="gap-2">
              <Send className="h-4 w-4 hidden sm:inline" />
              Convites
              {pendingInvitations.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingInvitations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="procedures" className="gap-2">
              <Stethoscope className="h-4 w-4 hidden sm:inline" />
              Procedimentos
            </TabsTrigger>
          </TabsList>

          {/* ===== EQUIPE TAB ===== */}
          <TabsContent value="team" className="space-y-6 mt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsRolesDialogOpen(true)} className="gap-2"><Settings className="h-4 w-4" />Gerenciar Funções</Button>
                
              </div>
            </div>

            {sortedMembers.length === 0 ? (
              <Card><CardContent className="flex flex-col items-center justify-center py-12 text-center"><UsersRound className="h-12 w-12 text-muted-foreground/50" /><p className="mt-3 text-lg font-medium text-foreground">Nenhum membro na equipe</p><p className="text-sm text-muted-foreground">Adicione membros ou envie convites</p></CardContent></Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sortedMembers.map((member) => (
                  <Card
                    key={member.id}
                    className={`overflow-hidden transition-all hover:shadow-md cursor-pointer ${member.is_owner ? 'ring-2 ring-primary/20' : ''}`}
                    onClick={() => handleOpenDialog(member)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl relative">
                          {getRoleById(member.role_id.split(',')[0]?.trim())?.icon || member.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                          {member.is_owner && (<div className="absolute -top-1 -right-1 bg-warning text-warning-foreground rounded-full p-0.5"><Crown className="h-3 w-3" /></div>)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground truncate">{member.full_name}</h4>
                            {member.is_owner && (<Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs">Dono</Badge>)}
                          </div>
                          <div className="mt-1 flex items-center gap-2 flex-wrap">
                            {getRoleLabels(member).map((label, i) => (
                              <Badge key={i} variant="outline" className={getRoleBadgeColor(member.role_id.split(',')[i]?.trim() || '')}>{label}</Badge>
                            ))}
                            {member.is_owner && (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs gap-1">
                                <Shield className="h-3 w-3" />Todas permissões
                              </Badge>
                            )}
                          </div>
                          {member.specialty && (<p className="text-sm text-muted-foreground mt-2 flex items-center gap-1"><Stethoscope className="h-3.5 w-3.5" />{member.specialty}</p>)}
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1 truncate"><Mail className="h-3.5 w-3.5 flex-shrink-0" />{member.email}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ===== CONVITES TAB ===== */}
          <TabsContent value="invites" className="space-y-6 mt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
              {canAddEditMembers && (
                <Button onClick={() => setIsInviteDialogOpen(true)} className="gap-2">
                  <Send className="h-4 w-4" />Enviar Convite
                </Button>
              )}
            </div>

            {invitationsLoading ? (
              <div className="flex items-center justify-center h-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : invitations.length === 0 ? (
              <Card><CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Send className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-3 text-lg font-medium text-foreground">Nenhum convite enviado</p>
                <p className="text-sm text-muted-foreground">Envie convites para adicionar membros à equipe</p>
              </CardContent></Card>
            ) : (
              <div className="space-y-3">
                {invitations.map((invite) => {
                  const isPending = invite.status === 'pending' && new Date(invite.expires_at) >= new Date();
                  const roleName = getRoleById(invite.role_id)?.name || invite.role_id;
                  return (
                    <Card key={invite.id} className="overflow-hidden">
                      <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-foreground truncate">{invite.email}</p>
                            {getInviteStatusBadge(invite.status, invite.expires_at)}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span>Função: {roleName}</span>
                            <span>•</span>
                            <span>Enviado: {new Date(invite.created_at).toLocaleDateString('pt-BR')}</span>
                            {invite.invited_by_name && (
                              <><span>•</span><span>Por: {invite.invited_by_name}</span></>
                            )}
                          </div>
                        </div>
                        {isPending && canAddEditMembers && (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleResendInvite(invite.id)} className="gap-1">
                              <RefreshCw className="h-3.5 w-3.5" />Reenviar
                            </Button>
                            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive gap-1" onClick={() => handleCancelInvite(invite.id)}>
                              <XCircle className="h-3.5 w-3.5" />Cancelar
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ===== PROCEDIMENTOS TAB ===== */}
          <TabsContent value="procedures" className="space-y-6 mt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
              <Button onClick={() => { setEditingProc(null); setProcForm({ title: '', description: '', returnInterval: '', returnIntervalUnit: 'months', durationMinutes: '', selectedProfessionals: [] }); setIsProcDialogOpen(true); }} className="gap-2"><Plus className="h-4 w-4" />Novo Procedimento</Button>
            </div>

            {proceduresLoading ? (
              <div className="flex items-center justify-center h-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : procedures.length === 0 ? (
              <Card><CardContent className="flex flex-col items-center justify-center py-12 text-center"><Stethoscope className="h-12 w-12 text-muted-foreground/50" /><p className="mt-3 text-lg font-medium text-foreground">Nenhum procedimento cadastrado</p><p className="text-sm text-muted-foreground">Adicione procedimentos para organizar sua clínica</p></CardContent></Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {procedures.map((proc) => (
                  <Card
                    key={proc.id}
                    className="overflow-hidden transition-all hover:shadow-md cursor-pointer"
                    onClick={() => {
                      setEditingProc(proc);
                      const converted = proc.return_interval_days ? daysToUnit(proc.return_interval_days) : { value: '', unit: 'months' as const };
                      setProcForm({ title: proc.title, description: proc.description || '', returnInterval: converted.value.toString(), returnIntervalUnit: converted.unit, durationMinutes: proc.duration_minutes ? proc.duration_minutes.toString() : '', selectedProfessionals: proc.professional_ids || [] });
                      setIsProcDialogOpen(true);
                    }}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-foreground">{proc.title}</h4>
                          {proc.description && <p className="text-sm text-muted-foreground mt-1">{proc.description}</p>}
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <Badge variant="outline" className="text-xs gap-1"><UsersRound className="h-3 w-3" />{getProfessionalNames(proc.professional_ids)}</Badge>
                            {proc.return_interval_days && proc.return_interval_days > 0 && (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">↻ {proc.return_interval_days} dias</Badge>
                            )}
                            {proc.duration_minutes && proc.duration_minutes > 0 && (
                              <Badge variant="outline" className="text-xs">⏱ {proc.duration_minutes} min</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Procedure Add/Edit Dialog */}
      <Dialog open={isProcDialogOpen} onOpenChange={setIsProcDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col p-5 gap-3">
          <DialogHeader className="shrink-0 pb-0">
            <DialogTitle className="text-base">{editingProc ? 'Editar Procedimento' : 'Novo Procedimento'}</DialogTitle>
            <DialogDescription className="text-xs">{editingProc ? 'Atualize as informações do procedimento' : 'Adicione um novo procedimento à sua clínica'}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 p-1">
            <div className="space-y-1"><Label className="text-xs">Título *</Label><Input value={procForm.title} onChange={(e) => setProcForm({ ...procForm, title: e.target.value })} placeholder="Ex: Limpeza Dental" /></div>
            <div className="space-y-1"><Label className="text-xs">Descrição</Label><Input value={procForm.description} onChange={(e) => setProcForm({ ...procForm, description: e.target.value.slice(0, 150) })} placeholder="Breve descrição" /><p className="text-xs text-muted-foreground text-right">{procForm.description.length}/150</p></div>
            <div className="space-y-1">
              <Label className="text-xs">Tempo de Retorno</Label>
              <div className="flex gap-2">
                <Input type="number" min="1" value={procForm.returnInterval} onChange={(e) => setProcForm({ ...procForm, returnInterval: e.target.value })} placeholder="6" className="flex-1" />
                <Select value={procForm.returnIntervalUnit} onValueChange={(v) => setProcForm({ ...procForm, returnIntervalUnit: v as any })}>
                  <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Dias</SelectItem>
                    <SelectItem value="weeks">Semanas</SelectItem>
                    <SelectItem value="months">Meses</SelectItem>
                    <SelectItem value="years">Anos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {procForm.returnInterval && parseInt(procForm.returnInterval) > 0 && (
                <p className="text-xs text-primary">Retorno a cada {procForm.returnInterval} {procForm.returnIntervalUnit === 'days' ? 'dias' : procForm.returnIntervalUnit === 'weeks' ? 'semanas' : procForm.returnIntervalUnit === 'months' ? 'meses' : 'anos'} ({unitToDays(parseInt(procForm.returnInterval), procForm.returnIntervalUnit)} dias)</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tempo de Duração (minutos)</Label>
              <Input type="number" min="1" value={procForm.durationMinutes} onChange={(e) => setProcForm({ ...procForm, durationMinutes: e.target.value })} placeholder="Ex: 30" />
              {procForm.durationMinutes && parseInt(procForm.durationMinutes) > 0 && <p className="text-xs text-muted-foreground">Duração: {procForm.durationMinutes} min (+15 min para limpeza e organização entre consultas)</p>}
            </div>
            {dentists.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1"><UsersRound className="h-3 w-3" />Profissionais</Label>
                <div className="max-h-48 overflow-y-auto border border-border rounded-md p-3 bg-background scrollbar-thin">
                  <div className="space-y-1.5">
                    {dentists.map((d) => (
                      <label key={d.id} className="flex items-center gap-2 cursor-pointer text-sm hover:bg-muted/50 rounded px-1 py-0.5">
                        <Checkbox checked={procForm.selectedProfessionals.includes(d.id)} onCheckedChange={() => toggleProfessional(d.id)} />
                        <span>{d.full_name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{procForm.selectedProfessionals.length === 0 ? 'Nenhum selecionado = todos podem realizar' : `${procForm.selectedProfessionals.length} profissional(is) selecionado(s)`}</p>
              </div>
            )}
          </div>
          <DialogFooter className="shrink-0">
            <div className="flex w-full justify-between">
              <div>
                {editingProc && (
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => {
                    if (confirm('Tem certeza que deseja excluir este procedimento?')) {
                      deleteProcedure.mutate(editingProc.id);
                      setIsProcDialogOpen(false);
                    }
                  }}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" />Remover
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsProcDialogOpen(false)}>Cancelar</Button>
                <Button onClick={() => {
                  if (!procForm.title.trim()) { toast({ title: 'Erro', description: 'O título é obrigatório.', variant: 'destructive' }); return; }
                  const days = procForm.returnInterval ? unitToDays(parseInt(procForm.returnInterval, 10), procForm.returnIntervalUnit) : undefined;
                  const duration = procForm.durationMinutes ? parseInt(procForm.durationMinutes, 10) : undefined;
                  const profIds = procForm.selectedProfessionals.length > 0 ? procForm.selectedProfessionals : undefined;
                  if (editingProc) {
                    updateProcedure.mutate({ id: editingProc.id, title: procForm.title.trim(), description: procForm.description.trim() || null, return_interval_days: days ?? null, duration_minutes: duration ?? null, professional_ids: profIds || [] });
                    toast({ title: 'Sucesso', description: 'Procedimento atualizado!' });
                  } else {
                    addProcedure.mutate({ title: procForm.title.trim(), description: procForm.description.trim() || undefined, return_interval_days: days, duration_minutes: duration, professional_ids: profIds });
                    toast({ title: 'Sucesso', description: 'Procedimento adicionado!' });
                  }
                  setIsProcDialogOpen(false);
                }}>Salvar</Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team Member Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg flex flex-col">
          <DialogHeader className="shrink-0"><DialogTitle>{selectedMember ? 'Detalhes do Membro' : 'Adicionar Membro'}</DialogTitle><DialogDescription>{selectedMember ? 'Visualize e gerencie as informações do membro' : 'Adicione um membro diretamente à equipe'}</DialogDescription></DialogHeader>
          {(() => {
            const actions = selectedMember ? getMemberActions(currentMember, selectedMember) : null;
            const isSelf = selectedMember && currentMember && selectedMember.id === currentMember.id;
            const isEditingExisting = !!selectedMember;

            return (
              <>
                <div className="space-y-4 p-0.5">
                  {/* Name — read-only for others, editable only for new members */}
                  <div className="space-y-2">
                    <Label>Nome Completo {!isEditingExisting && '*'}</Label>
                    <Input
                      value={isEditingExisting && selectedMember?.is_owner ? (profile?.full_name || formData.fullName) : formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Ex: Dr. Roberto Almeida"
                      disabled={isEditingExisting}
                    />
                    {isEditingExisting && isSelf && (
                      <p className="text-xs text-muted-foreground">Edite seu nome em Configurações → Conta</p>
                    )}
                    {isEditingExisting && !isSelf && (
                      <p className="text-xs text-muted-foreground">Dados pessoais só podem ser editados pelo próprio membro</p>
                    )}
                  </div>

                  {/* Email — read-only for existing */}
                  <div className="space-y-2">
                    <Label>Email {!isEditingExisting && '*'}</Label>
                    <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@clinica.com" disabled={isEditingExisting} />
                  </div>

                  {/* Role — editable only if canChangeRole */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Função {!isEditingExisting && '*'}</Label>
                      {(isOwner || (actions?.canChangeRole)) && (
                        <button type="button" onClick={() => { setIsDialogOpen(false); setTimeout(() => setIsRolesDialogOpen(true), 100); }} className="text-xs text-primary hover:underline">Gerenciar funções</button>
                      )}
                    </div>
                    {(!isEditingExisting || actions?.canChangeRole) ? (
                      <ScrollArea className="h-[120px] rounded-md border border-border bg-background">
                        <div className="space-y-1.5 p-2">
                          {roles.map((role) => (
                            <label key={role.id} className="flex items-center gap-2 cursor-pointer text-sm hover:bg-muted/50 rounded px-1 py-0.5">
                              <Checkbox
                                checked={formData.roleIds.includes(role.id)}
                                onCheckedChange={() => toggleRole(role.id)}
                              />
                              <span className="flex items-center gap-1.5">
                                <span>{role.icon || '👤'}</span>
                                <span>{role.name}</span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="rounded-md border border-border bg-muted/30 p-3">
                        <div className="flex flex-wrap gap-1.5">
                          {formData.roleIds.map(rid => {
                            const role = getRoleById(rid);
                            return (
                              <Badge key={rid} variant="outline" className={getRoleBadgeColor(rid)}>
                                {role?.icon || '👤'} {role?.name || rid}
                              </Badge>
                            );
                          })}
                        </div>
                        {actions?.reason && (
                          <p className="text-xs text-muted-foreground mt-2">{actions.reason}</p>
                        )}
                      </div>
                    )}
                    {formData.roleIds.length > 0 && actions?.canChangeRole && (
                      <p className="text-xs text-muted-foreground">{formData.roleIds.length} função(ões) selecionada(s)</p>
                    )}
                  </div>

                  {/* Specialty — read-only for others */}
                  <div className="space-y-2">
                    <Label>Especialidades</Label>
                    <Input
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      placeholder="Especialidades"
                      disabled={isEditingExisting && !isSelf}
                    />
                  </div>

                  {/* Owner badge info */}
                  {selectedMember?.is_owner && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
                      <Crown className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                      <p className="text-sm text-warning-foreground">Este membro é o dono do workspace. Esta condição não pode ser alterada.</p>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <div className="flex w-full justify-between">
                    <div>
                      {selectedMember && actions?.canRemove && (
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => {
                          setMemberToDelete(selectedMember);
                          setIsDeleteDialogOpen(true);
                        }}>
                          <Trash2 className="h-3.5 w-3.5 mr-1" />Remover
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleCloseDialog}>
                        {isEditingExisting && !actions?.canChangeRole ? 'Fechar' : 'Cancelar'}
                      </Button>
                      {(!isEditingExisting || actions?.canChangeRole) && (
                        <Button onClick={handleSubmit}>{selectedMember ? 'Salvar' : 'Adicionar'}</Button>
                      )}
                    </div>
                  </div>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Convite</DialogTitle>
            <DialogDescription>Envie um convite por email para um novo membro da equipe</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Função</Label>
              <Select value={inviteForm.roleId} onValueChange={(v) => setInviteForm({ ...inviteForm, roleId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.icon} {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSendInvite} disabled={isSending} className="gap-2">
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar Convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar remoção</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja remover "{memberToDelete?.full_name}" da equipe?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteMember} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <RoleManagementDialog open={isRolesDialogOpen} onOpenChange={setIsRolesDialogOpen} />
    </MainLayout>
  );
}
