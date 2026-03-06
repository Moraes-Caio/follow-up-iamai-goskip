import { cn } from '@/lib/utils';

type StatusType = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'sent' | 'delivered' | 'read' | 'failed' | 'active' | 'inactive';

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  pending: {
    label: 'Pendente',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  confirmed: {
    label: 'Confirmado',
    className: 'bg-success/10 text-success border-success/20',
  },
  completed: {
    label: 'Realizado',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  cancelled: {
    label: 'Cancelado',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  sent: {
    label: 'Enviado',
    className: 'bg-info/10 text-info border-info/20',
  },
  delivered: {
    label: 'Entregue',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  read: {
    label: 'Lido',
    className: 'bg-success/10 text-success border-success/20',
  },
  failed: {
    label: 'Falhou',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  active: {
    label: 'Ativo',
    className: 'bg-success/10 text-success border-success/20',
  },
  inactive: {
    label: 'Inativo',
    className: 'bg-muted text-muted-foreground border-muted',
  },
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
