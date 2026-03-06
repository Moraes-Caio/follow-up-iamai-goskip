import { useState, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useReminderTemplates, type ReminderTemplateRow } from '@/hooks/useReminderTemplates';
import { useProcedures } from '@/hooks/useProcedures';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import { StatusBadge } from '@/components/ui/status-badge';
import { Plus, Bell, Calendar, Pencil, Trash2, Sparkles, Loader2, Copy, Wand2, Filter, Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ManageProceduresDialog } from '@/components/procedures/ManageProceduresDialog';
import { VariableEditor, type VariableEditorRef } from '@/components/reminders/VariableEditor';

export default function Reminders() {
  const { templates: reminderTemplates, addTemplate, updateTemplate, deleteTemplate, isLoading } = useReminderTemplates();
  const { procedures } = useProcedures();
  const [isProceduresOpen, setIsProceduresOpen] = useState(false);
  const [procPopoverOpen, setProcPopoverOpen] = useState(false);
  const [procSearch, setProcSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReminderTemplateRow | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<ReminderTemplateRow | null>(null);
  const [isImproving, setIsImproving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const editorRef = useRef<VariableEditorRef>(null);

  const [filterType, setFilterType] = useState('all');
  const [filterProcedure, setFilterProcedure] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    type: 'periodic_return' as 'periodic_return' | 'appointment_confirmation',
    procedureName: '',
    procedureId: '' as string,
    returnInterval: '',
    returnIntervalUnit: 'months' as 'days' | 'weeks' | 'months' | 'years',
    sendBefore: '',
    sendBeforeUnit: 'days' as 'days' | 'weeks' | 'months',
    daysBeforeAppointment: '',
    messageTemplate: '',
    isActive: true,
  });

  const handleProcedureFilterChange = (value: string) => {
    setFilterProcedure(value);
    if (value !== 'all') {
      setFilterType('periodic_return');
    }
  };

  const filteredTemplates = useMemo(() => {
    return reminderTemplates.filter((t) => {
      // Filter 1
      if (filterType === 'active' && !t.is_active) return false;
      if (filterType === 'inactive' && t.is_active) return false;
      if (filterType === 'appointment_confirmation' && t.type !== 'appointment_confirmation') return false;
      if (filterType === 'periodic_return' && t.type !== 'periodic_return') return false;
      // Filter 2
      if (filterProcedure !== 'all' && t.procedure_name !== filterProcedure) return false;
      return true;
    });
  }, [reminderTemplates, filterType, filterProcedure]);

  const resetForm = () => {
    setFormData({
      name: '', type: 'periodic_return', procedureName: '', procedureId: '',
      returnInterval: '', returnIntervalUnit: 'months', sendBefore: '', sendBeforeUnit: 'days',
      daysBeforeAppointment: '',
      messageTemplate: '', isActive: true,
    });
    setSelectedTemplate(null);
  };

  // Convert days to best-fit display unit
  const daysToDisplayUnit = (days: number): { value: number; unit: 'days' | 'weeks' | 'months' | 'years' } => {
    if (days > 0 && days % 365 === 0) return { value: days / 365, unit: 'years' };
    if (days > 0 && days % 30 === 0) return { value: days / 30, unit: 'months' };
    if (days > 0 && days % 7 === 0) return { value: days / 7, unit: 'weeks' };
    return { value: days, unit: 'days' };
  };

  // Convert display unit back to days
  const displayUnitToDays = (value: number, unit: string): number => {
    if (unit === 'years') return value * 365;
    if (unit === 'months') return value * 30;
    if (unit === 'weeks') return value * 7;
    return value;
  };

  const handleOpenDialog = (template?: ReminderTemplateRow) => {
    if (template) {
      setSelectedTemplate(template);
      // For periodic_return with a linked procedure, use the procedure's current interval
      let intervalDays = template.return_interval || 0;
      if (template.type === 'periodic_return' && template.procedure_id) {
        const linkedProc = procedures.find(p => p.id === template.procedure_id);
        if (linkedProc?.return_interval_days && linkedProc.return_interval_days > 0) {
          intervalDays = linkedProc.return_interval_days;
        }
      }
      const ri = daysToDisplayUnit(intervalDays);
      const sb = daysToDisplayUnit(template.send_before || 0);
      setFormData({
        name: template.name,
        type: template.type,
        procedureName: template.procedure_name || '',
        procedureId: template.procedure_id || '',
        returnInterval: ri.value ? ri.value.toString() : '',
        returnIntervalUnit: ri.unit,
        sendBefore: sb.value ? sb.value.toString() : '',
        sendBeforeUnit: sb.unit as any,
        daysBeforeAppointment: template.days_before_appointment?.toString() || '',
        messageTemplate: template.message_template,
        isActive: template.is_active ?? true,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => { setIsDialogOpen(false); resetForm(); };

  // Webhook: Generate message
  const availableVariables = [
    { key: '{nome_paciente}', description: 'Nome completo do paciente' },
    { key: '{nome_responsavel}', description: 'Nome do responsável (ou do paciente se não houver)' },
    { key: '{idade}', description: 'Idade do paciente' },
    { key: '{procedimento}', description: 'Nome do procedimento' },
    { key: '{data}', description: 'Data da consulta ou retorno' },
    { key: '{horario}', description: 'Horário da consulta' },
    { key: '{clinica}', description: 'Nome da clínica' },
  ];

  const getSelectedProcedureInfo = () => {
    if (!formData.procedureName) return null;
    const proc = procedures.find(p => p.title === formData.procedureName);
    if (!proc) return { titulo: formData.procedureName };
    return {
      titulo: proc.title,
      descricao: proc.description || '',
      duracao_minutos: proc.duration_minutes || null,
      intervalo_retorno_dias: proc.return_interval_days || null,
    };
  };

  const buildWebhookPayload = (acao: 'gerar' | 'melhorar') => {
    const payload: Record<string, any> = {
      acao,
      tipo_lembrete: formData.type === 'periodic_return' ? 'retorno_periodico' : 'confirmacao_consulta',
      procedimento: formData.procedureName || '',
      informacoes_procedimento: getSelectedProcedureInfo(),
      variaveis_disponiveis: availableVariables,
    };
    if (acao === 'melhorar') {
      payload.mensagem_atual = formData.messageTemplate;
    }
    return payload;
  };

  const callAiMessage = async (payload: Record<string, any>) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) throw new Error('Não autenticado');

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/n8n-webhook?action=ai-message`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro no serviço');
    }
    return res.json();
  };

  const handleGenerateMessage = async () => {
    setIsGenerating(true);
    try {
      const data = await callAiMessage(buildWebhookPayload('gerar'));
      if (!data.mensagem) {
        toast({ title: 'Erro', description: 'Resposta inesperada do serviço.', variant: 'destructive' });
        return;
      }
      if (formData.messageTemplate.trim()) {
        setPendingMessage(data.mensagem);
        setConfirmReplace(true);
      } else {
        setFormData(prev => ({ ...prev, messageTemplate: data.mensagem }));
        editorRef.current?.setContent(data.mensagem);
        toast({ title: 'Mensagem gerada!', description: 'A mensagem foi criada com sucesso.' });
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: 'Não foi possível conectar ao serviço de IA. Tente novamente.', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  // Webhook: Improve message
  const handleImproveWithAI = async () => {
    if (!formData.messageTemplate.trim()) {
      toast({ title: 'Erro', description: 'Escreva uma mensagem primeiro para melhorar com IA.', variant: 'destructive' });
      return;
    }

    setIsImproving(true);
    try {
      const data = await callAiMessage(buildWebhookPayload('melhorar'));
      if (!data.mensagem) {
        toast({ title: 'Erro', description: 'Resposta inesperada do serviço.', variant: 'destructive' });
        return;
      }
      setFormData(prev => ({ ...prev, messageTemplate: data.mensagem }));
      editorRef.current?.setContent(data.mensagem);
      toast({ title: 'Mensagem melhorada!', description: 'A IA aprimorou sua mensagem.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: 'Não foi possível conectar ao serviço de IA. Tente novamente.', variant: 'destructive' });
    } finally {
      setIsImproving(false);
    }
  };

  const handleConfirmReplaceMessage = () => {
    setFormData(prev => ({ ...prev, messageTemplate: pendingMessage }));
    editorRef.current?.setContent(pendingMessage);
    setPendingMessage('');
    setConfirmReplace(false);
    toast({ title: 'Mensagem gerada!', description: 'A mensagem foi substituída com sucesso.' });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.messageTemplate) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios.', variant: 'destructive' });
      return;
    }

    const nameExists = reminderTemplates.some(
      (t) => t.name.toLowerCase() === formData.name.trim().toLowerCase() && t.id !== selectedTemplate?.id
    );
    if (nameExists) {
      toast({ title: 'Erro', description: 'Já existe um lembrete com esse nome. Escolha outro nome.', variant: 'destructive' });
      return;
    }

    if (formData.type === 'periodic_return') {
      const interval = parseInt(formData.returnInterval);
      if (!formData.returnInterval || isNaN(interval) || interval < 1 || interval > 300) {
        toast({ title: 'Erro', description: 'O intervalo de retorno deve ser entre 1 e 300.', variant: 'destructive' });
        return;
      }
      const sendBefore = parseInt(formData.sendBefore);
      if (!formData.sendBefore || isNaN(sendBefore) || sendBefore < 1 || sendBefore > 300) {
        toast({ title: 'Erro', description: 'O campo "Enviar antes do retorno" deve ser entre 1 e 300.', variant: 'destructive' });
        return;
      }
    }

    if (formData.type === 'appointment_confirmation') {
      const days = parseInt(formData.daysBeforeAppointment);
      if (!formData.daysBeforeAppointment || isNaN(days) || days < 1 || days > 10) {
        toast({ title: 'Erro', description: 'O número de dias antes da consulta deve ser entre 1 e 10.', variant: 'destructive' });
        return;
      }
    }

    const templateData = {
      name: formData.name,
      type: formData.type as 'periodic_return' | 'appointment_confirmation',
      message_template: formData.messageTemplate,
      is_active: formData.isActive,
      procedure_name: formData.type === 'periodic_return' ? formData.procedureName || null : null,
      procedure_id: formData.type === 'periodic_return' ? formData.procedureId || null : null,
      return_interval: formData.type === 'periodic_return' ? displayUnitToDays(parseInt(formData.returnInterval) || 0, formData.returnIntervalUnit) || null : null,
      send_before: formData.type === 'periodic_return' ? displayUnitToDays(parseInt(formData.sendBefore) || 0, formData.sendBeforeUnit) || null : null,
      days_before_appointment: formData.type === 'appointment_confirmation' ? (parseInt(formData.daysBeforeAppointment) || null) : null,
    };

    try {
      if (selectedTemplate) {
        await updateTemplate({ id: selectedTemplate.id, ...templateData });
        toast({ title: 'Sucesso', description: 'Lembrete atualizado com sucesso!' });
      } else {
        await addTemplate(templateData);
        toast({ title: 'Sucesso', description: 'Lembrete criado com sucesso!' });
      }
      handleCloseDialog();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteTemplate = async () => {
    if (templateToDelete) {
      try {
        await deleteTemplate(templateToDelete.id);
        toast({ title: 'Sucesso', description: 'Lembrete excluído com sucesso!' });
      } catch (err: any) {
        toast({ title: 'Erro', description: err.message, variant: 'destructive' });
      }
      setTemplateToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleDuplicate = async (template: ReminderTemplateRow) => {
    const baseName = `Copia do ${template.name}`;
    let newName = baseName;
    let counter = 1;
    while (reminderTemplates.some((t) => t.name === newName)) {
      newName = `${baseName} ${counter}`;
      counter++;
    }
    try {
      await addTemplate({
        name: newName,
        type: template.type,
        message_template: template.message_template,
        is_active: template.is_active,
        procedure_name: template.procedure_name,
        procedure_id: template.procedure_id,
        return_interval: template.return_interval,
        send_before: template.send_before,
        days_before_appointment: template.days_before_appointment,
      });
      toast({ title: 'Sucesso', description: 'Lembrete duplicado com sucesso!' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleToggleActive = async (template: ReminderTemplateRow) => {
    try {
      await updateTemplate({ id: template.id, is_active: !template.is_active });
      toast({ title: 'Sucesso', description: `Lembrete ${!template.is_active ? 'ativado' : 'desativado'}!` });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const formatUpdatedAt = (template: ReminderTemplateRow) => {
    const dateStr = (template as any).updated_at || template.created_at;
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return `Última edição: ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } catch { return null; }
  };

  const confirmationTemplates = useMemo(() => filteredTemplates.filter(t => t.type === 'appointment_confirmation'), [filteredTemplates]);
  const returnTemplates = useMemo(() => filteredTemplates.filter(t => t.type === 'periodic_return'), [filteredTemplates]);

  const ReminderCard = ({ template }: { template: ReminderTemplateRow }) => {
    const isActive = template.is_active ?? true;
    return (
      <Card className={cn("overflow-hidden transition-all hover:shadow-md", !isActive && "opacity-50")}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                template.type === 'periodic_return' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'
              }`}>
                {template.type === 'periodic_return' ? <Bell className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
              </div>
              <div>
                <h4 className="font-semibold text-foreground">{template.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {template.type === 'periodic_return' ? (
                    (() => {
                      const d = daysToDisplayUnit(template.return_interval || 0);
                      const unitLabel = d.unit === 'days' ? 'dias' : d.unit === 'weeks' ? 'semanas' : d.unit === 'months' ? 'meses' : 'anos';
                      return <>{template.procedure_name} • A cada {d.value} {unitLabel}</>;
                    })()
                  ) : (
                    <>Enviar {template.days_before_appointment} dia(s) antes</>
                  )}
                </p>
                {formatUpdatedAt(template) && (
                  <p className="text-xs text-muted-foreground/70 mt-1">{formatUpdatedAt(template)}</p>
                )}
              </div>
            </div>
            <Switch checked={isActive} onCheckedChange={() => handleToggleActive(template)} />
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleOpenDialog(template)}>
              <Pencil className="h-3.5 w-3.5 mr-1" />Editar
            </Button>
            {template.type === 'periodic_return' && (
              <Button variant="outline" size="sm" onClick={() => handleDuplicate(template)}>
                <Copy className="h-3.5 w-3.5 mr-1" />Duplicar
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => { setTemplateToDelete(template); setIsDeleteDialogOpen(true); }}>
              <Trash2 className="h-3.5 w-3.5 mr-1 text-destructive" />Excluir
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return <MainLayout><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Lembretes</h1>
            <p className="text-muted-foreground">Configure os modelos de mensagens automáticas</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2"><Plus className="h-4 w-4" />Novo Lembrete</Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-auto min-w-[240px] h-10">
              <SelectValue placeholder="Tipo / Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Desativado</SelectItem>
              <SelectItem value="appointment_confirmation">Confirmação de Consulta</SelectItem>
              <SelectItem value="periodic_return">Lembrete Periódico</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterProcedure} onValueChange={handleProcedureFilterChange}>
            <SelectTrigger className="w-full sm:w-auto min-w-[240px] h-10">
              <SelectValue placeholder="Procedimento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os procedimentos</SelectItem>
              {procedures.map((p) => (
                <SelectItem key={p.id} value={p.title}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-y-auto space-y-6" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {filteredTemplates.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center justify-center py-8 text-center"><Bell className="h-12 w-12 text-muted-foreground/50" /><p className="mt-3 text-sm text-muted-foreground">Nenhum lembrete encontrado com os filtros selecionados</p></CardContent></Card>
          ) : (
            <>
              {/* Seção: Confirmação de Consulta */}
              {confirmationTemplates.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">Lembretes de Confirmação</h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {confirmationTemplates.map((t) => <ReminderCard key={t.id} template={t} />)}
                  </div>
                </div>
              )}

              {/* Divisor */}
              {confirmationTemplates.length > 0 && returnTemplates.length > 0 && (
                <hr className="border-border" />
              )}

              {/* Seção: Retorno Periódico */}
              {returnTemplates.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-secondary" />
                    <h2 className="text-lg font-semibold text-foreground">Lembretes de Retorno</h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {returnTemplates.map((t) => <ReminderCard key={t.id} template={t} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>{selectedTemplate ? 'Editar Lembrete' : 'Novo Lembrete'}</DialogTitle>
            <DialogDescription>Configure as regras e a mensagem do lembrete automático</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-6 p-1">
            <div className="space-y-2"><Label htmlFor="name">Nome do Lembrete *</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Retorno Limpeza Semestral" /></div>
            <div className="space-y-3"><Label>Tipo de Lembrete *</Label><RadioGroup value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as any })} className="flex gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="periodic_return" id="periodic" /><Label htmlFor="periodic" className="font-normal cursor-pointer">Retorno Periódico</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="appointment_confirmation" id="confirmation" /><Label htmlFor="confirmation" className="font-normal cursor-pointer">Confirmação de Consulta</Label></div></RadioGroup></div>

            {formData.type === 'periodic_return' && (
              <div className="space-y-4 rounded-lg border border-border p-4 animate-fade-in">
                <div className="space-y-2"><Label>Nome do Procedimento</Label><div className="flex gap-2">
                  <Popover open={procPopoverOpen} onOpenChange={setProcPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={procPopoverOpen} className="flex-1 justify-between font-normal">
                        {formData.procedureName ? (() => { const proc = procedures.find(p => p.title === formData.procedureName); return proc ? `${proc.title}${proc.return_interval_days ? ` (${proc.return_interval_days}d)` : ''}` : formData.procedureName; })() : 'Selecione o procedimento'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput placeholder="Pesquisar procedimento..." value={procSearch} onValueChange={setProcSearch} />
                        <CommandList className="max-h-[176px]">
                          <CommandEmpty>Nenhum procedimento encontrado</CommandEmpty>
                          <CommandGroup>
                            {[...procedures].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR')).filter(p => p.title.toLowerCase().includes(procSearch.toLowerCase())).map((p) => (
                              <CommandItem key={p.id} value={p.title} onSelect={() => {
                                const days = p.return_interval_days;
                                let interval = formData.returnInterval;
                                let unit = formData.returnIntervalUnit;
                                if (days && days > 0) {
                                  if (days % 365 === 0) { interval = String(days / 365); unit = 'years'; }
                                  else if (days % 30 === 0) { interval = String(days / 30); unit = 'months'; }
                                  else if (days % 7 === 0) { interval = String(days / 7); unit = 'weeks'; }
                                  else { interval = String(days); unit = 'days'; }
                                }
                                setFormData({ ...formData, procedureName: p.title, procedureId: p.id, returnInterval: interval, returnIntervalUnit: unit });
                                setProcPopoverOpen(false);
                                setProcSearch('');
                              }}>
                                <Check className={cn("mr-2 h-4 w-4", formData.procedureName === p.title ? "opacity-100" : "opacity-0")} />
                                <span className="truncate">{p.title}</span>
                                {p.return_interval_days ? <span className="ml-auto text-xs text-muted-foreground shrink-0">{p.return_interval_days}d</span> : null}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                        <div className="border-t border-border p-1">
                          <CommandItem onSelect={() => { setProcPopoverOpen(false); setProcSearch(''); setIsProceduresOpen(true); }} className="justify-center text-sm cursor-pointer">
                            <Pencil className="mr-2 h-4 w-4" />
                            Gerenciar procedimentos
                          </CommandItem>
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  </div></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Intervalo de Retorno *</Label><div className="flex gap-2"><Input type="text" inputMode="numeric" className="w-[80px]" value={formData.returnInterval} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setFormData({ ...formData, returnInterval: v }); }} onKeyDown={(e) => { if (['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return; if (!/^\d$/.test(e.key)) e.preventDefault(); }} onPaste={(e) => { e.preventDefault(); const text = e.clipboardData.getData('text').replace(/\D/g, ''); setFormData({ ...formData, returnInterval: text }); }} placeholder="6" disabled={!!formData.procedureName} required /><Select value={formData.returnIntervalUnit} onValueChange={(v) => setFormData({ ...formData, returnIntervalUnit: v as any })} disabled={!!formData.procedureName}><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="days">Dias</SelectItem><SelectItem value="weeks">Semanas</SelectItem><SelectItem value="months">Meses</SelectItem><SelectItem value="years">Anos</SelectItem></SelectContent></Select></div>{formData.procedureName && <p className="text-xs text-muted-foreground">Definido pelo procedimento</p>}</div>
                  <div className="space-y-2"><Label>Enviar antes do retorno *</Label><div className="flex gap-2 justify-end"><Input type="text" inputMode="numeric" className="w-[80px]" value={formData.sendBefore} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setFormData({ ...formData, sendBefore: v }); }} onKeyDown={(e) => { if (['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return; if (!/^\d$/.test(e.key)) e.preventDefault(); }} onPaste={(e) => { e.preventDefault(); const text = e.clipboardData.getData('text').replace(/\D/g, ''); setFormData({ ...formData, sendBefore: text }); }} placeholder="7" required /><Select value={formData.sendBeforeUnit} onValueChange={(v) => setFormData({ ...formData, sendBeforeUnit: v as any })}><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="days">Dias</SelectItem><SelectItem value="weeks">Semanas</SelectItem><SelectItem value="months">Meses</SelectItem></SelectContent></Select></div></div>
                </div>
              </div>
            )}

            {formData.type === 'appointment_confirmation' && (
              <div className="space-y-4 rounded-lg border border-border p-4 animate-fade-in">
                <div className="space-y-2"><Label>Enviar quantos dias antes da consulta? *</Label><Input type="text" inputMode="numeric" value={formData.daysBeforeAppointment} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setFormData({ ...formData, daysBeforeAppointment: v }); }} onKeyDown={(e) => { if (['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return; if (!/^\d$/.test(e.key)) e.preventDefault(); }} onPaste={(e) => { e.preventDefault(); const text = e.clipboardData.getData('text').replace(/\D/g, ''); setFormData({ ...formData, daysBeforeAppointment: text }); }} placeholder="1" /><p className="text-xs text-muted-foreground">Mínimo 1 dia, máximo 10 dias</p></div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Mensagem *</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={handleGenerateMessage} disabled={isGenerating} className="gap-2">
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    {isGenerating ? 'Gerando...' : 'Gerar Mensagem'}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={handleImproveWithAI} disabled={isImproving} className="gap-2">
                    {isImproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {isImproving ? 'Melhorando...' : 'Melhorar com IA'}
                  </Button>
                </div>
              </div>
              <VariableEditor
                ref={editorRef}
                value={formData.messageTemplate}
                onChange={(value) => setFormData(prev => ({ ...prev, messageTemplate: value }))}
                placeholder="Digite a mensagem que será enviada... Use / para inserir variáveis"
              />
              <p className="text-xs text-muted-foreground">
                Digite <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-xs font-mono">/</kbd> para inserir variáveis: {'{nome_paciente}'}, {'{nome_responsavel}'}, {'{idade}'}, {'{procedimento}'}, {'{data}'}, {'{horario}'}, {'{clinica}'}
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4"><div><Label className="font-medium">Lembrete Ativo</Label><p className="text-sm text-muted-foreground">Ative para enviar automaticamente</p></div><Switch checked={formData.isActive} onCheckedChange={(c) => setFormData({ ...formData, isActive: c })} /></div>
          </div>
          <DialogFooter className="shrink-0"><Button variant="outline" onClick={handleCloseDialog}>Cancelar</Button><Button onClick={handleSubmit}>{selectedTemplate ? 'Salvar' : 'Criar'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm replace dialog */}
      <AlertDialog open={confirmReplace} onOpenChange={setConfirmReplace}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Substituir mensagem?</AlertDialogTitle>
            <AlertDialogDescription>Já existe uma mensagem. Deseja substituí-la pela mensagem gerada?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setPendingMessage(''); setConfirmReplace(false); }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReplaceMessage}>Substituir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir lembrete?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteTemplate}>Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ManageProceduresDialog open={isProceduresOpen} onOpenChange={setIsProceduresOpen} onProcedureUpdated={(updatedProc) => {
        // If the updated procedure is the one selected in the form, sync the interval
        if (formData.procedureId === updatedProc.id) {
          const days = updatedProc.return_interval_days;
          if (days && days > 0) {
            const ri = daysToDisplayUnit(days);
            setFormData(prev => ({ ...prev, procedureName: updatedProc.title, returnInterval: ri.value.toString(), returnIntervalUnit: ri.unit }));
          }
        }
      }} />
    </MainLayout>
  );
}
