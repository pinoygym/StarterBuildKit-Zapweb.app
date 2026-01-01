'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

const STORAGE_KEY = 'inventoryPro_selectedBranch';

export function BranchProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranchState] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load branches from API
  useEffect(() => {
    async function loadBranches() {
      try {
        const response = await fetch('/api/branches');
        if (response.ok) {
          const result = await response.json();
          const data = result.success ? result.data : [];
          setBranches(data);

          // Load selected branch from localStorage
          const storedBranchId = localStorage.getItem(STORAGE_KEY);
          if (storedBranchId) {
            const branch = data.find((b: Branch) => b.id === storedBranchId);
            if (branch) {
              setSelectedBranchState(branch);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load branches:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadBranches();
  }, []);

  // Persist selected branch to localStorage
  const setSelectedBranch = (branch: Branch | null) => {
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
