import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '@/hooks/usePatients';
import { useAppointments } from '@/hooks/useAppointments';
import { Loader2, Users, Calendar, AlertCircle, Clock, MessageSquare } from 'lucide-react';

export default function Dashboard() {
  const { patients, isLoading: pLoading } = usePatients();
  const { appointments, isLoading: aLoading } = useAppointments();
  const navigate = useNavigate();

  const isLoading = pLoading || aLoading;

  const totalPatients = patients.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter((a) => a.date === todayStr).length;
  const pendingConfirmations = appointments.filter((a) => a.status === 'pending').length;
  const lembretesSent = appointments.filter((a) => a.lembrete_enviado).length;

  const upcomingAppointments = appointments
    .filter((a) => a.date >= todayStr && a.status !== 'cancelled')
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 5);

  const metricRoutes = ['/pacientes', '/consultas?filtro=hoje', '/consultas?filtro=todas&status=pending', '/mensagens'];
  const metrics = [
    { title: 'Total de Pacientes', value: totalPatients, icon: Users, color: 'text-primary', bgColor: 'bg-primary/8' },
    { title: 'Consultas Hoje', value: todayAppointments, icon: Calendar, color: 'text-secondary', bgColor: 'bg-secondary/8' },
    { title: 'Aguardando Confirmação', value: pendingConfirmations, icon: AlertCircle, color: 'text-warning', bgColor: 'bg-warning/8', route: '/consultas?filtro=hoje&status=pendente' },
    { title: 'Lembretes Enviados', value: lembretesSent, icon: MessageSquare, color: 'text-info', bgColor: 'bg-info/8' },
  ];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-12">
        <div>
          <h1 className="text-2xl font-semibold text-foreground lg:text-3xl tracking-tight">Dashboard</h1>
          <p className="text-base text-muted-foreground mt-1 leading-relaxed">
            Bem-vindo de volta! Aqui está o resumo da sua clínica.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <Card
              key={metric.title}
              className="group overflow-hidden border border-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300 hover:scale-[1.02] cursor-pointer"
              style={{ animationDelay: `${index * 75}ms` }}
              onClick={() => navigate(metricRoutes[index])}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${metric.bgColor}`}>
                    <metric.icon className={`h-6 w-6 ${metric.color}`} strokeWidth={2} />
                  </div>
                </div>
                <div className="mt-5">
                  <p className="text-4xl font-bold text-foreground tracking-tight">{metric.value}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-1">{metric.title}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card
          className="border border-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300 hover:scale-[1.01] cursor-pointer"
          onClick={() => navigate('/consultas?filtro=semana')}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/8">
                <Clock className="h-5 w-5 text-primary" strokeWidth={2} />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Próximas Consultas</CardTitle>
                <CardDescription className="text-sm">Agendadas para os próximos dias</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {upcomingAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
                </div>
                <p className="text-base font-medium text-muted-foreground">Nenhuma consulta agendada</p>
                <p className="text-sm text-muted-foreground/70 mt-1">As próximas consultas aparecerão aqui</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {upcomingAppointments.map((appointment) => {
                  const patient = patients.find((p) => p.id === appointment.patient_id);
                  return (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between py-4 first:pt-0 last:pb-0 transition-colors hover:bg-muted/30 -mx-6 px-6"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/8 text-primary font-semibold text-sm shrink-0">
                          {patient?.full_name?.split(' ').map((n) => n[0]).slice(0, 2).join('') || '??'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{patient?.full_name || 'Paciente'}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(appointment.date)} às {appointment.time} · {appointment.procedure_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {appointment.lembrete_enviado && (
                          <span className="text-xs text-success font-medium">✓ Lembrete</span>
                        )}
                        <StatusBadge status={appointment.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
