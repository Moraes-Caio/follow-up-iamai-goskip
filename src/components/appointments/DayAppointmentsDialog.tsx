import { useState, useMemo, useEffect } from 'react';
import { format, isBefore, startOfDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';
import { Plus, CalendarIcon, Clock, User, Stethoscope, Check, Undo2 } from 'lucide-react';
import type { AppointmentRow } from '@/hooks/useAppointments';
import { useAppointments } from '@/hooks/useAppointments';

interface Patient {
  id: string;
  full_name: string;
  phone?: string;
}

interface TeamMember {
  id: string;
  full_name: string;
  specialty?: string | null;
}

interface DayAppointmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  appointments: AppointmentRow[];
  patients: Patient[];
  teamMembers: TeamMember[];
  onNewAppointment: (date: Date) => void;
  onAppointmentClick: (appointment: AppointmentRow) => void;
}

interface UndoEntry {
  previousStatus: AppointmentRow['status'];
  expiresAt: number;
}

export function DayAppointmentsDialog({
  open, onOpenChange, date, appointments, patients, teamMembers,
  onNewAppointment, onAppointmentClick,
}: DayAppointmentsDialogProps) {
  const { updateAppointment } = useAppointments();
  const [undoMap, setUndoMap] = useState<Record<string, UndoEntry>>({});

  const today = startOfDay(new Date());
  const isPastDay = date ? isBefore(date, today) && !isToday(date) : false;

  // Clean up expired undos
  useEffect(() => {
    if (!open) { setUndoMap({}); return; }
    const interval = setInterval(() => {
      const now = Date.now();
      setUndoMap(prev => {
        const updated: Record<string, UndoEntry> = {};
        Object.entries(prev).forEach(([id, entry]) => {
          if (entry.expiresAt > now) updated[id] = entry;
        });
        return Object.keys(updated).length !== Object.keys(prev).length ? updated : prev;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [open]);

  const dayAppointments = useMemo(() => {
    if (!date) return [];
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments
      .filter(a => a.date === dateStr)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, date]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'border-l-4 border-l-success';
      case 'pending': return 'border-l-4 border-l-warning';
      case 'completed': return 'border-l-4 border-l-muted-foreground';
      case 'cancelled': return 'border-l-4 border-l-destructive';
      default: return '';
    }
  };

  const handleConfirm = async (apt: AppointmentRow) => {
    try {
      await updateAppointment({ id: apt.id, status: 'confirmed' });
      setUndoMap(prev => ({ ...prev, [apt.id]: { previousStatus: apt.status, expiresAt: Date.now() + 3 * 60 * 1000 } }));
    } catch {}
  };

  const handleUndo = async (aptId: string) => {
    const entry = undoMap[aptId];
    if (!entry) return;
    try {
      await updateAppointment({ id: aptId, status: entry.previousStatus });
      setUndoMap(prev => { const { [aptId]: _, ...rest } = prev; return rest; });
    } catch {}
  };

  if (!date) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col sm:max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle className="capitalize">
            Consultas - {format(date, "EEEE, dd 'de' MMMM yyyy", { locale: ptBR })}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 p-0.5 scrollbar-thin">
          {dayAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarIcon className="h-12 w-12 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium text-foreground">Nenhuma consulta agendada para este dia</p>
              {!isPastDay && <p className="text-xs text-muted-foreground mt-1">Clique abaixo para agendar uma nova consulta</p>}
            </div>
          ) : (
            dayAppointments.map((apt) => {
              const patient = patients.find(p => p.id === apt.patient_id);
              const professional = teamMembers.find(m => m.id === apt.professional_id);
              const hasUndo = !!undoMap[apt.id];
              return (
                <div
                  key={apt.id}
                  onClick={() => onAppointmentClick(apt)}
                  className={cn(
                    'rounded-lg border border-border bg-card p-4 cursor-pointer transition-all hover:shadow-md hover:bg-accent/30',
                    getStatusColor(apt.status)
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground truncate">{patient?.full_name || 'Paciente'}</p>
                        <StatusBadge status={apt.status} />
                        {!isPastDay && apt.status === 'pending' && !hasUndo && (
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-6 w-6 shrink-0 border-success/50 text-success hover:bg-success/10"
                            onClick={(e) => { e.stopPropagation(); handleConfirm(apt); }}
                            title="Confirmar consulta"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {hasUndo && (
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-6 w-6 shrink-0 border-foreground/30 text-foreground hover:bg-muted"
                            onClick={(e) => { e.stopPropagation(); handleUndo(apt.id); }}
                            title="Desfazer"
                          >
                            <Undo2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" />{professional?.full_name || 'Não definido'}</span>
                        <span className="flex items-center gap-1"><Stethoscope className="h-3 w-3" />{apt.procedure_name}</span>
                        {apt.end_time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /><span className="font-bold text-foreground">{apt.time} - {apt.end_time}</span></span>}
                        {!apt.end_time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /><span className="font-bold text-foreground">{apt.time}</span></span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {!isPastDay && (
          <div className="shrink-0 pt-2 border-t border-border">
            <Button className="w-full gap-2" onClick={() => { onOpenChange(false); onNewAppointment(date); }}>
              <Plus className="h-4 w-4" />Nova Consulta
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
