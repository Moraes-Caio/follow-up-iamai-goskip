import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppointments, type AppointmentRow } from '@/hooks/useAppointments';
import { usePatients } from '@/hooks/usePatients';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useCustomRoles } from '@/hooks/useCustomRoles';
import { useProcedures } from '@/hooks/useProcedures';
import { usePatientReturns } from '@/hooks/usePatientReturns';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicHours } from '@/hooks/useClinicHours';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { StatusBadge } from '@/components/ui/status-badge';
import { ProfessionalDatePicker } from '@/components/ui/professional-date-picker';
import { AppointmentTimePicker } from '@/components/appointments/AppointmentTimePicker';
import { formatDate, cn } from '@/lib/utils';
import { Plus, Calendar as CalendarIcon, Clock, User, Stethoscope, Undo2, Pencil, Loader2, ChevronDown, Check, Search, Settings, X, Eye, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CreatePatientDialog } from '@/components/patients/CreatePatientDialog';
import { 
  addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, 
  parseISO, format, isBefore, startOfDay, addYears, endOfYear,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarView } from '@/components/appointments/CalendarView';
import { DayAppointmentsDialog } from '@/components/appointments/DayAppointmentsDialog';
import { ManageProceduresDialog } from '@/components/procedures/ManageProceduresDialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UndoState {
  previousStatus: AppointmentRow['status'];
  previousWasPerformed: boolean | null | undefined;
  action: 'completion' | 'confirmation';
  expiresAt: number;
}

export default function Appointments() {
  const { appointments, addAppointment, updateAppointment, deleteAppointment, isLoading } = useAppointments();
  const { patients } = usePatients();
  const { teamMembers } = useTeamMembers();
  const { roles } = useCustomRoles();
  const { procedures } = useProcedures();
  const { addReturn, returns, updateReturn } = usePatientReturns();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const { getClinicHoursForDate } = useClinicHours();

  const [searchParams] = useSearchParams();
  const tabMap: Record<string, string> = { hoje: 'today', semana: 'week', mes: 'month', todas: 'all', calendario: 'calendar' };
  const [activeTab, setActiveTab] = useState(() => tabMap[searchParams.get('filtro') || ''] || 'today');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProceduresOpen, setIsProceduresOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>(() => searchParams.get('status') || 'all');
  const [professionalFilter, setProfessionalFilter] = useState<string>('all');
  
  const [appointmentsNeedingConfirmation, setAppointmentsNeedingConfirmation] = useState<Set<string>>(new Set());
  const undoTimerRef = useRef<Record<string, NodeJS.Timeout>>({});
  const [undoableAppointments, setUndoableAppointments] = useState<Record<string, UndoState>>({});
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const today = startOfDay(new Date());
  const minDate = today;
  const maxDate = endOfYear(addYears(today, 1));

  const [formData, setFormData] = useState({
    patientId: '', date: undefined as Date | undefined, time: '', endTime: '', procedureIds: [] as string[], professionalId: '',
  });

  const [isPatientPopoverOpen, setIsPatientPopoverOpen] = useState(false);
  const [isNewPatientDialogOpen, setIsNewPatientDialogOpen] = useState(false);
  const [isProfessionalPopoverOpen, setIsProfessionalPopoverOpen] = useState(false);
  const [isProcedurePopoverOpen, setIsProcedurePopoverOpen] = useState(false);
  
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRow | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<AppointmentRow | null>(null);
  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  // Search states for dropdowns
  const [patientSearch, setPatientSearch] = useState('');
  const [professionalSearch, setProfessionalSearch] = useState('');
  const [procedureSearch, setProcedureSearch] = useState('');

  // New member form
  

  const [, setUndoTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setUndoTick((t) => t + 1);
      const now = Date.now();
      setUndoableAppointments((prev) => {
        const updated: Record<string, UndoState> = {};
        Object.entries(prev).forEach(([id, state]) => { if (state.expiresAt > now) updated[id] = state; });
        return Object.keys(updated).length !== Object.keys(prev).length ? updated : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const now = new Date();
    const needingConfirmation = new Set<string>();
    appointments.forEach((apt) => {
      if (apt.status !== 'completed' && apt.status !== 'cancelled' && apt.was_performed === null) {
        const appointmentDateTime = new Date(`${apt.date}T${apt.time}:00`);
        if (isBefore(appointmentDateTime, now)) needingConfirmation.add(apt.id);
      }
    });
    setAppointmentsNeedingConfirmation(needingConfirmation);
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    const todayStr = format(today, 'yyyy-MM-dd');
    let filtered = [...appointments];
    if (activeTab === 'today') { filtered = filtered.filter((a) => a.date === todayStr); }
    else if (activeTab === 'week') { const ws = startOfWeek(today, { locale: ptBR }); const we = endOfWeek(today, { locale: ptBR }); filtered = filtered.filter((a) => a.date >= todayStr && isWithinInterval(parseISO(a.date), { start: ws, end: we })); }
    else if (activeTab === 'month') { const ms = startOfMonth(today); const me = endOfMonth(today); filtered = filtered.filter((a) => a.date >= todayStr && isWithinInterval(parseISO(a.date), { start: ms, end: me })); }
    else if (activeTab === 'all') { filtered = filtered.filter((a) => a.date >= todayStr); }
    if (statusFilter === 'not_performed') filtered = filtered.filter((a) => a.status === 'completed' && a.was_performed === false);
    else if (statusFilter !== 'all') filtered = filtered.filter((a) => statusFilter === 'completed' ? a.status === 'completed' && a.was_performed !== false : a.status === statusFilter);
    if (professionalFilter !== 'all') filtered = filtered.filter((a) => a.professional_id === professionalFilter);
    filtered.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    return filtered;
  }, [appointments, activeTab, statusFilter, professionalFilter, today]);

  const groupedAppointments = useMemo(() => {
    const groups: Record<string, AppointmentRow[]> = {};
    filteredAppointments.forEach((a) => { if (!groups[a.date]) groups[a.date] = []; groups[a.date].push(a); });
    return groups;
  }, [filteredAppointments]);

  const dentists = useMemo(() => {
    return teamMembers.filter((m) => {
      if (!m.is_active) return false;
      const roleIds = m.role_id.split(',').map(id => id.trim());
      return roleIds.some(rid => {
        const role = roles.find((r) => r.id === rid);
        return role?.name.toLowerCase().includes('dentista');
      });
    }).sort((a, b) => a.full_name.localeCompare(b.full_name, 'pt-BR'));
  }, [teamMembers, roles]);

  // Auto-select professional if owner and only member
  const currentMember = useMemo(() => teamMembers.find((m) => m.profile_id === user?.id), [teamMembers, user]);

  // Selected procedures objects
  const selectedProcedureObjects = useMemo(() => {
    return formData.procedureIds.map(id => procedures.find(p => p.id === id)).filter(Boolean) as typeof procedures;
  }, [formData.procedureIds, procedures]);

  // Calculate end time from procedures
  const calculateEndTime = useCallback((startTime: string, procIds: string[]) => {
    if (!startTime || procIds.length === 0) return '';
    const procs = procIds.map(id => procedures.find(p => p.id === id)).filter(Boolean);
    const totalDuration = procs.reduce((sum, p) => sum + (p?.duration_minutes || 0), 0);
    if (totalDuration === 0) return '';
    const totalCleanup = procs.reduce((sum, p) => sum + (p?.cleanup_minutes ?? 15), 0);
    const totalWithCleanup = totalDuration + totalCleanup;
    const [h, m] = startTime.split(':').map(Number);
    const totalMinutes = h * 60 + m + totalWithCleanup;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
  }, [procedures]);

  const resetForm = () => {
    setFormData({ patientId: '', date: undefined, time: '', endTime: '', procedureIds: [], professionalId: '' });
    setPatientSearch('');
    setProfessionalSearch('');
    setProcedureSearch('');
  };

  const handleOpenDialog = (prefilledDate?: Date, appointmentToEdit?: AppointmentRow) => {
    resetForm();
    if (appointmentToEdit) {
      setEditingAppointment(appointmentToEdit);
      // Populate form from existing appointment
      const procNames = appointmentToEdit.procedure_name.split(',').map(s => s.trim());
      const procIds = procNames.map(name => procedures.find(p => p.title === name)?.id).filter(Boolean) as string[];
      setFormData({
        patientId: appointmentToEdit.patient_id,
        date: parseISO(appointmentToEdit.date),
        time: appointmentToEdit.time,
        endTime: appointmentToEdit.end_time || '',
        procedureIds: procIds,
        professionalId: appointmentToEdit.professional_id || '',
      });
    } else {
      setEditingAppointment(null);
      if (prefilledDate) setFormData((prev) => ({ ...prev, date: prefilledDate }));
      // Auto-select professional if owner is the only dentist
      if (currentMember?.is_owner && dentists.length === 1 && dentists[0].profile_id === user?.id) {
        setFormData((prev) => ({ ...prev, professionalId: dentists[0].id }));
      }
    }
    setIsDialogOpen(true);
  };

  // Check for time overlap
  const hasTimeOverlap = (start1: string, end1: string, start2: string, end2: string) => {
    if (!start1 || !end1 || !start2 || !end2) return false;
    return start1 < end2 && start2 < end1;
  };

  const handleSubmit = async () => {
    if (!formData.patientId || !formData.date || !formData.time || formData.procedureIds.length === 0 || !formData.professionalId) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios.', variant: 'destructive' }); return;
    }
    if (isBefore(formData.date, today)) { toast({ title: 'Erro', description: 'Não é possível agendar consultas em datas passadas.', variant: 'destructive' }); return; }

    const dateStr = format(formData.date, 'yyyy-MM-dd');
    const endTime = formData.endTime || calculateEndTime(formData.time, formData.procedureIds) || formData.time;

    // Conflict validation
    const sameDayAppointments = appointments.filter(a => a.date === dateStr && a.status !== 'cancelled' && a.id !== editingAppointment?.id);
    for (const apt of sameDayAppointments) {
      const aptEnd = apt.end_time || apt.time;
      if (hasTimeOverlap(formData.time, endTime, apt.time, aptEnd)) {
        if (apt.professional_id === formData.professionalId) {
          const patient = patients.find(p => p.id === apt.patient_id);
          toast({ title: 'Conflito de horário', description: `O profissional já tem consulta com ${patient?.full_name || 'outro paciente'} neste horário (${apt.time} - ${aptEnd}).`, variant: 'destructive' });
          return;
        }
        if (apt.patient_id === formData.patientId) {
          toast({ title: 'Conflito de horário', description: `O paciente já tem consulta neste horário (${apt.time} - ${aptEnd}).`, variant: 'destructive' });
          return;
        }
      }
    }

    const procedureNames = selectedProcedureObjects.map(p => p.title).join(', ');

    try {
      if (editingAppointment) {
        await updateAppointment({
          id: editingAppointment.id,
          patient_id: formData.patientId,
          date: dateStr,
          time: formData.time,
          end_time: endTime,
          procedure_name: procedureNames,
          procedure_id: formData.procedureIds[0] || null,
          professional_id: formData.professionalId,
        });
        toast({ title: 'Consulta atualizada', description: 'A consulta foi atualizada com sucesso!', variant: 'success' as any });
      } else {
        await addAppointment({
          patient_id: formData.patientId,
          date: dateStr,
          time: formData.time,
          end_time: endTime,
          procedure_name: procedureNames,
          procedure_id: formData.procedureIds[0] || null,
          professional_id: formData.professionalId,
          confirmation_sent: false,
        });
        // Auto-resolve pending returns for same patient+procedure
        for (const proc of selectedProcedureObjects) {
          const matchingReturns = returns.filter(
            r => r.patient_id === formData.patientId && r.procedure_id === proc.id && (r.status === 'pendente' || r.status === 'enviado')
          );
          for (const ret of matchingReturns) {
            updateReturn.mutate({ id: ret.id, status: 'confirmado' });
          }
        }
        toast({ title: 'Consulta agendada', description: 'A consulta foi agendada com sucesso!', variant: 'success' as any });
      }
      setIsDialogOpen(false); resetForm(); setEditingAppointment(null);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleInlineCompletionConfirm = async (appointment: AppointmentRow, wasPerformed: boolean) => {
    const patient = patients.find((p) => p.id === appointment.patient_id);
    const previousStatus = appointment.status;
    const previousWasPerformed = appointment.was_performed;

    try {
      await updateAppointment({ id: appointment.id, status: 'completed', was_performed: wasPerformed });
      setAppointmentsNeedingConfirmation((prev) => { const next = new Set(prev); next.delete(appointment.id); return next; });

      await addNotification({
        type: 'completed_appointment',
        appointment_id: appointment.id,
        title: 'Consulta Concluída',
        description: `Consulta de ${patient?.full_name || 'Paciente'} foi ${wasPerformed ? 'realizada' : 'não realizada'}`,
        is_read: false,
        is_archived: false,
        priority: 'normal',
        category: 'Consultas Concluídas',
      });

      if (wasPerformed) {
        // Handle multiple procedures
        const procNames = appointment.procedure_name.split(',').map(s => s.trim());
        for (const procName of procNames) {
          const proc = procedures.find(p => p.title === procName);
          if (proc?.return_interval_days && proc.return_interval_days > 0) {
            addReturn.mutate({
              patient_id: appointment.patient_id,
              procedure_id: proc.id,
              last_procedure_date: appointment.date,
              return_interval_days: proc.return_interval_days,
            });
          }
        }
      }

      const expiresAt = Date.now() + 5 * 60 * 1000;
      setUndoableAppointments((prev) => ({ ...prev, [appointment.id]: { previousStatus, previousWasPerformed, action: 'completion', expiresAt } }));
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleConfirmAppointment = async (appointment: AppointmentRow) => {
    const previousStatus = appointment.status;
    try {
      await updateAppointment({ id: appointment.id, status: 'confirmed' });
      const expiresAt = Date.now() + 5 * 60 * 1000;
      setUndoableAppointments((prev) => ({ ...prev, [appointment.id]: { previousStatus, previousWasPerformed: undefined, action: 'confirmation', expiresAt } }));
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleUndo = async (appointmentId: string) => {
    const undoState = undoableAppointments[appointmentId];
    if (!undoState) return;
    if (undoTimerRef.current[appointmentId]) { clearTimeout(undoTimerRef.current[appointmentId]); delete undoTimerRef.current[appointmentId]; }
    try {
      if (undoState.action === 'completion') {
        await updateAppointment({ id: appointmentId, status: undoState.previousStatus, was_performed: undoState.previousWasPerformed ?? null });
        setAppointmentsNeedingConfirmation((prev) => new Set(prev).add(appointmentId));
      } else {
        await updateAppointment({ id: appointmentId, status: undoState.previousStatus });
      }
      setUndoableAppointments((prev) => { const { [appointmentId]: _, ...rest } = prev; return rest; });
      toast({ title: 'Desfeito!', description: 'A ação foi desfeita com sucesso.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const getRemainingTime = (expiresAt: number) => {
    const remaining = Math.max(0, expiresAt - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleCalendarDayClick = (date: Date) => { setSelectedDay(date); setIsDayDialogOpen(true); };
  const handleCalendarAppointmentClick = (appointment: AppointmentRow) => { 
    const aptDate = parseISO(appointment.date);
    setSelectedDay(aptDate);
    setIsDayDialogOpen(true);
  };

  const handleOpenDetailDialog = (appointment: AppointmentRow) => {
    setSelectedAppointment(appointment);
    setIsDetailDialogOpen(true);
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;
    try {
      await updateAppointment({ id: selectedAppointment.id, status: 'cancelled' });
      toast({ title: 'Consulta cancelada', description: 'A consulta foi cancelada com sucesso.' });
      setIsCancelDialogOpen(false);
      setIsDetailDialogOpen(false);
      setSelectedAppointment(null);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteAppointment = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteAppointment(deleteTargetId);
      toast({ title: 'Consulta excluída', description: 'A consulta foi permanentemente removida.' });
      setIsDeleteDialogOpen(false);
      setDeleteTargetId(null);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Erro ao excluir consulta', variant: 'destructive' });
    }
  };

  const handleEditFromDetail = () => {
    if (!selectedAppointment) return;
    setIsDetailDialogOpen(false);
    handleOpenDialog(undefined, selectedAppointment);
  };
  const handleAppointmentDragEnd = async (appointmentId: string, newDate: string) => {
    if (isBefore(parseISO(newDate), today)) { toast({ title: 'Erro', description: 'Não é possível mover consultas para datas passadas.', variant: 'destructive' }); return; }
    try { await updateAppointment({ id: appointmentId, date: newDate }); toast({ title: 'Sucesso', description: 'Consulta reagendada com sucesso!' }); } catch (err: any) { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); }
  };

  // Scroll handler for popover lists
  const handlePopoverWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const atTop = scrollTop === 0 && e.deltaY < 0;
    const atBottom = scrollTop + clientHeight >= scrollHeight && e.deltaY > 0;
    if (!atTop && !atBottom) {
      e.stopPropagation();
    }
  }, []);

  // New member submit

  // Normalize string for accent-insensitive search
  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  // Highlight text matching search query
  const HighlightText = ({ text, query }: { text: string; query: string }) => {
    if (!query.trim()) return <>{text}</>;
    const nText = normalize(text);
    const nQuery = normalize(query);
    const idx = nText.indexOf(nQuery);
    if (idx === -1) return <>{text}</>;
    return <>{text.slice(0, idx)}<mark style={{ backgroundColor: '#FFFF00', color: 'inherit' }} className="rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>{text.slice(idx + query.length)}</>;
  };

  // Filtered/sorted lists
  const sortedPatients = useMemo(() => {
    const sorted = [...patients].sort((a, b) => a.full_name.localeCompare(b.full_name, 'pt-BR'));
    if (!patientSearch.trim()) return sorted;
    const q = normalize(patientSearch);
    return sorted.filter(p => normalize(p.full_name).includes(q));
  }, [patients, patientSearch]);

  const availableProfessionals = useMemo(() => {
    // Filter by ALL selected procedures' professional_ids (intersection)
    let avail = dentists;
    if (formData.procedureIds.length > 0) {
      const selectedProcs = formData.procedureIds.map(id => procedures.find(p => p.id === id)).filter(Boolean);
      const procsWithRestrictions = selectedProcs.filter(p => p!.professional_ids?.length);
      if (procsWithRestrictions.length > 0) {
        avail = dentists.filter(d => procsWithRestrictions.every(p => p!.professional_ids!.includes(d.id)));
      }
    }
    if (!professionalSearch.trim()) return avail;
    const q = normalize(professionalSearch);
    return avail.filter(d => normalize(d.full_name).includes(q));
  }, [dentists, procedures, formData.procedureIds, professionalSearch]);

  const sortedProcedures = useMemo(() => {
    const sorted = [...procedures].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
    if (!procedureSearch.trim()) return sorted;
    const q = normalize(procedureSearch);
    return sorted.filter(p => normalize(p.title).includes(q));
  }, [procedures, procedureSearch]);


  // Toggle procedure in multi-select
  const handleToggleProcedure = (procId: string) => {
    setFormData(prev => {
      const newIds = prev.procedureIds.includes(procId)
        ? prev.procedureIds.filter(id => id !== procId)
        : [...prev.procedureIds, procId];
      // Recalculate end time
      const newEndTime = prev.time ? calculateEndTime(prev.time, newIds) : '';
      // Check if current professional is still valid
      const selectedProcs = newIds.map(id => procedures.find(p => p.id === id)).filter(Boolean);
      const procsWithRestrictions = selectedProcs.filter(p => p!.professional_ids?.length);
      let keepProf = true;
      if (procsWithRestrictions.length > 0 && prev.professionalId) {
        keepProf = procsWithRestrictions.every(p => p!.professional_ids!.includes(prev.professionalId));
      }
      return { ...prev, procedureIds: newIds, endTime: newEndTime || prev.endTime, professionalId: keepProf ? prev.professionalId : '' };
    });
  };

  // Compute occupied time slots for selected professional + date
  const occupiedSlots = useMemo(() => {
    if (!formData.professionalId || !formData.date) return [];
    const dateStr = format(formData.date, 'yyyy-MM-dd');
    return appointments
      .filter(a => a.date === dateStr && a.professional_id === formData.professionalId && a.status !== 'cancelled' && a.id !== editingAppointment?.id)
      .map(a => {
        const patient = patients.find(p => p.id === a.patient_id);
        return { time: a.time, endTime: a.end_time || a.time, patientName: patient?.full_name };
      });
  }, [formData.professionalId, formData.date, appointments, patients, editingAppointment]);

  // Compute occupied slots for selected patient + date (patient can't have overlapping appointments)
  const patientOccupiedSlots = useMemo(() => {
    if (!formData.patientId || !formData.date) return [];
    const dateStr = format(formData.date, 'yyyy-MM-dd');
    return appointments
      .filter(a => a.date === dateStr && a.patient_id === formData.patientId && a.status !== 'cancelled' && a.id !== editingAppointment?.id)
      .map(a => ({ time: a.time, endTime: a.end_time || a.time, patientName: 'Paciente já agendado' }));
  }, [formData.patientId, formData.date, appointments, editingAppointment]);

  // Merge professional + patient occupied slots
  const mergedOccupiedSlots = useMemo(() => {
    const map = new Map<string, typeof occupiedSlots[0]>();
    for (const s of occupiedSlots) map.set(s.time, s);
    for (const s of patientOccupiedSlots) { if (!map.has(s.time)) map.set(s.time, s); }
    return Array.from(map.values());
  }, [occupiedSlots, patientOccupiedSlots]);

  // When time changes, recalculate end time
  const handleTimeChange = (time: string | undefined) => {
    const t = time || '';
    const endTime = t ? calculateEndTime(t, formData.procedureIds) : '';
    setFormData(prev => ({ ...prev, time: t, endTime: endTime || prev.endTime }));
  };

  // Procedure labels for display
  const selectedProcedureLabel = useMemo(() => {
    if (formData.procedureIds.length === 0) return 'Selecione os procedimentos';
    if (formData.procedureIds.length === 1) {
      const proc = procedures.find(p => p.id === formData.procedureIds[0]);
      return proc?.title || 'Selecione os procedimentos';
    }
    return `${formData.procedureIds.length} procedimentos selecionados`;
  }, [formData.procedureIds, procedures]);


  if (isLoading) {
    return <MainLayout><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h1 className="text-2xl font-bold text-foreground lg:text-3xl">Consultas</h1><p className="text-muted-foreground">Gerencie o agendamento de consultas</p></div>
          <Button onClick={() => handleOpenDialog()} className="gap-2"><Plus className="h-4 w-4" />Agendar Consulta</Button>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full lg:w-auto">
            <TabsList><TabsTrigger value="today">Hoje</TabsTrigger><TabsTrigger value="week">Semana</TabsTrigger><TabsTrigger value="month">Mês</TabsTrigger><TabsTrigger value="all">Todas</TabsTrigger><TabsTrigger value="calendar">Calendário</TabsTrigger></TabsList>
          </Tabs>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[170px]"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os status</SelectItem><SelectItem value="pending">Pendente</SelectItem><SelectItem value="confirmed">Confirmada</SelectItem><SelectItem value="completed">Realizada</SelectItem><SelectItem value="not_performed">Não Realizada</SelectItem><SelectItem value="cancelled">Cancelada</SelectItem></SelectContent></Select>
            <Select value={professionalFilter} onValueChange={setProfessionalFilter}><SelectTrigger className="w-[200px]"><SelectValue placeholder="Profissional" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os profissionais</SelectItem>{dentists.map((d) => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}</SelectContent></Select>
          </div>
        </div>

        {activeTab === 'calendar' ? (
          <CalendarView
            onDayClick={handleCalendarDayClick}
            onAppointmentClick={handleCalendarAppointmentClick}
            onAppointmentDragEnd={handleAppointmentDragEnd}
            statusFilter={statusFilter}
            professionalFilter={professionalFilter}
          />
        ) : (
          <>
            {Object.keys(groupedAppointments).length === 0 ? (
              <Card><CardContent className="flex flex-col items-center justify-center py-12 text-center"><CalendarIcon className="h-12 w-12 text-muted-foreground/50" /><p className="mt-3 text-lg font-medium text-foreground">Nenhuma consulta encontrada</p><p className="text-sm text-muted-foreground">Agende uma nova consulta para começar</p></CardContent></Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedAppointments).map(([date, appointmentsList]) => (
                  <div key={date}>
                    <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">{format(parseISO(date), "EEEE, dd 'de' MMMM", { locale: ptBR })}</h3>
                    <div className="space-y-3">
                      {appointmentsList.map((appointment) => {
                        const patient = patients.find((p) => p.id === appointment.patient_id);
                        const professional = teamMembers.find((m) => m.id === appointment.professional_id);
                        const needsConfirmation = appointmentsNeedingConfirmation.has(appointment.id);
                        const undoState = undoableAppointments[appointment.id];
                        const hasUndo = !!undoState;

                        return (
                          <Card key={appointment.id} className={cn("overflow-visible transition-all hover:shadow-md rounded-xl", needsConfirmation && "border-warning border-2", hasUndo && "border-info border-2")}>
                            <div className="overflow-hidden rounded-xl">
                              {needsConfirmation && (
                                <div className="flex items-center justify-between gap-3 bg-warning/10 px-4 py-2.5 border-b border-warning/20">
                                  <div className="flex items-center gap-2 text-warning-foreground"><CalendarIcon className="h-4 w-4 text-warning" /><span className="text-sm font-medium">Esta consulta foi realizada?</span></div>
                                  <div className="flex gap-2"><Button size="sm" variant="outline" className="h-7 px-3 text-xs border-warning/50 hover:bg-warning/20" onClick={() => handleInlineCompletionConfirm(appointment, false)}>Não</Button><Button size="sm" className="h-7 px-3 text-xs bg-secondary hover:bg-secondary/90" onClick={() => handleInlineCompletionConfirm(appointment, true)}>Sim</Button></div>
                                </div>
                              )}
                              {hasUndo && (
                                <div className="flex items-center justify-between gap-3 bg-info/10 px-4 py-2.5 border-b border-info/20">
                                  <div className="flex items-center gap-2 text-foreground"><Undo2 className="h-4 w-4 text-foreground" /><span className="text-sm font-medium">{undoState.action === 'completion' ? 'Consulta marcada como concluída' : 'Consulta confirmada'}</span></div>
                                  <Button size="sm" variant="outline" className="h-7 px-3 text-xs border-foreground/30 hover:bg-info/20 gap-1 text-foreground" onClick={() => handleUndo(appointment.id)}><Undo2 className="h-3 w-3" />Desfazer</Button>
                                </div>
                              )}
                              <CardContent className="p-4 cursor-pointer" onClick={() => handleOpenDetailDialog(appointment)}>
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="flex items-center gap-4">
                                    <div>
                                      <div className="flex items-center gap-2"><p className="font-semibold text-foreground">{patient?.full_name || 'Paciente não encontrado'}</p><StatusBadge status={appointment.status} />{appointment.was_performed === false && <span className="text-xs text-destructive">(Não realizada)</span>}</div>
                                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                        {appointment.end_time && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /><span className="font-bold text-foreground">{appointment.time} - {appointment.end_time}</span></span>}
                                        {!appointment.end_time && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /><span className="font-bold text-foreground">{appointment.time}</span></span>}
                                        <span className="flex items-center gap-1"><Stethoscope className="h-3.5 w-3.5" />{appointment.procedure_name}</span>
                                        <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{professional?.full_name || 'Não definido'}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                    {appointment.status === 'pending' && !undoableAppointments[appointment.id] && !needsConfirmation && (<Button variant="outline" size="sm" onClick={() => handleConfirmAppointment(appointment)}>Confirmar</Button>)}
                                    {appointment.status === 'cancelled' && (
                                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Excluir consulta" onClick={() => { setDeleteTargetId(appointment.id); setIsDeleteDialogOpen(true); }}>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ===== DIALOG AGENDAR CONSULTA ===== */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col overflow-hidden top-[2rem] translate-y-0">
          <DialogHeader className="shrink-0"><DialogTitle>{editingAppointment ? 'Editar Consulta' : 'Agendar Consulta'}</DialogTitle><DialogDescription>{editingAppointment ? 'Altere os dados da consulta' : 'Preencha os dados para agendar uma nova consulta'}</DialogDescription></DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 p-0.5">
            {/* Paciente dropdown with search */}
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Popover open={isPatientPopoverOpen} onOpenChange={(open) => { setIsPatientPopoverOpen(open); if (!open) setPatientSearch(''); }}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                    {formData.patientId ? patients.find((p) => p.id === formData.patientId)?.full_name : 'Selecione o paciente'}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <div className="p-2 border-b border-border">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Buscar paciente..." value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} className="h-8 pl-8 text-sm" autoFocus />
                    </div>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto p-1" onWheel={handlePopoverWheel}>
                    {sortedPatients.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">Nenhum paciente encontrado</p>
                    ) : (
                      sortedPatients.map((p) => (
                        <button key={p.id} className={cn('relative flex w-full cursor-default select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground', formData.patientId === p.id && 'bg-accent')} onClick={() => { setFormData({ ...formData, patientId: p.id }); setIsPatientPopoverOpen(false); setPatientSearch(''); }}>
                          {formData.patientId === p.id && <Check className="absolute left-2 h-4 w-4" />}
                          <HighlightText text={p.full_name} query={patientSearch} />
                        </button>
                      ))
                    )}
                  </div>
                  <div className="border-t border-border p-1">
                    <button className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm font-medium text-primary hover:bg-accent" onClick={() => { setIsPatientPopoverOpen(false); setIsNewPatientDialogOpen(true); }}>
                      <Plus className="h-4 w-4" />Novo Paciente
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Procedimentos multi-select with checkboxes */}
            <div className="space-y-2">
              <Label>Procedimento(s) *</Label>
              <div className="flex gap-2">
                <Popover open={isProcedurePopoverOpen} onOpenChange={(open) => { setIsProcedurePopoverOpen(open); if (!open) setProcedureSearch(''); }}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="flex-1 justify-between font-normal text-left">
                      <span className="truncate">{selectedProcedureLabel}</span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <div className="p-2 border-b border-border">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Buscar procedimento..." value={procedureSearch} onChange={(e) => setProcedureSearch(e.target.value)} className="h-8 pl-8 text-sm" autoFocus />
                      </div>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto p-1" onWheel={handlePopoverWheel}>
                      {sortedProcedures.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">Nenhum procedimento encontrado</p>
                      ) : (
                        sortedProcedures.map((p) => (
                          <label key={p.id} className={cn('relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm py-2 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground', formData.procedureIds.includes(p.id) && 'bg-accent/50')}>
                            <Checkbox checked={formData.procedureIds.includes(p.id)} onCheckedChange={() => handleToggleProcedure(p.id)} />
                            <span className="flex-1">
                              <HighlightText text={p.title} query={procedureSearch} />
                              {p.duration_minutes && <span className="text-xs text-muted-foreground ml-1">({p.duration_minutes}min)</span>}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                    <div className="border-t border-border p-1">
                      <button className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm font-medium text-primary hover:bg-accent" onClick={() => { setIsProcedurePopoverOpen(false); setProcedureSearch(''); setIsProceduresOpen(true); }}>
                        <Pencil className="h-4 w-4" />Gerenciar procedimentos
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Profissional dropdown with search + Novo Membro */}
            <div className="space-y-2">
              <Label>Profissional Responsável *</Label>
              <Popover open={isProfessionalPopoverOpen} onOpenChange={(open) => { setIsProfessionalPopoverOpen(open); if (!open) setProfessionalSearch(''); }}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                    {formData.professionalId ? teamMembers.find((m) => m.id === formData.professionalId)?.full_name : 'Selecione o profissional'}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <div className="p-2 border-b border-border">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Buscar profissional..." value={professionalSearch} onChange={(e) => setProfessionalSearch(e.target.value)} className="h-8 pl-8 text-sm" autoFocus />
                    </div>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto p-1" onWheel={handlePopoverWheel}>
                    {availableProfessionals.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">Nenhum profissional encontrado</p>
                    ) : (
                      availableProfessionals.map((d) => (
                        <button key={d.id} className={cn('relative flex w-full cursor-default select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground', formData.professionalId === d.id && 'bg-accent')} onClick={() => { setFormData({ ...formData, professionalId: d.id }); setIsProfessionalPopoverOpen(false); setProfessionalSearch(''); }}>
                          {formData.professionalId === d.id && <Check className="absolute left-2 h-4 w-4" />}
                          <span className="flex flex-col items-start">
                            <span><HighlightText text={d.full_name} query={professionalSearch} /></span>
                            {d.specialty && <span className="text-xs text-muted-foreground">{d.specialty}</span>}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Data e Horário */}
            <div className="space-y-2">
              <Label>Data *</Label>
              <ProfessionalDatePicker
                value={formData.date}
                onChange={(date) => {
                  if (date && formData.time) {
                    const now = new Date();
                    const isToday = date.toDateString() === now.toDateString();
                    if (isToday) {
                      const [h, m] = formData.time.split(':').map(Number);
                      if (h * 60 + m <= now.getHours() * 60 + now.getMinutes()) {
                        setFormData({ ...formData, date, time: '', endTime: '' });
                        toast({ title: 'Horário atualizado', description: 'O horário selecionado não está mais disponível para hoje.' });
                        return;
                      }
                    }
                  }
                  setFormData({ ...formData, date });
                }}
                placeholder="Selecione a data"
                minDate={minDate}
                maxDate={maxDate}
                hidePastDates
                yearRange={{ from: today.getFullYear(), to: today.getFullYear() + 2 }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Início *</Label>
                <AppointmentTimePicker
                  value={formData.time}
                  onChange={handleTimeChange}
                  placeholder="Selecione o horário"
                  selectedDate={formData.date}
                  disabled={!formData.date || !formData.patientId || !formData.professionalId}
                  occupiedSlots={mergedOccupiedSlots}
                  clinicHours={formData.date ? getClinicHoursForDate(formData.date) : undefined}
                />
                {(!formData.patientId || !formData.professionalId) && formData.date && (
                  <p className="text-xs text-muted-foreground">Selecione paciente e profissional primeiro</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Término</Label>
                <AppointmentTimePicker
                  value={formData.endTime}
                  onChange={(time) => setFormData(prev => ({ ...prev, endTime: time || '' }))}
                  placeholder="Automático"
                  selectedDate={formData.date}
                  disabled={!formData.date || !formData.patientId || !formData.professionalId}
                  minTime={formData.time || undefined}
                  clinicHours={formData.date ? getClinicHoursForDate(formData.date) : undefined}
                />
                {formData.endTime && formData.time && (
                  <p className="text-xs text-muted-foreground">Inclui tempo de limpeza configurado por procedimento</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0"><Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); setEditingAppointment(null); }}>Cancelar</Button><Button onClick={handleSubmit}>{editingAppointment ? 'Salvar' : 'Agendar'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>


      <ManageProceduresDialog open={isProceduresOpen} onOpenChange={setIsProceduresOpen} />

      <DayAppointmentsDialog
        open={isDayDialogOpen}
        onOpenChange={setIsDayDialogOpen}
        date={selectedDay}
        appointments={appointments}
        patients={patients}
        teamMembers={teamMembers}
        onNewAppointment={(date) => { if (!isBefore(date, today)) handleOpenDialog(date); else toast({ title: 'Erro', description: 'Não é possível agendar consultas em datas passadas.', variant: 'destructive' }); }}
        onAppointmentClick={(apt) => { setSelectedAppointment(apt); setIsDetailDialogOpen(true); }}
      />

      <CreatePatientDialog
        open={isNewPatientDialogOpen}
        onOpenChange={setIsNewPatientDialogOpen}
        onPatientCreated={(id) => { setFormData((prev) => ({ ...prev, patientId: id })); }}
      />

      {/* ===== DIALOG DETALHES DA CONSULTA ===== */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes da Consulta</DialogTitle>
            <DialogDescription>Informações completas da consulta</DialogDescription>
          </DialogHeader>
          {selectedAppointment && (() => {
            const patient = patients.find(p => p.id === selectedAppointment.patient_id);
            const professional = teamMembers.find(m => m.id === selectedAppointment.professional_id);
            const isEditable = selectedAppointment.status !== 'completed' && selectedAppointment.status !== 'cancelled';
            return (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold text-foreground text-lg">{patient?.full_name || 'Paciente'}</p>
                      <StatusBadge status={selectedAppointment.status} />
                    </div>
                  </div>

                  <div className="grid gap-3 rounded-lg border border-border p-4 bg-muted/30">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Data:</span>
                      <span className="font-medium text-foreground">{format(parseISO(selectedAppointment.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Horário:</span>
                      <span className="font-medium text-foreground">{selectedAppointment.time}{selectedAppointment.end_time ? ` - ${selectedAppointment.end_time}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Stethoscope className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Procedimento:</span>
                      <span className="font-medium text-foreground">{selectedAppointment.procedure_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Profissional:</span>
                      <span className="font-medium text-foreground">{professional?.full_name || 'Não definido'}</span>
                    </div>
                    {selectedAppointment.was_performed === false && (
                      <p className="text-xs text-destructive font-medium">Consulta não foi realizada</p>
                    )}
                  </div>
                </div>

                {isEditable && (
                  <div className="flex gap-2">
                    <Button className="flex-1 gap-2" variant="outline" onClick={handleEditFromDetail}>
                      <Pencil className="h-4 w-4" />Editar / Reagendar
                    </Button>
                    <Button className="flex-1 gap-2" variant="destructive" onClick={() => setIsCancelDialogOpen(true)}>
                      <X className="h-4 w-4" />Cancelar Consulta
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ===== ALERT CANCELAR CONSULTA ===== */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar consulta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A consulta será marcada como cancelada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelAppointment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Cancelar Consulta</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== DIALOG EXCLUIR CONSULTA ===== */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir consulta cancelada?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A consulta será permanentemente removida do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTargetId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAppointment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
