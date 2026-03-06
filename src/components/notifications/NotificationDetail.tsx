import { useNavigate } from 'react-router-dom';
import type { Notification } from '@/types';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  X, 
  Calendar, 
  CheckCircle2, 
  Archive, 
  Trash2,
  ExternalLink,
  ArchiveRestore,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationDetailProps {
  notification: Notification | null;
  onClose: () => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NotificationDetail({
  notification,
  onClose,
  onArchive,
  onUnarchive,
  onDelete,
}: NotificationDetailProps) {
  const navigate = useNavigate();

  if (!notification) {
    return (
      <div className="flex-1 hidden lg:flex items-center justify-center bg-muted/20 text-muted-foreground">
        <div className="text-center">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Selecione uma notificação para ver os detalhes</p>
        </div>
      </div>
    );
  }

  const Icon = notification.type === 'upcoming_appointment' ? Calendar : CheckCircle2;
  const iconColor = notification.type === 'upcoming_appointment' 
    ? 'text-primary' 
    : notification.description.includes('não compareceu') || notification.description.includes('não realizada')
      ? 'text-destructive'
      : 'text-secondary';

  const formattedDate = format(new Date(notification.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
    locale: ptBR,
  });

  const handleViewAppointment = () => {
    navigate('/consultas');
  };

  return (
    <div className="flex-1 flex flex-col bg-background border-l border-border hidden lg:flex">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Detalhes</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Icon and Title */}
          <div className="flex items-start gap-4">
            <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted', iconColor)}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">{notification.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{notification.category}</p>
            </div>
          </div>

          {/* Date */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Data da Notificação
            </p>
            <p className="text-sm text-foreground">{formattedDate}</p>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Descrição
            </p>
            <p className="text-sm text-foreground leading-relaxed">{notification.description}</p>
          </div>

          {/* Priority */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Prioridade
            </p>
            <span className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
              notification.priority === 'high' && 'bg-destructive/10 text-destructive',
              notification.priority === 'normal' && 'bg-primary/10 text-primary',
              notification.priority === 'low' && 'bg-muted text-muted-foreground',
            )}>
              {notification.priority === 'high' ? 'Alta' : notification.priority === 'normal' ? 'Normal' : 'Baixa'}
            </span>
          </div>

        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-border px-6 py-4 space-y-3">
        <Button 
          className="w-full gap-2" 
          onClick={handleViewAppointment}
        >
          <ExternalLink className="h-4 w-4" />
          Ver Consulta
        </Button>
        <div className="flex gap-2">
          {notification.isArchived ? (
            <Button 
              variant="outline" 
              className="flex-1 gap-2"
              onClick={() => onUnarchive(notification.id)}
            >
              <ArchiveRestore className="h-4 w-4" />
              Desarquivar
            </Button>
          ) : (
            <Button 
              variant="outline" 
              className="flex-1 gap-2"
              onClick={() => onArchive(notification.id)}
            >
              <Archive className="h-4 w-4" />
              Arquivar
            </Button>
          )}
          <Button 
            variant="outline" 
            className="flex-1 gap-2 text-destructive hover:text-destructive"
            onClick={() => onDelete(notification.id)}
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>
    </div>
  );
}
