'use client';

import { Building2, Check, ChevronDown, Lock } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBranch } from '@/hooks/use-branch';
import { Skeleton } from '@/components/ui/skeleton';

export function BranchSelector() {
  const { branches, selectedBranch, setSelectedBranch, isLoading, canChangeBranch } = useBranch();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <Skeleton className="h-9 w-[200px]" />
      </div>
    );
  }

  if (!branches || branches.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground border rounded-lg bg-muted/50">
        <Building2 className="h-4 w-4" />
        <span>No branches available</span>
      </div>
    );
  }

  // If user cannot change branch (e.g., Cashier role), show locked state
  if (canChangeBranch === false) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg bg-muted/50">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{selectedBranch?.name || 'Loading...'}</span>
        {selectedBranch?.code && (
          <span className="text-xs text-muted-foreground">({selectedBranch.code})</span>
        )}
        <Lock className="h-3 w-3 ml-1 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <Select
        value={selectedBranch?.id || 'all'}
        onValueChange={(value) => {
          if (value === 'all') {
            setSelectedBranch(null);
          } else {
            const branch = branches.find((b) => b.id === value);
            if (branch) setSelectedBranch(branch);
          }
        }}
      >
        <SelectTrigger className="w-[200px] h-9 border-muted-foreground/20">
          <SelectValue placeholder="Select branch">
            {selectedBranch ? (
              <div className="flex items-center gap-2">
                <span className="font-medium">{selectedBranch.name}</span>
                {selectedBranch.code && (
                  <span className="text-xs text-muted-foreground">({selectedBranch.code})</span>
                )}
              </div>
            ) : (
              <span className="font-medium">All Branches</span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center justify-between w-full gap-2">
              <span className="font-medium">All Branches</span>
              {!selectedBranch && <Check className="h-4 w-4" />}
            </div>
          </SelectItem>
          {branches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id}>
              <div className="flex items-center justify-between w-full gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{branch.name}</span>
                  {branch.code && (
                    <span className="text-xs text-muted-foreground">({branch.code})</span>
                  )}
                </div>
                {selectedBranch?.id === branch.id && <Check className="h-4 w-4" />}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
