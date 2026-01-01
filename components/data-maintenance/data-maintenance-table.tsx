'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Edit, Trash2, MoreVertical, Power, Search } from 'lucide-react';
import { toast } from 'sonner';
import { ReferenceDataBase, ReferenceDataConfig } from '@/types/data-maintenance.types';
import { format } from 'date-fns';

interface DataMaintenanceTableProps<T extends ReferenceDataBase> {
  data: T[];
  config: ReferenceDataConfig;
  onEdit: (item: T) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function DataMaintenanceTable<T extends ReferenceDataBase>({
  data,
  config,
  onEdit,
  onRefresh,
  isLoading = false,
}: DataMaintenanceTableProps<T>) {
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const filteredData = data.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.code?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (item: T) => {
    if (item.isSystemDefined) {
      toast.error('Cannot delete system-defined records');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    setDeleting(item.id);

    try {
      const response = await fetch(`/api/data-maintenance/${config.type}/${item.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete');
      }

      toast.success(`${config.singularTitle} deleted successfully`);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleStatus = async (item: T) => {
    setToggling(item.id);

    try {
      const response = await fetch(`/api/data-maintenance/${config.type}/${item.id}/toggle-status`, {
        method: 'PATCH',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to toggle status');
      }

      toast.success(`Status updated to ${result.data.status}`);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle status');
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${config.title.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              {config.hasApplicableTo && <TableHead>Applicable To</TableHead>}
              {config.hasVendorFields && <TableHead>Contact</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {search ? 'No results found' : `No ${config.title.toLowerCase()} yet`}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.name}
                    {item.isSystemDefined && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        System
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{item.code}</code>
                  </TableCell>
                  {config.hasApplicableTo && (
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {((item as any).applicableTo || []).map((context: string) => (
                          <Badge key={context} variant="secondary" className="text-xs">
                            {context.toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  )}
                  {config.hasVendorFields && (
                    <TableCell>
                      {(item as any).contactPerson && (
                        <div className="text-sm">
                          <div>{(item as any).contactPerson}</div>
                          {(item as any).phone && (
                            <div className="text-muted-foreground">{(item as any).phone}</div>
                          )}
                        </div>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(item.createdAt), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(item)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(item)}
                          disabled={toggling === item.id}
                        >
                          <Power className="mr-2 h-4 w-4" />
                          {toggling === item.id ? 'Updating...' : 'Toggle Status'}
                        </DropdownMenuItem>
                        {!item.isSystemDefined && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(item)}
                              disabled={deleting === item.id}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {deleting === item.id ? 'Deleting...' : 'Delete'}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredData.length} of {data.length} records
      </div>
    </div>
  );
}
