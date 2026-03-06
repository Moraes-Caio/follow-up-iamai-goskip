import { useState, useMemo } from 'react';
import { useNotifications, type NotificationRow } from '@/hooks/useNotifications';
import { MainLayout } from '@/components/layout/MainLayout';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { NotificationSidebar } from '@/components/notifications/NotificationSidebar';
import { NotificationDetail } from '@/components/notifications/NotificationDetail';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import type { Notification } from '@/types';
import { RefreshCw, Search, MoreVertical, Archive, Trash2, MailOpen, Bell, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

type FilterType = 'all' | 'unread' | 'archived';
type CategoryType = 'all' | 'upcoming' | 'completed';

const ITEMS_PER_PAGE = 10;

// Adapter to convert NotificationRow to the Notification type expected by child components
function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    type: row.type,
    appointmentId: row.appointment_id || '',
    title: row.title,
    description: row.description,
    isRead: row.is_read ?? false,
    isArchived: row.is_archived ?? false,
    priority: row.priority,
    category: row.category || '',
    createdAt: row.created_at,
  };
}

export default function Notifications() {
  const {
    notifications: notificationRows,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteMultiple,
    archiveNotification,
    archiveMultiple,
    unarchiveNotification,
  } = useNotifications();

  const notifications = useMemo(() => notificationRows.map(toNotification), [notificationRows]);

  const [filter, setFilter] = useState<FilterType>('all');
  const [category, setCategory] = useState<CategoryType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeNotification, setActiveNotification] = useState<Notification | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredNotifications = useMemo(() => {
    let result = [...notifications];
    if (filter === 'unread') result = result.filter((n) => !n.isRead && !n.isArchived);
    else if (filter === 'archived') result = result.filter((n) => n.isArchived);
    else result = result.filter((n) => !n.isArchived);
    if (category === 'upcoming') result = result.filter((n) => n.type === 'upcoming_appointment');
    else if (category === 'completed') result = result.filter((n) => n.type === 'completed_appointment');
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((n) => n.title.toLowerCase().includes(query) || n.description.toLowerCase().includes(query));
    }
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result;
  }, [notifications, filter, category, searchQuery]);

  const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE);
  const paginatedNotifications = filteredNotifications.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const counts = useMemo(() => ({
    all: notifications.filter((n) => !n.isArchived).length,
    unread: notifications.filter((n) => !n.isRead && !n.isArchived).length,
    archived: notifications.filter((n) => n.isArchived).length,
    upcoming: notifications.filter((n) => n.type === 'upcoming_appointment' && !n.isArchived).length,
    completed: notifications.filter((n) => n.type === 'completed_appointment' && !n.isArchived).length,
  }), [notifications]);

  const allSelected = paginatedNotifications.length > 0 && paginatedNotifications.every((n) => selectedIds.has(n.id));

  const handleSelectAll = (checked: boolean) => {
    const newSelected = new Set(selectedIds);
    paginatedNotifications.forEach((n) => checked ? newSelected.add(n.id) : newSelected.delete(n.id));
    setSelectedIds(newSelected);
  };

  const handleSelect = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    checked ? newSelected.add(id) : newSelected.delete(id);
    setSelectedIds(newSelected);
  };

  const handleMarkAsRead = async (id: string) => { await markAsRead(id); toast({ title: 'Notificação marcada como lida' }); };
  const handleArchive = async (id: string) => { await archiveNotification(id); if (activeNotification?.id === id) setActiveNotification(null); toast({ title: 'Notificação arquivada' }); };
  const handleUnarchive = async (id: string) => { await unarchiveNotification(id); toast({ title: 'Notificação desarquivada' }); };
  const handleDelete = async (id: string) => { await deleteNotification(id); if (activeNotification?.id === id) setActiveNotification(null); selectedIds.delete(id); setSelectedIds(new Set(selectedIds)); toast({ title: 'Notificação excluída' }); };
  const handleClick = async (notification: Notification) => { setActiveNotification(notification); if (!notification.isRead) await markAsRead(notification.id); };
  const handleBulkArchive = async () => { const ids = Array.from(selectedIds); await archiveMultiple(ids); setSelectedIds(new Set()); setActiveNotification(null); toast({ title: `${ids.length} notificações arquivadas` }); };
  const handleBulkDelete = async () => { const ids = Array.from(selectedIds); await deleteMultiple(ids); setSelectedIds(new Set()); setActiveNotification(null); toast({ title: `${ids.length} notificações excluídas` }); };
  const handleBulkMarkAsRead = async () => { for (const id of selectedIds) await markAsRead(id); setSelectedIds(new Set()); toast({ title: 'Notificações marcadas como lidas' }); };
  const handleRefresh = () => toast({ title: 'Notificações atualizadas' });

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, filteredNotifications.length);

  if (isLoading) {
    return <MainLayout><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-foreground lg:text-3xl">Notificações</h1><p className="text-muted-foreground">Gerencie suas notificações do sistema</p></div>
        <div className="flex h-[calc(100vh-220px)] bg-card rounded-lg border border-border overflow-hidden">
          <NotificationSidebar currentFilter={filter} currentCategory={category} onFilterChange={(f) => { setFilter(f); setCurrentPage(1); setSelectedIds(new Set()); }} onCategoryChange={(c) => { setCategory(c); setCurrentPage(1); setSelectedIds(new Set()); }} counts={counts} />
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
              <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} className="h-4 w-4" />
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRefresh}><RefreshCw className="h-4 w-4" /></Button>
              {selectedIds.size > 0 && (
                <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 gap-1">Ações<MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="start"><DropdownMenuItem onClick={handleBulkArchive}><Archive className="h-4 w-4 mr-2" />Arquivar selecionadas</DropdownMenuItem><DropdownMenuItem onClick={handleBulkMarkAsRead}><MailOpen className="h-4 w-4 mr-2" />Marcar como lidas</DropdownMenuItem><DropdownMenuItem onClick={handleBulkDelete} className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4 mr-2" />Excluir selecionadas</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
              )}
              <div className="flex-1" />
              <div className="relative w-64"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar notificações..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="pl-9 h-8" /></div>
              {filteredNotifications.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{startIndex}-{endIndex} de {filteredNotifications.length}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              )}
            </div>
            <ScrollArea className="flex-1">
              {paginatedNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center"><Bell className="h-12 w-12 text-muted-foreground/50 mb-3" /><p className="text-lg font-medium text-foreground">Nenhuma notificação</p><p className="text-sm text-muted-foreground">{filter === 'archived' ? 'Você não tem notificações arquivadas' : filter === 'unread' ? 'Todas as notificações foram lidas' : 'Suas notificações aparecerão aqui'}</p></div>
              ) : (
                <div>{paginatedNotifications.map((notification) => (<NotificationItem key={notification.id} notification={notification} isSelected={selectedIds.has(notification.id)} onSelect={handleSelect} onMarkAsRead={handleMarkAsRead} onArchive={handleArchive} onDelete={handleDelete} onClick={handleClick} isActive={activeNotification?.id === notification.id} />))}</div>
              )}
            </ScrollArea>
          </div>
          <NotificationDetail notification={activeNotification} onClose={() => setActiveNotification(null)} onArchive={handleArchive} onUnarchive={handleUnarchive} onDelete={handleDelete} />
        </div>
      </div>
    </MainLayout>
  );
}
