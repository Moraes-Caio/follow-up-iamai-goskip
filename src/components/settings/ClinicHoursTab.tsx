import { useState, useEffect } from 'react';
import { useClinicHours, getDayName, type ClinicHourRow, type ClinicBreakRow, type ClinicExtraSessionRow } from '@/hooks/useClinicHours';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProfessionalTimePicker } from '@/components/ui/professional-time-picker';
import { ProfessionalDatePicker } from '@/components/ui/professional-date-picker';
import { toast } from '@/hooks/use-toast';
import { Clock, Plus, Trash2, Loader2, CheckCircle2, CalendarPlus, Coffee } from 'lucide-react';
import { format, addYears, endOfYear, startOfDay } from 'date-fns';

export function ClinicHoursTab() {
  const {
    hours, breaks, extraSessions, isLoading,
    saveClinicHours, addBreak, deleteBreak,
    addExtraSession, deleteExtraSession,
  } = useClinicHours();

  const [localHours, setLocalHours] = useState<ClinicHourRow[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Break form
  const [breakLabel, setBreakLabel] = useState('');
  const [breakStart, setBreakStart] = useState('');
  const [breakEnd, setBreakEnd] = useState('');
  const [breakDay, setBreakDay] = useState<string>('all');
  const [showBreakForm, setShowBreakForm] = useState(false);

  // Extra session form
  const [sessionDate, setSessionDate] = useState<Date | undefined>();
  const [sessionOpen, setSessionOpen] = useState('08:00');
  const [sessionClose, setSessionClose] = useState('18:00');
  const [sessionLabel, setSessionLabel] = useState('');
  const [showSessionForm, setShowSessionForm] = useState(false);

  useEffect(() => {
    if (hours.length > 0) {
      setLocalHours([...hours]);
      setHasChanges(false);
    }
  }, [hours]);

  const updateDay = (dayOfWeek: number, field: keyof ClinicHourRow, value: any) => {
    setLocalHours(prev => prev.map(h =>
      h.day_of_week === dayOfWeek ? { ...h, [field]: value } : h
    ));
    setHasChanges(true);
  };

  const handleSaveHours = async () => {
    setIsSaving(true);
    try {
      await saveClinicHours(localHours);
      setHasChanges(false);
      toast({ title: 'Sucesso', description: 'Horários de funcionamento salvos!' });
    } catch {
      toast({ title: 'Erro', description: 'Erro ao salvar horários.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddBreak = async () => {
    if (!breakStart || !breakEnd) {
      toast({ title: 'Erro', description: 'Preencha os horários da pausa.', variant: 'destructive' });
      return;
    }
    if (breakStart >= breakEnd) {
      toast({ title: 'Erro', description: 'O horário de início deve ser antes do término.', variant: 'destructive' });
      return;
    }
    await addBreak({
      day_of_week: breakDay === 'all' ? null : parseInt(breakDay),
      start_time: breakStart,
      end_time: breakEnd,
      label: breakLabel || 'Pausa',
    });
    setBreakLabel('');
    setBreakStart('');
    setBreakEnd('');
    setBreakDay('all');
    setShowBreakForm(false);
    toast({ title: 'Sucesso', description: 'Pausa adicionada!' });
  };

  const handleDeleteBreak = async (id: string) => {
    await deleteBreak(id);
    toast({ title: 'Sucesso', description: 'Pausa removida.' });
  };

  const handleAddSession = async () => {
    if (!sessionDate || !sessionOpen || !sessionClose) {
      toast({ title: 'Erro', description: 'Preencha todos os campos da sessão.', variant: 'destructive' });
      return;
    }
    if (sessionOpen >= sessionClose) {
      toast({ title: 'Erro', description: 'O horário de abertura deve ser antes do fechamento.', variant: 'destructive' });
      return;
    }
    await addExtraSession({
      date: format(sessionDate, 'yyyy-MM-dd'),
      open_time: sessionOpen,
      close_time: sessionClose,
      label: sessionLabel || 'Sessão Extra',
    });
    setSessionDate(undefined);
    setSessionOpen('08:00');
    setSessionClose('18:00');
    setSessionLabel('');
    setShowSessionForm(false);
    toast({ title: 'Sucesso', description: 'Sessão extra adicionada!' });
  };

  const handleDeleteSession = async (id: string) => {
    await deleteExtraSession(id);
    toast({ title: 'Sucesso', description: 'Sessão removida.' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const today = startOfDay(new Date());
  const maxDate = endOfYear(addYears(today, 1));

  return (
    <div className="space-y-6">
      {/* Horário de Funcionamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horário de Funcionamento
          </CardTitle>
          <CardDescription>Configure os dias e horários de abertura e fechamento da clínica</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {localHours.sort((a, b) => a.day_of_week - b.day_of_week).map((h) => (
            <div key={h.day_of_week} className="flex items-center gap-3 py-2 border-b last:border-0">
              <div className="w-24 font-medium text-sm">{getDayName(h.day_of_week)}</div>
              <Switch
                checked={h.is_open}
                onCheckedChange={(checked) => updateDay(h.day_of_week, 'is_open', checked)}
              />
              <span className="text-xs text-muted-foreground w-14">{h.is_open ? 'Aberto' : 'Fechado'}</span>
              {h.is_open && (
                <>
                  <ProfessionalTimePicker
                    value={h.open_time}
                    onChange={(t) => updateDay(h.day_of_week, 'open_time', t || '08:00')}
                    minuteStep={15}
                    className="w-28"
                  />
                  <span className="text-muted-foreground text-sm">até</span>
                  <ProfessionalTimePicker
                    value={h.close_time}
                    onChange={(t) => updateDay(h.day_of_week, 'close_time', t || '18:00')}
                    minTime={h.open_time}
                    minuteStep={15}
                    className="w-28"
                  />
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {hasChanges && (
        <div className="flex justify-end animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
          <Button onClick={handleSaveHours} className="gap-2" disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Salvar Horários
          </Button>
        </div>
      )}

      {/* Pausas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Coffee className="h-5 w-5" />
                Pausas
              </CardTitle>
              <CardDescription>Intervalos como almoço ou descanso que bloqueiam agendamentos</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowBreakForm(!showBreakForm)} className="gap-1">
              <Plus className="h-4 w-4" />
              Adicionar Pausa
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showBreakForm && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Nome da pausa</Label>
                  <Input
                    value={breakLabel}
                    onChange={(e) => setBreakLabel(e.target.value)}
                    placeholder="Ex: Almoço"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Dia da semana</Label>
                  <Select value={breakDay} onValueChange={setBreakDay}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os dias</SelectItem>
                      {[0,1,2,3,4,5,6].map(d => (
                        <SelectItem key={d} value={String(d)}>{getDayName(d)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Início</Label>
                  <ProfessionalTimePicker
                    value={breakStart}
                    onChange={(t) => setBreakStart(t || '')}
                    minuteStep={15}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Término</Label>
                  <ProfessionalTimePicker
                    value={breakEnd}
                    onChange={(t) => setBreakEnd(t || '')}
                    minTime={breakStart || undefined}
                    minuteStep={15}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setShowBreakForm(false)}>Cancelar</Button>
                <Button size="sm" onClick={handleAddBreak}>Adicionar</Button>
              </div>
            </div>
          )}

          {breaks.length === 0 && !showBreakForm && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma pausa configurada</p>
          )}

          {breaks.map((b) => (
            <div key={b.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="flex items-center gap-3">
                <Coffee className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{b.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.start_time} - {b.end_time} · {b.day_of_week === null ? 'Todos os dias' : getDayName(b.day_of_week)}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDeleteBreak(b.id)} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Sessões Extras */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarPlus className="h-5 w-5" />
                Sessões Extras
              </CardTitle>
              <CardDescription>Datas especiais de funcionamento (fins de semana, feriados, etc.)</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowSessionForm(!showSessionForm)} className="gap-1">
              <Plus className="h-4 w-4" />
              Adicionar Sessão
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showSessionForm && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Data</Label>
                  <ProfessionalDatePicker
                    value={sessionDate}
                    onChange={setSessionDate}
                    minDate={today}
                    maxDate={maxDate}
                    placeholder="Selecione a data"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nome da sessão</Label>
                  <Input
                    value={sessionLabel}
                    onChange={(e) => setSessionLabel(e.target.value)}
                    placeholder="Ex: Plantão de Sábado"
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Abertura</Label>
                  <ProfessionalTimePicker
                    value={sessionOpen}
                    onChange={(t) => setSessionOpen(t || '08:00')}
                    minuteStep={15}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fechamento</Label>
                  <ProfessionalTimePicker
                    value={sessionClose}
                    onChange={(t) => setSessionClose(t || '18:00')}
                    minTime={sessionOpen}
                    minuteStep={15}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setShowSessionForm(false)}>Cancelar</Button>
                <Button size="sm" onClick={handleAddSession}>Adicionar</Button>
              </div>
            </div>
          )}

          {extraSessions.length === 0 && !showSessionForm && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma sessão extra configurada</p>
          )}

          {extraSessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="flex items-center gap-3">
                <CalendarPlus className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(s.date + 'T12:00:00'), 'dd/MM/yyyy')} · {s.open_time} - {s.close_time}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDeleteSession(s.id)} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
