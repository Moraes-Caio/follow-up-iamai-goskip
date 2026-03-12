import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { RolePermissions } from '@/types';
import { permissionCategories, defaultPermissions, basePermissionKeys } from '@/types';
import { Shield, Search, Settings2, Check } from 'lucide-react';

interface PermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissions: RolePermissions;
  onSave: (permissions: RolePermissions) => void;
}

// All permission keys that appear in the UI (excludes base permissions)
const configurableKeys = permissionCategories.flatMap(cat => cat.permissions.map(p => p.key));

export function PermissionsDialog({
  open,
  onOpenChange,
  permissions,
  onSave,
}: PermissionsDialogProps) {
  const [localPermissions, setLocalPermissions] = useState<RolePermissions>({ ...permissions });
  const [searchQuery, setSearchQuery] = useState('');

  // Sync permissions from parent whenever the dialog opens or permissions prop changes
  useEffect(() => {
    if (open) {
      setLocalPermissions({ ...permissions });
      setSearchQuery('');
    }
  }, [open, permissions]);

  // Count only configurable permissions (not base ones)
  const totalEnabled = configurableKeys.filter(k => localPermissions[k]).length;
  const totalPermissions = configurableKeys.length;

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return permissionCategories;
    const q = searchQuery.toLowerCase();
    return permissionCategories
      .map((cat) => ({
        ...cat,
        permissions: cat.permissions.filter(
          (p) =>
            p.label.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            cat.label.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.permissions.length > 0);
  }, [searchQuery]);

  const handlePermissionChange = (key: keyof RolePermissions, checked: boolean) => {
    setLocalPermissions((prev) => ({ ...prev, [key]: checked }));
  };

  const handleSelectAllCategory = (categoryId: string, select: boolean) => {
    const category = permissionCategories.find((c) => c.id === categoryId);
    if (!category) return;
    setLocalPermissions((prev) => {
      const next = { ...prev };
      category.permissions.forEach((p) => {
        next[p.key] = select;
      });
      return next;
    });
  };

  const handleSelectAll = () => {
    setLocalPermissions((prev) => {
      const next = { ...prev };
      for (const key of configurableKeys) {
        next[key] = true;
      }
      return next;
    });
  };

  const handleClearAll = () => {
    setLocalPermissions((prev) => {
      const next = { ...prev };
      for (const key of configurableKeys) {
        next[key] = false;
      }
      return next;
    });
  };

  const handleSave = () => {
    onSave(localPermissions);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Compact Header */}
        <div className="px-5 pt-4 pb-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between gap-3 pr-6">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <DialogTitle className="text-base">Permissões e Limitações</DialogTitle>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'text-xs px-2 py-0.5 shrink-0 font-medium',
                totalEnabled === totalPermissions
                  ? 'bg-primary/10 text-primary border-primary/20'
                  : totalEnabled > 0
                  ? 'bg-warning/10 text-warning border-warning/20'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <Check className="h-3 w-3 mr-1" />
              {totalEnabled}/{totalPermissions}
            </Badge>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar permissões..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <DialogDescription className="sr-only">
            Defina o que esta função pode acessar e gerenciar no sistema
          </DialogDescription>
        </div>

        {/* Body - Category Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto p-0.5">
          <div className="p-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredCategories.map((category) => {
                const enabledCount = category.permissions.filter(
                  (p) => localPermissions[p.key]
                ).length;
                const allSelected = enabledCount === category.permissions.length;
                const someSelected = enabledCount > 0 && !allSelected;

                return (
                  <div
                    key={category.id}
                    className={cn(
                      'rounded-lg border bg-card p-5 transition-all duration-200',
                      allSelected
                        ? 'border-primary/30 shadow-sm'
                        : someSelected
                        ? 'border-warning/30 shadow-sm'
                        : 'border-border hover:border-primary/20 hover:shadow-sm'
                    )}
                  >
                    {/* Category Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xl shrink-0">
                          {category.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-foreground">
                            {category.label}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {category.permissions.length} permissões
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-xs font-semibold',
                            allSelected && 'bg-primary/10 text-primary',
                            someSelected && 'bg-warning/10 text-warning',
                            !allSelected && !someSelected && 'bg-muted text-muted-foreground'
                          )}
                        >
                          {enabledCount}/{category.permissions.length}
                        </Badge>
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={(checked) =>
                            handleSelectAllCategory(category.id, !!checked)
                          }
                          className="h-5 w-5"
                          aria-label={`Selecionar todas as permissões de ${category.label}`}
                        />
                      </div>
                    </div>

                    {/* Permissions List */}
                    <div className="space-y-1">
                      {category.permissions.map((permission) => (
                        <label
                          key={permission.key}
                          htmlFor={`perm-${permission.key}`}
                          className={cn(
                            'flex items-center gap-3 p-2.5 rounded-md cursor-pointer transition-colors duration-150',
                            localPermissions[permission.key]
                              ? 'bg-primary/5 hover:bg-primary/10'
                              : 'hover:bg-muted/60'
                          )}
                        >
                          <Checkbox
                            id={`perm-${permission.key}`}
                            checked={localPermissions[permission.key]}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(permission.key, !!checked)
                            }
                            className="h-4.5 w-4.5 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-sm text-foreground block leading-tight">
                              {permission.label}
                            </span>
                            {permission.description && (
                              <span className="text-xs text-muted-foreground leading-tight">
                                {permission.description}
                              </span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredCategories.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Nenhuma permissão encontrada</p>
                <p className="text-sm">Tente buscar com outros termos</p>
              </div>
            )}
          </div>
        </div>

        {/* Compact Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/30 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1.5">
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={handleSelectAll}>
                Selecionar Todos
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={handleClearAll}>
                Limpar
              </Button>
            </div>
            <div className="flex gap-1.5">
              <Button variant="ghost" size="sm" className="h-8" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button size="sm" className="h-8 gap-1.5" onClick={handleSave}>
                <Settings2 className="h-3.5 w-3.5" />
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
