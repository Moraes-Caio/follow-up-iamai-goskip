import { useState } from 'react';
import { useProcedures } from '@/hooks/useProcedures';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useCustomRoles } from '@/hooks/useCustomRoles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, X, Check, Users } from 'lucide-react';

interface ManageProceduresDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProcedureUpdated?: (procedure: { id: string; title: string; return_interval_days: number | null }) => void;
}

export function ManageProceduresDialog({ open, onOpenChange, onProcedureUpdated }: ManageProceduresDialogProps) {
  const { procedures, addProcedure, updateProcedure, deleteProcedure } = useProcedures();
  const { teamMembers } = useTeamMembers();
  const { roles } = useCustomRoles();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [returnInterval, setReturnInterval] = useState('');
  const [returnIntervalUnit, setReturnIntervalUnit] = useState<'days' | 'weeks' | 'months' | 'years'>('months');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [cleanupMinutes, setCleanupMinutes] = useState('15');
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const dentists = teamMembers.filter((m) => {
    if (!m.is_active) return false;
    const roleIds = m.role_id.split(',').map(id => id.trim());
    return roleIds.some(rid => {
      const role = roles.find((r) => r.id === rid);
      return role?.name.toLowerCase().includes('dentista');
    });
  });

  const resetForm = () => { setTitle(''); setDescription(''); setReturnInterval(''); setReturnIntervalUnit('months'); setDurationMinutes(''); setCleanupMinutes('15'); setSelectedProfessionals([]); setEditingId(null); setIsAdding(false); };

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

  const handleStartEdit = (proc: typeof procedures[0]) => {
    setEditingId(proc.id); setTitle(proc.title); setDescription(proc.description || '');
    const converted = proc.return_interval_days ? daysToUnit(proc.return_interval_days) : { value: '', unit: 'months' as const };
    setReturnInterval(converted.value.toString()); setReturnIntervalUnit(converted.unit);
    setDurationMinutes(proc.duration_minutes ? proc.duration_minutes.toString() : '');
    setCleanupMinutes((proc.cleanup_minutes ?? 15).toString());
    setSelectedProfessionals(proc.professional_ids || []); setIsAdding(false);
  };

  const handleToggleProfessional = (id: string) => {
    setSelectedProfessionals((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  };

  const handleSave = () => {
    if (!title.trim()) { toast({ title: 'Erro', description: 'O título é obrigatório.', variant: 'destructive' }); return; }
    if (!returnInterval || isNaN(parseInt(returnInterval)) || parseInt(returnInterval) < 1) { toast({ title: 'Erro', description: 'O tempo de retorno é obrigatório e deve ser maior que 0.', variant: 'destructive' }); return; }
    if (!durationMinutes || isNaN(parseInt(durationMinutes)) || parseInt(durationMinutes) < 1) { toast({ title: 'Erro', description: 'O tempo de duração é obrigatório e deve ser maior que 0.', variant: 'destructive' }); return; }
    const cleanupVal = parseInt(cleanupMinutes);
    if (isNaN(cleanupVal) || cleanupVal < 0) { toast({ title: 'Erro', description: 'O tempo de limpeza deve ser 0 ou maior.', variant: 'destructive' }); return; }
    const isDuplicate = procedures.some((p) => p.title.toLowerCase() === title.trim().toLowerCase() && p.id !== editingId);
    if (isDuplicate) { toast({ title: 'Erro', description: 'Já existe um procedimento com este título.', variant: 'destructive' }); return; }
    const profIds = selectedProfessionals.length > 0 ? selectedProfessionals : undefined;
    const days = unitToDays(parseInt(returnInterval, 10), returnIntervalUnit);
    const duration = parseInt(durationMinutes, 10);

    if (editingId) {
      updateProcedure.mutate({ id: editingId, title: title.trim(), description: description.trim() || null, professional_ids: profIds || [], return_interval_days: days ?? null, duration_minutes: duration ?? null, cleanup_minutes: cleanupVal }, {
        onSuccess: () => {
          onProcedureUpdated?.({ id: editingId, title: title.trim(), return_interval_days: days ?? null });
        },
      });
      toast({ title: 'Sucesso', description: 'Procedimento atualizado!' });
    } else {
      addProcedure.mutate({ title: title.trim(), description: description.trim() || undefined, professional_ids: profIds, return_interval_days: days, duration_minutes: duration, cleanup_minutes: cleanupVal });
      toast({ title: 'Sucesso', description: 'Procedimento adicionado!' });
    }
    resetForm();
  };

  const handleDelete = () => {
    if (deleteId) { deleteProcedure.mutate(deleteId); toast({ title: 'Sucesso', description: 'Procedimento excluído!' }); setDeleteId(null); }
  };

  const getProfessionalNames = (ids?: string[] | null) => {
    if (!ids || ids.length === 0) return 'Todos os profissionais';
    return ids.map((id) => teamMembers.find((m) => m.id === id)?.full_name).filter(Boolean).join(', ');
  };

  const isFormOpen = isAdding || !!editingId;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
         <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader><DialogTitle>Gerenciar Procedimentos</DialogTitle><DialogDescription>Adicione, edite ou remova procedimentos</DialogDescription></DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 p-1">
            {!isFormOpen && (<Button variant="outline" size="sm" className="w-full gap-2" onClick={() => { resetForm(); setIsAdding(true); }}><Plus className="h-4 w-4" />Novo Procedimento</Button>)}
            {isFormOpen && (
              <div className="space-y-2 rounded-lg border border-border p-3 bg-muted/30">
                <div className="space-y-1"><Label className="text-xs">Título *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Limpeza Dental" autoFocus /></div>
                <div className="space-y-1"><Label className="text-xs">Descrição (opcional)</Label><Input value={description} onChange={(e) => setDescription(e.target.value.slice(0, 150))} placeholder="Breve descrição" /><p className="text-xs text-muted-foreground text-right">{description.length}/150</p></div>
                <div className="space-y-1"><Label className="text-xs">Tempo de Retorno *</Label><div className="flex gap-2"><Input type="number" min="1" value={returnInterval} onChange={(e) => setReturnInterval(e.target.value)} placeholder="6" className="flex-1" /><Select value={returnIntervalUnit} onValueChange={(v) => setReturnIntervalUnit(v as any)}><SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="days">Dias</SelectItem><SelectItem value="weeks">Semanas</SelectItem><SelectItem value="months">Meses</SelectItem><SelectItem value="years">Anos</SelectItem></SelectContent></Select></div>{returnInterval && parseInt(returnInterval) > 0 && <p className="text-xs text-primary">Retorno a cada {returnInterval} {returnIntervalUnit === 'days' ? 'dias' : returnIntervalUnit === 'weeks' ? 'semanas' : returnIntervalUnit === 'months' ? 'meses' : 'anos'}</p>}</div>
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Duração (min) *</Label>
                      <Input type="number" min="1" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} placeholder="Ex: 30" required />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Limpeza (min)</Label>
                      <Input type="number" min="0" value={cleanupMinutes} onChange={(e) => setCleanupMinutes(e.target.value)} placeholder="15" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Tempo de limpeza e organização entre consultas.</p>
                  {durationMinutes && parseInt(durationMinutes) > 0 && <p className="text-xs text-primary">Duração total: {parseInt(durationMinutes) + (parseInt(cleanupMinutes) || 0)} min ({durationMinutes} min + {cleanupMinutes || '0'} min)</p>}
                </div>
                {dentists.length > 0 && (
                  <div className="space-y-1.5"><Label className="text-xs flex items-center gap-1"><Users className="h-3 w-3" />Profissionais</Label><div className="max-h-48 overflow-y-auto border border-border rounded-md p-3 bg-background scrollbar-thin"><div className="space-y-1.5">{dentists.map((d) => (<label key={d.id} className="flex items-center gap-2 cursor-pointer text-sm hover:bg-muted/50 rounded px-1 py-0.5"><Checkbox checked={selectedProfessionals.includes(d.id)} onCheckedChange={() => handleToggleProfessional(d.id)} /><span>{d.full_name}</span></label>))}</div></div><p className="text-xs text-muted-foreground">{selectedProfessionals.length === 0 ? 'Nenhum selecionado = todos podem realizar' : `${selectedProfessionals.length} profissional(is) selecionado(s)`}</p></div>
                )}
                <div className="flex gap-2 justify-end"><Button variant="ghost" size="sm" onClick={resetForm}><X className="h-4 w-4" /></Button><Button size="sm" onClick={handleSave}><Check className="h-4 w-4 mr-1" />Salvar</Button></div>
              </div>
            )}
            {!isFormOpen && procedures.map((proc) => (
              <div key={proc.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="min-w-0"><p className="font-medium text-sm text-foreground truncate">{proc.title}</p>{proc.description && <p className="text-xs text-muted-foreground truncate">{proc.description}</p>}<div className="flex items-center gap-3 mt-0.5"><p className="text-xs text-muted-foreground/70 truncate flex items-center gap-1"><Users className="h-3 w-3" />{getProfessionalNames(proc.professional_ids)}</p>{proc.return_interval_days && proc.return_interval_days > 0 && <p className="text-xs text-primary font-medium">↻ {proc.return_interval_days}d</p>}{proc.duration_minutes && proc.duration_minutes > 0 && <p className="text-xs text-muted-foreground font-medium">⏱ {proc.duration_minutes}min</p>}</div></div>
                <div className="flex gap-1 shrink-0"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStartEdit(proc)}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteId(proc.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></div>
              </div>
            ))}
            {!isFormOpen && procedures.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">Nenhum procedimento cadastrado</p>}
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir procedimento?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </>
  );
}