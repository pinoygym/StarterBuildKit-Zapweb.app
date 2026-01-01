'use client';

import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BranchTable } from '@/components/branches/branch-table';
import { BranchDialog } from '@/components/branches/branch-dialog';
import { useBranches } from '@/hooks/use-branches';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { Building2 } from 'lucide-react';

export default function BranchesPage() {
  const { branches, loading, createBranch, updateBranch, deleteBranch } = useBranches();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);

  const filteredBranches = branches.filter((branch) => {
    const query = searchQuery.toLowerCase();
    return (
      branch.name.toLowerCase().includes(query) ||
      branch.code.toLowerCase().includes(query) ||
      branch.location.toLowerCase().includes(query) ||
      branch.manager.toLowerCase().includes(query)
    );
  });

  const handleCreate = () => {
    setEditingBranch(null);
    setDialogOpen(true);
  };

  const handleEdit = (branch: any) => {
    setEditingBranch(branch);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingBranch(null);
  };

  const handleSave = async (id: string | undefined, data: any) => {
    if (id) {
      return await updateBranch(id, data);
    } else {
      return await createBranch(data);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader
          title="Branches"
          description="Manage your business locations"
        />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Branches"
        description="Manage your business locations"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Branches' },
        ]}
        actions={
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Branch
          </Button>
        }
      />

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search branches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Branch Table */}
      {filteredBranches.length === 0 && searchQuery === '' ? (
        <EmptyState
          icon={Building2}
          title="No branches yet"
          description="Get started by creating your first branch location"
          actionLabel="Add Branch"
          onAction={handleCreate}
        />
      ) : filteredBranches.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No results found"
          description="Try adjusting your search query"
        />
      ) : (
        <BranchTable
          branches={filteredBranches}
          onEdit={handleEdit}
          onDelete={deleteBranch}
        />
      )}

      {/* Branch Dialog */}
      <BranchDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        branch={editingBranch}
        onSave={handleSave}
      />
    </div>
  );
}
