import { useState, useMemo } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useCustomRoles, type CustomRoleRow } from '@/hooks/useCustomRoles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Role, RolePermissions } from '@/types';
import { permissionCategories, defaultPermissions, roleIcons } from '@/types';
import { Plus, Pencil, Trash2, Shield, ChevronLeft, Users, Search, Copy, Settings2, Check, Palette } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PermissionsDialog } from './PermissionsDialog';

interface RoleManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SUGGESTED_COLORS = [
  { name: 'Azul', hex: '#3b82f6' },
  { name: 'Verde', hex: '#10b981' },
  { name: 'Amarelo', hex: '#f59e0b' },
  { name: 'Roxo', hex: '#8b5cf6' },
  { name: 'Rosa', hex: '#ec4899' },
  { name: 'Laranja', hex: '#f97316' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Vermelho', hex: '#ef4444' },
  { name: 'Índigo', hex: '#6366f1' },
  { name: 'Cinza', hex: '#6b7280' },
  { name: 'Verde Limão', hex: '#84cc16' },
  { name: 'Teal', hex: '#14b8a6' },
];

function getContrastColor(hex: string): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

function rowToRole(row: CustomRoleRow): Role {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    icon: row.icon || '👨‍💼',
    color: row.color || '#3b82f6',
    permissions: row.permissions as unknown as RolePermissions,
    isDefault: row.is_default ?? false,
    createdAt: row.created_at,
  };
}

export function RoleManagementDialog({ open, onOpenChange }: RoleManagementDialogProps) {
  const { teamMembers, updateTeamMember } = useTeamMembers();
  const { isOwner } = useWorkspace();
  const { roles: roleRows, addRole, updateRole, deleteRole } = useCustomRoles();

  const roles = useMemo(() => roleRows.map(rowToRole), [roleRows]);

  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [transferRoleId, setTransferRoleId] = useState<string>('');
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '👨‍💼',
    color: '#3b82f6',
    permissions: { ...defaultPermissions } as RolePermissions,
  });

  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return roles;
    const query = searchQuery.toLowerCase();
    return roles.filter((r) => r.name.toLowerCase().includes(query) || r.description?.toLowerCase().includes(query));
  }, [roles, searchQuery]);

  const resetForm = () => {
    const suggestedColor = getSuggestedColor();
    setFormData({ name: '', description: '', icon: '👨‍💼', color: suggestedColor, permissions: { ...defaultPermissions } });
    setEditingRole(null);
    setShowColorPicker(false);
  };

  const getSuggestedColor = () => {
    const usedColors = roles.map(r => r.color);
    const available = SUGGESTED_COLORS.find(c => !usedColors.includes(c.hex));
    return available?.hex || '#3b82f6';
  };

  const handleOpenForm = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({ name: role.name, description: role.description || '', icon: role.icon || '👨‍💼', color: role.color || '#3b82f6', permissions: { ...role.permissions } });
    } else { resetForm(); }
    setShowColorPicker(false);
    setView('form');
  };

  const handleDuplicateRole = (role: Role) => {
    setEditingRole(null);
    setFormData({ name: `Cópia de ${role.name}`, description: role.description || '', icon: role.icon || '👨‍💼', color: getSuggestedColor(), permissions: { ...role.permissions } });
    setShowColorPicker(false);
    setView('form');
  };

  const handleBack = () => { setView('list'); resetForm(); };
  const handleClose = () => { onOpenChange(false); setTimeout(() => { setView('list'); resetForm(); setSearchQuery(''); }, 200); };

  const handleSubmit = async () => {
    if (!formData.name.trim()) { toast({ title: 'Erro', description: 'Informe o nome da função.', variant: 'destructive' }); return; }
    const existingRole = roles.find((r) => r.name.toLowerCase() === formData.name.toLowerCase() && r.id !== editingRole?.id);
    if (existingRole) { toast({ title: 'Erro', description: 'Já existe uma função com este nome.', variant: 'destructive' }); return; }
    const hasAnyPermission = Object.values(formData.permissions).some(Boolean);
    if (!hasAnyPermission) { toast({ title: 'Erro', description: 'Selecione pelo menos uma permissão.', variant: 'destructive' }); return; }

    try {
      if (editingRole) {
        const membersAffected = teamMembers.filter(m => m.role_id === editingRole.id).length;
        await updateRole({ id: editingRole.id, name: formData.name, description: formData.description || undefined, icon: formData.icon, color: formData.color, permissions: formData.permissions });
        toast({ title: 'Sucesso', description: membersAffected > 0 ? `Função atualizada! ${membersAffected} membro(s) afetado(s).` : 'Função atualizada com sucesso!' });
      } else {
        await addRole({ name: formData.name, description: formData.description || undefined, icon: formData.icon, color: formData.color, permissions: formData.permissions });
        toast({ title: 'Sucesso', description: 'Função criada com sucesso!' });
      }
      handleBack();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return;
    const membersUsingRole = teamMembers.filter((m) => m.role_id === roleToDelete.id);
    if (membersUsingRole.length > 0 && !transferRoleId) { toast({ title: 'Erro', description: 'Selecione uma função para transferir os membros.', variant: 'destructive' }); return; }

    try {
      if (membersUsingRole.length > 0 && transferRoleId) {
        for (const member of membersUsingRole) {
          await updateTeamMember({ id: member.id, role_id: transferRoleId });
        }
      }
      await deleteRole(roleToDelete.id);
      toast({ title: 'Sucesso', description: membersUsingRole.length > 0 ? `Função excluída e ${membersUsingRole.length} membro(s) transferido(s).` : 'Função excluída com sucesso!' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
    setRoleToDelete(null);
    setTransferRoleId('');
  };

  const handlePermissionsSave = (permissions: RolePermissions) => { setFormData((prev) => ({ ...prev, permissions })); };
  const getMembersCount = (roleId: string) => teamMembers.filter((m) => m.role_id === roleId).length;
  const getPermissionCount = (role: Role) => Object.values(role.permissions).filter(Boolean).length;
  const getMainPermissions = (role: Role) => {
    const allPerms: string[] = [];
    permissionCategories.forEach(cat => cat.permissions.forEach(p => { if (role.permissions[p.key]) allPerms.push(p.label); }));
    return allPerms.slice(0, 4);
  };

  const availableRolesForTransfer = roles.filter(r => r.id !== roleToDelete?.id);
  const membersToTransfer = roleToDelete ? teamMembers.filter(m => m.role_id === roleToDelete.id).length : 0;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-4 pb-3 border-b border-border shrink-0">
            {view === 'list' ? (
              <><DialogTitle className="flex items-center gap-2 text-base"><Shield className="h-4 w-4 text-primary" />Gerenciar Funções</DialogTitle><DialogDescription className="text-xs">Crie e gerencie as funções da sua equipe</DialogDescription></>
            ) : (
              <><div className="flex items-center gap-2"><Button variant="ghost" size="icon" onClick={handleBack} className="h-7 w-7"><ChevronLeft className="h-4 w-4" /></Button><DialogTitle className="text-base">{editingRole ? 'Editar Função' : 'Nova Função'}</DialogTitle></div><DialogDescription className="pl-9 text-xs">{editingRole ? `Atualize as informações e permissões da função "${editingRole.name}"` : 'Defina o nome, ícone e as permissões da nova função'}</DialogDescription></>
            )}
          </DialogHeader>

          {view === 'list' ? (
            <>
              <div className="px-5 py-2 flex flex-col sm:flex-row gap-2 border-b border-border bg-muted/30 shrink-0">
                <Button size="sm" className="gap-2" onClick={() => handleOpenForm()}><Plus className="h-3.5 w-3.5" />Nova Função</Button>
                <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><Input placeholder="Buscar funções..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-8 text-sm" /></div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-0.5">
                <div className="py-3 space-y-3 px-5">
                  {filteredRoles.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground"><Shield className="h-12 w-12 mx-auto mb-3 opacity-50" /><p className="text-lg font-medium">{searchQuery ? 'Nenhuma função encontrada' : 'Nenhuma função criada ainda'}</p></div>
                  ) : (
                    filteredRoles.map((role) => {
                      const membersCount = getMembersCount(role.id);
                      const permCount = getPermissionCount(role);
                      const mainPerms = getMainPermissions(role);
                      return (
                        <Card key={role.id} className="overflow-hidden hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl shrink-0" style={{ backgroundColor: (role.color || '#3b82f6') + '1a' }}>
                                {role.icon || '👨‍💼'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-semibold text-foreground">{role.name}</h4>
                                  <span className="inline-block w-3 h-3 rounded-full shrink-0 border border-border" style={{ backgroundColor: role.color || '#3b82f6' }} />
                                  {role.isDefault && <Badge variant="secondary" className="text-xs">Padrão</Badge>}
                                </div>
                                {role.description && <p className="text-sm text-muted-foreground mt-0.5">{role.description}</p>}
                                <div className="flex flex-wrap gap-1.5 mt-2">{mainPerms.map((perm, idx) => <span key={idx} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">• {perm}</span>)}{permCount > 4 && <span className="text-xs text-muted-foreground">+{permCount - 4} mais</span>}</div>
                                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{membersCount} {membersCount === 1 ? 'membro' : 'membros'}</span><span>{permCount} permissões ativas</span></div>
                              </div>
                              <div className="flex gap-1.5 shrink-0">
                                <Button variant="outline" size="sm" onClick={() => handleDuplicateRole(role)} title="Duplicar função"><Copy className="h-3.5 w-3.5" /></Button>
                                {/* Admin role: only owner can edit, never deletable */}
                                {role.id === 'admin' ? (
                                  isOwner && <Button variant="outline" size="sm" onClick={() => handleOpenForm(role)}><Pencil className="h-3.5 w-3.5 mr-1" />Editar</Button>
                                ) : (
                                  <>
                                    <Button variant="outline" size="sm" onClick={() => handleOpenForm(role)}><Pencil className="h-3.5 w-3.5 mr-1" />Editar</Button>
                                    {!role.isDefault && <Button variant="outline" size="sm" onClick={() => setRoleToDelete(role)} className="text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>}
                                  </>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="px-6 py-1 flex-1 min-h-0 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="py-5 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4">
                    <div className="space-y-2"><Label>Ícone</Label><div className="flex flex-wrap gap-1.5 p-2 border border-border rounded-lg bg-muted/30 max-w-[180px]">{roleIcons.map((icon) => (<button key={icon} type="button" onClick={() => setFormData({ ...formData, icon })} className={cn('w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all', formData.icon === icon ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted')}>{icon}</button>))}</div></div>
                    <div className="space-y-4">
                      <div className="space-y-2"><Label>Nome da Função *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Enfermeiro, Auxiliar, Técnico" /></div>
                      <div className="space-y-2"><Label>Descrição (opcional)</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Breve descrição das responsabilidades desta função..." rows={2} /></div>
                    </div>
                  </div>

                  {/* Color Picker */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2"><Palette className="h-4 w-4" />Cor da Função</Label>
                    <p className="text-xs text-muted-foreground">Escolha uma cor para identificar visualmente esta função</p>

                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="w-14 h-14 rounded-lg border-2 border-border hover:border-foreground/30 transition-colors shadow-sm shrink-0 relative group"
                        style={{ backgroundColor: formData.color }}
                      >
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="h-7 w-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/50 transition-colors">
                            <Pencil className="h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                          </span>
                        </span>
                      </button>
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-1.5">
                          {SUGGESTED_COLORS.map((c) => {
                            const isUsed = roles.some(r => r.color === c.hex && r.id !== editingRole?.id);
                            return (
                              <button
                                key={c.hex}
                                type="button"
                                onClick={() => setFormData({ ...formData, color: c.hex })}
                                className={cn(
                                  'w-8 h-8 rounded-md border-2 transition-all',
                                  formData.color === c.hex ? 'border-foreground ring-2 ring-offset-2 ring-foreground/20' : 'border-border hover:border-foreground/30',
                                  isUsed && 'opacity-40'
                                )}
                                style={{ backgroundColor: c.hex }}
                                title={`${c.name}${isUsed ? ' (em uso)' : ''}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {showColorPicker && (
                      <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                        <HexColorPicker
                          color={formData.color}
                          onChange={(color) => setFormData({ ...formData, color })}
                          style={{ width: '100%', height: '160px' }}
                        />
                        <div className="flex items-center gap-3">
                          <Label className="text-xs shrink-0">HEX:</Label>
                          <Input
                            value={formData.color}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setFormData({ ...formData, color: v });
                            }}
                            className="h-8 w-28 font-mono text-xs uppercase"
                            maxLength={7}
                          />
                        </div>
                      </div>
                    )}

                    {/* Preview */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Preview:</span>
                      <span
                        className="px-3 py-1 rounded-full text-sm font-medium shadow-sm"
                        style={{ backgroundColor: formData.color, color: getContrastColor(formData.color) }}
                      >
                        {formData.name || 'Nome da Função'}
                      </span>
                    </div>
                  </div>

                  {(() => {
                    const totalEnabled = Object.values(formData.permissions).filter(Boolean).length;
                    const totalPermissions = Object.keys(formData.permissions).length;
                    const categoryPreviews = permissionCategories.map(cat => ({ icon: cat.icon, label: cat.label, enabled: cat.permissions.filter(p => formData.permissions[p.key]).length, total: cat.permissions.length })).filter(c => c.enabled > 0);
                    return (
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">Permissões e Limitações *</Label>
                        <div className={cn('rounded-lg border p-5 transition-all duration-200 cursor-pointer hover:shadow-sm', totalEnabled > 0 ? 'border-primary/20 bg-primary/[0.02]' : 'border-border bg-muted/30')} onClick={() => setIsPermissionsOpen(true)}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0"><Shield className="h-5 w-5 text-primary" /></div><div><p className="font-semibold text-sm text-foreground">Permissões Configuradas</p><p className="text-xs text-muted-foreground mt-0.5">{totalEnabled > 0 ? `${totalEnabled} de ${totalPermissions} permissões ativas` : 'Nenhuma permissão selecionada'}</p></div></div>
                            <Badge variant="secondary" className={cn('text-xs font-semibold px-2.5 py-1', totalEnabled === totalPermissions && 'bg-primary/10 text-primary', totalEnabled > 0 && totalEnabled < totalPermissions && 'bg-warning/10 text-warning', totalEnabled === 0 && 'bg-muted text-muted-foreground')}><Check className="h-3 w-3 mr-1" />{totalEnabled}/{totalPermissions}</Badge>
                          </div>
                          {categoryPreviews.length > 0 && <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/50">{categoryPreviews.map((cat) => <span key={cat.label} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{cat.icon} {cat.label} ({cat.enabled}/{cat.total})</span>)}</div>}
                          <Button type="button" variant="outline" size="sm" className="mt-4 gap-2 w-full" onClick={(e) => { e.stopPropagation(); setIsPermissionsOpen(true); }}><Settings2 className="h-4 w-4" />Gerenciar Permissões</Button>
                        </div>
                      </div>
                    );
                  })()}

                  {editingRole && getMembersCount(editingRole.id) > 0 && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20"><span className="text-lg">⚠️</span><div><p className="font-medium text-warning-foreground">{getMembersCount(editingRole.id)} membro(s) usam esta função</p><p className="text-sm text-warning-foreground/80">As alterações de permissões afetarão todos esses membros imediatamente.</p></div></div>
                  )}
                </div>
              </div>
              <DialogFooter className="px-6 py-4 border-t border-border bg-muted/30 shrink-0"><Button variant="outline" onClick={handleBack}>Cancelar</Button><Button onClick={handleSubmit}>{editingRole ? 'Salvar Alterações' : 'Criar Função'}</Button></DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!roleToDelete} onOpenChange={() => { setRoleToDelete(null); setTransferRoleId(''); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><span className="text-destructive">⚠️</span>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Tem certeza que deseja excluir a função "{roleToDelete?.name}"?</p>
              {membersToTransfer > 0 && (
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20"><p className="font-medium text-warning-foreground mb-2">⚠️ {membersToTransfer} membro(s) usam esta função</p><p className="text-sm text-warning-foreground/80 mb-3">Escolha para qual função transferir esses membros:</p><Select value={transferRoleId} onValueChange={setTransferRoleId}><SelectTrigger><SelectValue placeholder="Selecione uma função..." /></SelectTrigger><SelectContent>{availableRolesForTransfer.map((role) => <SelectItem key={role.id} value={role.id}>{role.icon} {role.name}</SelectItem>)}</SelectContent></Select></div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setTransferRoleId('')}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={membersToTransfer > 0 && !transferRoleId}>Excluir Função</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PermissionsDialog open={isPermissionsOpen} onOpenChange={setIsPermissionsOpen} permissions={formData.permissions} onSave={handlePermissionsSave} />
    </>
  );
}
