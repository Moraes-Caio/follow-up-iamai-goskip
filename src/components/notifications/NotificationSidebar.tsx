import { cn } from '@/lib/utils';
import { 
  Inbox, 
  MailOpen, 
  Archive, 
  Calendar, 
  CheckCircle2,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

type FilterType = 'all' | 'unread' | 'archived';
type CategoryType = 'all' | 'upcoming' | 'completed';

interface NotificationSidebarProps {
  currentFilter: FilterType;
  currentCategory: CategoryType;
  onFilterChange: (filter: FilterType) => void;
  onCategoryChange: (category: CategoryType) => void;
  counts: {
    all: number;
    unread: number;
    archived: number;
    upcoming: number;
    completed: number;
  };
}

export function NotificationSidebar({
  currentFilter,
  currentCategory,
  onFilterChange,
  onCategoryChange,
  counts,
}: NotificationSidebarProps) {
  const filters = [
    { id: 'all' as FilterType, label: 'Todas', icon: Inbox, count: counts.all },
    { id: 'unread' as FilterType, label: 'Não lidas', icon: MailOpen, count: counts.unread },
    { id: 'archived' as FilterType, label: 'Arquivadas', icon: Archive, count: counts.archived },
  ];

  const categories = [
    { id: 'all' as CategoryType, label: 'Todas as Categorias', icon: Inbox, count: counts.all },
    { id: 'upcoming' as CategoryType, label: 'Consultas Próximas', icon: Calendar, count: counts.upcoming },
    { id: 'completed' as CategoryType, label: 'Consultas Concluídas', icon: CheckCircle2, count: counts.completed },
  ];

  return (
    <div className="w-64 shrink-0 border-r border-border bg-muted/30 p-4 hidden lg:block">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Filtros
      </h2>
      <div className="space-y-1">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              currentFilter === filter.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <filter.icon className="h-4 w-4" />
            <span className="flex-1 text-left">{filter.label}</span>
            <span className={cn(
              'text-xs',
              currentFilter === filter.id ? 'text-primary-foreground/80' : 'text-muted-foreground'
            )}>
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      <Separator className="my-4" />

      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Categorias
      </h2>
      <div className="space-y-1">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              currentCategory === category.id
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <category.icon className="h-4 w-4" />
            <span className="flex-1 text-left">{category.label}</span>
            <span className="text-xs text-muted-foreground">
              {category.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
