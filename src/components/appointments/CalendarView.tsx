import { useState, useMemo } from 'react';
import { useAppointments, type AppointmentRow } from '@/hooks/useAppointments';
import { usePatients } from '@/hooks/usePatients';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isBefore, startOfDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CalendarViewProps {
  onDayClick: (date: Date) => void;
  onAppointmentClick: (appointment: AppointmentRow) => void;
  onAppointmentDragEnd?: (appointmentId: string, newDate: string) => void;
  statusFilter?: string;
  professionalFilter?: string;
}

export function CalendarView({ onDayClick, onAppointmentClick, onAppointmentDragEnd, statusFilter = 'all', professionalFilter = 'all' }: CalendarViewProps) {
  const { appointments } = useAppointments();
  const { patients } = usePatients();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedAppointment, setDraggedAppointment] = useState<string | null>(null);

  // Drag-drop confirmation state
  const [dragConfirm, setDragConfirm] = useState<{
    appointmentId: string;
    newDate: string;
    patientName: string;
    originalDate: string;
    time: string;
  } | null>(null);

  const today = startOfDay(new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { locale: ptBR });
    const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  const appointmentsByDate = useMemo(() => {
    const map: Record<string, AppointmentRow[]> = {};
    let filtered = appointments;
    if (statusFilter !== 'all') filtered = filtered.filter(a => a.status === statusFilter);
    if (professionalFilter !== 'all') filtered = filtered.filter(a => a.professional_id === professionalFilter);
    filtered.forEach((apt) => {
      if (!map[apt.date]) map[apt.date] = [];
      map[apt.date].push(apt);
    });
    Object.keys(map).forEach((date) => {
      map[date].sort((a, b) => a.time.localeCompare(b.time));
    });
    return map;
  }, [appointments, statusFilter, professionalFilter]);

  const handleDragStart = (e: React.DragEvent, appointmentId: string) => {
    setDraggedAppointment(appointmentId);
    e.dataTransfer.setData('text/plain', appointmentId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    const appointmentId = e.dataTransfer.getData('text/plain');
    if (!appointmentId) { setDraggedAppointment(null); return; }

    const newDateStr = format(date, 'yyyy-MM-dd');

    // Find appointment info for confirmation
    const apt = appointments.find(a => a.id === appointmentId);
    if (!apt) { setDraggedAppointment(null); return; }

    // Don't allow drop on past dates
    if (isBefore(date, today)) { setDraggedAppointment(null); return; }

    // Same date, no action needed
    if (apt.date === newDateStr) { setDraggedAppointment(null); return; }

    const patient = patients.find(p => p.id === apt.patient_id);

    setDragConfirm({
      appointmentId,
      newDate: newDateStr,
      patientName: patient?.full_name || 'Paciente',
      originalDate: apt.date,
      time: apt.time,
    });
    setDraggedAppointment(null);
  };

  const handleConfirmDrag = () => {
    if (dragConfirm && onAppointmentDragEnd) {
      onAppointmentDragEnd(dragConfirm.appointmentId, dragConfirm.newDate);
    }
    setDragConfirm(null);
  };

  const getStatusColor = (status: string, isPast: boolean) => {
    if (isPast) return 'bg-[#D1D5DB] text-[#4B5563]';
    switch (status) {
      case 'confirmed': return 'bg-success/80 text-success-foreground';
      case 'pending': return 'bg-warning/80 text-warning-foreground';
      case 'completed': return 'bg-muted text-muted-foreground';
      case 'cancelled': return 'bg-destructive/80 text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const formatDisplayDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft className="h-5 w-5" /></Button>
            <h2 className="text-lg font-semibold text-foreground capitalize">{format(currentDate, 'MMMM yyyy', { locale: ptBR })}</h2>
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}><ChevronRight className="h-5 w-5" /></Button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (<div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">{day}</div>))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayAppointments = appointmentsByDate[dateStr] || [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);
              const isPast = isBefore(day, today) && !isCurrentDay;
              return (
                <div key={index} className={cn(
                  'min-h-[100px] p-1 border border-border rounded-md transition-colors cursor-pointer',
                  !isCurrentMonth && 'bg-muted/30',
                  isCurrentDay && 'border-primary',
                  isPast && 'bg-[#F5F5F5]',
                  !isPast && 'hover:bg-muted/50'
                )} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, day)} onClick={() => onDayClick(day)}>
                  <div className="flex items-center justify-between mb-1">
                    <div className={cn(
                      'text-sm font-medium',
                      !isCurrentMonth && 'text-muted-foreground',
                      isCurrentDay && 'text-primary font-bold',
                      isPast && 'text-[#9CA3AF]'
                    )}>{format(day, 'd')}</div>
                    {dayAppointments.length > 0 && (
                      <span className={cn("text-[8px] leading-tight", isPast ? "text-[#9CA3AF]" : "text-muted-foreground")}>{dayAppointments.length} {dayAppointments.length === 1 ? 'consulta' : 'consultas'}</span>
                    )}
                  </div>
                  <div className={cn(
                    "space-y-0.5",
                    dayAppointments.length > 3 && "flex"
                  )}>
                    <div className={cn(
                      "space-y-0.5 flex-1",
                      dayAppointments.length > 3 && "max-h-[54px] overflow-y-auto calendar-day-scroll"
                    )}>
                      {dayAppointments.map((apt) => {
                        const patient = patients.find((p) => p.id === apt.patient_id);
                        return (
                          <div key={apt.id} draggable={!isPast} onDragStart={(e) => handleDragStart(e, apt.id)} onDragEnd={() => setDraggedAppointment(null)} onClick={(e) => { e.stopPropagation(); onAppointmentClick(apt); }} className={cn(
                            'text-xs px-1 py-0.5 rounded truncate',
                            isPast ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing',
                            getStatusColor(apt.status, isPast),
                            draggedAppointment === apt.id && 'opacity-50'
                          )}>
                            <span className={cn("font-medium", isPast && "font-bold text-[#374151]")}>{apt.time}</span>{' '}
                            <span className={cn("hidden sm:inline", isPast && "text-[#4B5563]")}>{patient?.full_name.split(' ')[0]}</span>
                          </div>
                        );
                      })}
                    </div>
                    {dayAppointments.length > 3 && (
                      <div className="w-[3px] rounded-full bg-border ml-0.5 self-stretch shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Drag-drop confirmation dialog */}
      <AlertDialog open={!!dragConfirm} onOpenChange={(open) => !open && setDragConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Reagendamento</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paciente:</span>
                    <span className="font-medium text-foreground">{dragConfirm?.patientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data original:</span>
                    <span className="font-medium text-foreground">{dragConfirm?.originalDate && formatDisplayDate(dragConfirm.originalDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nova data:</span>
                    <span className="font-medium text-primary">{dragConfirm?.newDate && formatDisplayDate(dragConfirm.newDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horário:</span>
                    <span className="font-medium text-foreground">{dragConfirm?.time} (mantido)</span>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDrag}>Confirmar Reagendamento</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
