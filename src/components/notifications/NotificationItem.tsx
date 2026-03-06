import { cn } from '@/lib/utils';
import type { Notification } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, 
  CheckCircle2, 
  Archive, 
  Trash2, 
  MailOpen,
  AlertCircle,
} from 'lucide-react';

interface NotificationItemProps {
  notification: Notification;
  isSelected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onMarkAsRead: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (notification: Notification) => void;
  isActive?: boolean;
}

export function NotificationItem({
  notification,
  isSelected,
  onSelect,
  onMarkAsRead,
  onArchive,
  onDelete,
  onClick,
  isActive = false,
}: NotificationItemProps) {
  const Icon = notification.type === 'upcoming_appointment' ? Calendar : CheckCircle2;
  const iconColor = notification.type === 'upcoming_appointment' 
    ? 'text-primary' 
    : notification.description.includes('não compareceu') || notification.description.includes('não realizada')
      ? 'text-destructive'
      : 'text-secondary';

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 px-4 py-3 border-b border-border cursor-pointer transition-colors',
        !notification.isRead && 'bg-primary/5',
        isSelected && 'bg-muted',
        isActive && 'bg-muted',
        'hover:bg-muted/50'
      )}
      onClick={() => onClick(notification)}
    >
      {/* Checkbox */}
      <div 
        className="flex items-center pt-0.5"
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(notification.id, !!checked)}
          className="h-4 w-4"
        />
      </div>

      {/* Icon */}
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted', iconColor)}>
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-28">
        <div className="flex items-center gap-2">
          <p className={cn(
            'text-sm truncate',
            !notification.isRead ? 'font-semibold text-foreground' : 'text-muted-foreground'
          )}>
            {notification.title}
          </p>
          {notification.priority === 'high' && (
            <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
          {notification.description}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          {timeAgo}
        </p>
      </div>

      {/* Quick Actions (visible on hover) */}
      <div 
        className="absolute right-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-background rounded-md shadow-sm border border-border p-1 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {!notification.isRead && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onMarkAsRead(notification.id)}
            title="Marcar como lida"
          >
            <MailOpen className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onArchive(notification.id)}
          title="Arquivar"
        >
          <Archive className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={() => onDelete(notification.id)}
          title="Excluir"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
