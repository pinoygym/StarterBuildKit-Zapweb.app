'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './auth.context';

interface Branch {
  id: string;
  name: string;
  code: string;
  location: string;
  manager: string;
  phone: string;
  status: string;
}

interface BranchContextType {
  branches: Branch[];
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch | null) => void;
  isLoading: boolean;
  canChangeBranch: boolean;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

const STORAGE_KEY = 'inventoryPro_selectedBranch';

// Roles that are restricted to their assigned branch only
const RESTRICTED_ROLES = ['Cashier', 'cashier', 'CASHIER'];

export function BranchProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranchState] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Determine if user can change branches
  // Users cannot change branches if:
  // 1. They have a restricted role (e.g., Cashier), OR
  // 2. Their branchLockEnabled setting is true
  const canChangeBranch = user?.Role?.name
    ? !RESTRICTED_ROLES.includes(user.Role.name) && !user.branchLockEnabled
    : !user?.branchLockEnabled;

  // Load branches from API when user is authenticated
  useEffect(() => {
    async function loadBranches() {
      // Only load branches if user is authenticated
      if (!isAuthenticated) {
        setBranches([]);
        setSelectedBranchState(null);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/branches');
        if (response.ok) {
          const result = await response.json();
          const data = result.success ? result.data : [];
          setBranches(data);

          // Auto-select branch based on user role and assignment:
          // For restricted roles (Cashiers): ONLY their assigned branch
          // For other roles: Priority system (assigned > localStorage > first)
          let branchToSelect: Branch | null = null;

          const userIsRestricted = user?.Role?.name && RESTRICTED_ROLES.includes(user.Role.name);

          if (userIsRestricted) {
            // RESTRICTED ROLES: Can only use their assigned branch
            if (user?.branchId) {
              branchToSelect = data.find((b: Branch) => b.id === user.branchId) || null;
            }
            // Note: If restricted user has no assigned branch, they get null (no access)
          } else {
            // NON-RESTRICTED ROLES: Use priority system

            // Priority 1: User's assigned branch
            if (user?.branchId) {
              branchToSelect = data.find((b: Branch) => b.id === user.branchId) || null;
            }

            // Priority 2: Previously selected branch from localStorage (if no assigned branch)
            if (!branchToSelect) {
              const storedBranchId = localStorage.getItem(STORAGE_KEY);
              if (storedBranchId) {
                branchToSelect = data.find((b: Branch) => b.id === storedBranchId) || null;
              }
            }

            // Priority 3: First available branch
            if (!branchToSelect && data.length > 0) {
              branchToSelect = data[0];
            }
          }

          if (branchToSelect) {
            setSelectedBranchState(branchToSelect);
            localStorage.setItem(STORAGE_KEY, branchToSelect.id);
          }
        } else if (response.status === 401) {
          // User is not authenticated - this is expected on public pages
          // Don't log an error, just set empty state
          setBranches([]);
          setSelectedBranchState(null);
        }
      } catch (error) {
        // Only log unexpected errors (network issues, etc.)
        console.error('Failed to load branches:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadBranches();
  }, [isAuthenticated, user]);

  // Persist selected branch to localStorage
  const setSelectedBranch = (branch: Branch | null) => {
    // Prevent restricted users from changing branches
    if (!canChangeBranch && user?.branchId) {
      console.warn('Branch change not allowed for restricted role');
      return;
    }

    setSelectedBranchState(branch);
    if (branch) {
      localStorage.setItem(STORAGE_KEY, branch.id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <BranchContext.Provider
      value={{
        branches,
        selectedBranch,
        setSelectedBranch,
        isLoading,
        canChangeBranch,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranchContext() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranchContext must be used within a BranchProvider');
  }
  return context;
}
