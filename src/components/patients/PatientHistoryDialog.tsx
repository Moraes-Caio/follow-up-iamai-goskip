import { useState, useRef } from 'react';
import { useAppointments } from '@/hooks/useAppointments';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { usePatientReturns } from '@/hooks/usePatientReturns';
import { useProcedures } from '@/hooks/useProcedures';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ProfessionalDatePicker } from '@/components/ui/professional-date-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { calculateAge, formatDate } from '@/lib/utils';
import type { Patient } from '@/types';
import { relationLabels, genderLabels } from '@/types';
import { CalendarDays, RotateCcw, Plus, Trash2, AlertTriangle, ChevronDown, User, Phone, Pencil } from 'lucide-react';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import { cn, formatPhone } from '@/lib/utils';
import type { PatientReturnStatus } from '@/hooks/usePatientReturns';

const returnStatusConfig: Record<PatientReturnStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pendente: { label: 'Pendente', variant: 'outline' },
  enviado: { label: 'Enviado', variant: 'default' },
  confirmado: { label: 'Confirmado', variant: 'secondary' },
  ignorado: { label: 'Ignorado', variant: 'destructive' },
};

interface PatientHistoryDialogProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function PatientHistoryDialog({ patient, open, onOpenChange, onEdit, onDelete }: PatientHistoryDialogProps) {
  const { appointments } = useAppointments();
  const { teamMembers } = useTeamMembers();
  const { returns, addReturn, deleteReturn } = usePatientReturns();
  const { procedures } = useProcedures();

  const [showNewReturn, setShowNewReturn] = useState(false);
  const [selectedProcedureId, setSelectedProcedureId] = useState('');
  const [lastDate, setLastDate] = useState<Date | undefined>();
  const [snapshotDays, setSnapshotDays] = useState<number | null>(null);
  const [deleteReturnId, setDeleteReturnId] = useState<string | null>(null);

  if (!patient) return null;

  const patientAppointments = appointments
    .filter((a) => a.patient_id === patient.id)
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
    .slice(0, 10);

  const patientReturns = returns
    .filter((r) => r.patient_id === patient.id)
    .sort((a, b) => a.reminder_send_date.localeCompare(b.reminder_send_date));

  const proceduresWithReturn = procedures.filter((p) => p.return_interval_days && p.return_interval_days > 0);

  const phone = patient.hasResponsible && patient.responsible ? patient.responsible.phone : patient.phone;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleProcedureSelect = (procId: string) => {
    setSelectedProcedureId(procId);
    const proc = procedures.find((p) => p.id === procId);
    setSnapshotDays(proc?.return_interval_days ?? null);
  };

  const resetReturnForm = () => {
    setSelectedProcedureId('');
    setLastDate(undefined);
    setSnapshotDays(null);
    setShowNewReturn(false);
  };

  const handleAddReturn = () => {
    if (!selectedProcedureId || !lastDate || !snapshotDays) return;
    addReturn.mutate({
      patient_id: patient.id,
      procedure_id: selectedProcedureId,
      last_procedure_date: format(lastDate, 'yyyy-MM-dd'),
      return_interval_days: snapshotDays,
    });
    resetReturnForm();
  };

  const handleDeleteReturn = () => {
    if (deleteReturnId) {
      deleteReturn.mutate(deleteReturnId);
      setDeleteReturnId(null);
    }
  };

  const calculatedDate = lastDate && snapshotDays ? addDays(lastDate, snapshotDays) : null;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetReturnForm(); }}>
        <DialogContent className="max-w-3xl h-[560px] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Histórico & Retornos</DialogTitle>
            <DialogDescription asChild>
              <div className="flex items-center justify-between">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer rounded px-1 -mx-1">
                      {patient.fullName} — {calculateAge(patient.birthDate)} anos
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-72 p-0 z-[60]">
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{patient.fullName}</p>
                          <p className="text-xs text-muted-foreground">{calculateAge(patient.birthDate)} anos · {patient.gender ? (genderLabels[patient.gender] || patient.gender) : '—'}</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nascimento</span>
                          <span className="text-foreground font-medium">{formatDate(patient.birthDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Telefone</span>
                          <span className="text-foreground font-medium">{patient.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cadastro</span>
                          <span className="text-foreground font-medium">{formatDate(patient.createdAt)}</span>
                        </div>
                      </div>
                      {patient.hasResponsible && patient.responsible && (
                        <>
                          <Separator />
                          <div className="space-y-1.5 text-xs">
                            <p className="text-muted-foreground font-medium text-[11px] uppercase tracking-wider">Responsável</p>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Nome</span>
                              <span className="text-foreground font-medium">{patient.responsible.fullName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Relação</span>
                              <span className="text-foreground font-medium">{relationLabels[patient.responsible.relation]}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Telefone</span>
                              <span className="text-foreground font-medium">{patient.responsible.phone}</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                <div className="flex items-center gap-1 mr-6">
                  {onEdit && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={onEdit}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex gap-0 min-h-0 overflow-hidden">
            {/* Left: Appointments */}
            <div className="flex-1 flex flex-col min-w-0">
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-primary" />Consultas
              </h3>
              {patientAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-center">
                  <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
                  <p className="mt-2 text-xs text-muted-foreground">Nenhuma consulta</p>
                </div>
              ) : (
                <ScrollArea className="flex-1">
                  <div className="space-y-2 pr-3 pb-2">
                    {patientAppointments.map((appt) => {
                      const professional = teamMembers.find((m) => m.id === appt.professional_id);
                      return (
                        <div key={appt.id} className="rounded-lg border border-border p-2.5 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">{formatDate(appt.date)} às {appt.time}</span>
                            <StatusBadge status={appt.status} />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {appt.procedure_name}{professional ? ` — ${professional.full_name}` : ''}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>

            <Separator orientation="vertical" className="mx-4 h-auto" />

            {/* Right: Returns */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5"><RotateCcw className="h-4 w-4 text-primary" />Retornos</h3>
              </div>

              {patientReturns.length === 0 && !showNewReturn ? (
                <div className="flex flex-col items-center justify-center flex-1 text-center"><RotateCcw className="h-8 w-8 text-muted-foreground/40" /><p className="mt-2 text-xs text-muted-foreground">Nenhum retorno</p></div>
              ) : (
                <ScrollArea className="flex-1">
                  <div className="space-y-2 pr-3 pb-2">
                    {patientReturns.map((r) => {
                      const sendDate = parseISO(r.reminder_send_date);
                      const diff = differenceInDays(sendDate, today);
                      const isOverdue = r.status === 'pendente' && diff < 0;
                      const isClose = r.status === 'pendente' && diff >= 0 && diff <= 7;
                      return (
                        <div key={r.id} className={cn('rounded-lg border border-border p-2.5 space-y-0.5', isOverdue && 'bg-destructive/5 border-destructive/30', isClose && 'bg-warning/5 border-warning/30')}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground flex items-center gap-1">{isOverdue && <AlertTriangle className="h-3 w-3 text-destructive" />}{r.procedures?.title || '—'}</span>
                            <div className="flex items-center gap-1"><Badge variant={returnStatusConfig[r.status].variant} className="text-[10px] px-1.5 py-0">{returnStatusConfig[r.status].label}</Badge><Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setDeleteReturnId(r.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button></div>
                          </div>
                          <p className="text-xs text-muted-foreground">Última: {format(parseISO(r.last_procedure_date), 'dd/MM/yy')} · Lembrete: {format(sendDate, 'dd/MM/yy')} · {r.return_interval_days}d</p>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteReturnId} onOpenChange={(v) => { if (!v) setDeleteReturnId(null); }}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir retorno?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteReturn}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </>
  );
}
