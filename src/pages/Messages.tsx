import { useState, useMemo } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { usePatients } from '@/hooks/usePatients';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDateTime } from '@/lib/utils';
import type { MessageRow } from '@/hooks/useMessages';
import { MessageSquare, Bell, Calendar, Eye, CheckCircle2, CheckCheck, XCircle, Send, Loader2 } from 'lucide-react';

export default function Messages() {
  const { messages, isLoading } = useMessages();
  const { patients } = usePatients();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<MessageRow | null>(null);

  const filteredMessages = useMemo(() => {
    let filtered = [...messages];

    if (typeFilter !== 'all') {
      filtered = filtered.filter((m) => m.type === typeFilter);
    }

    filtered.sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());

    return filtered;
  }, [messages, typeFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Send className="h-4 w-4 text-info" />;
      case 'delivered':
        return <CheckCircle2 className="h-4 w-4 text-primary" />;
      case 'read':
        return <CheckCheck className="h-4 w-4 text-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Mensagens</h1>
            <p className="text-muted-foreground">Histórico de mensagens enviadas</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="periodic_return">Retorno Periódico</SelectItem>
              <SelectItem value="appointment_confirmation">Confirmação</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Messages List */}
        {filteredMessages.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-3 text-lg font-medium text-foreground">Nenhuma mensagem encontrada</p>
              <p className="text-sm text-muted-foreground">As mensagens enviadas aparecerão aqui</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredMessages.map((message) => {
              const patient = patients.find((p) => p.id === message.patient_id);

              return (
                <Card key={message.id} className="overflow-hidden transition-all hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                          message.type === 'appointment_confirmation' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                        }`}>
                          {message.type === 'appointment_confirmation' ? (
                            <Calendar className="h-6 w-6" />
                          ) : (
                            <Bell className="h-6 w-6" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground">{message.recipient_name}</p>
                            <StatusBadge status={message.status} />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {message.type === 'appointment_confirmation' ? 'Confirmação de Consulta' : 'Lembrete de Retorno'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDateTime(message.sent_at)} • {message.recipient_phone}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(message.status)}
                          <span className="text-sm text-muted-foreground">
                            {message.status === 'read' && message.read_at && `Lido ${formatDateTime(message.read_at)}`}
                            {message.status === 'delivered' && message.delivered_at && `Entregue ${formatDateTime(message.delivered_at)}`}
                            {message.status === 'sent' && 'Enviado'}
                            {message.status === 'failed' && 'Falha no envio'}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedMessage(message)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver mensagem
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Mensagem</DialogTitle>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Destinatário</p>
                  <p className="font-medium">{selectedMessage.recipient_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{selectedMessage.recipient_phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">
                    {selectedMessage.type === 'appointment_confirmation' ? 'Confirmação de Consulta' : 'Lembrete de Retorno'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={selectedMessage.status} />
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Mensagem</p>
                <div className="rounded-lg bg-muted p-4 whitespace-pre-wrap text-sm">
                  {selectedMessage.message_content}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Enviado em:</span>
                  <span>{formatDateTime(selectedMessage.sent_at)}</span>
                </div>
                {selectedMessage.delivered_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entregue em:</span>
                    <span>{formatDateTime(selectedMessage.delivered_at)}</span>
                  </div>
                )}
                {selectedMessage.read_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lido em:</span>
                    <span>{formatDateTime(selectedMessage.read_at)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
