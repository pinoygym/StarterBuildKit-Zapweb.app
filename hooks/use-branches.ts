'use client';

import { useState, useEffect } from 'react';
import { Branch } from '@prisma/client';

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/branches');
      const data = await response.json();
      
      if (data.success) {
        setBranches(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch branches');
      }
    } catch (err) {
      setError('Failed to fetch branches');
      console.error('Error fetching branches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const createBranch = async (data: any) => {
    const response = await fetch('/api/branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (result.success) {
      await fetchBranches();
    }
    
    return result;
  };

  const updateBranch = async (id: string, data: any) => {
    const response = await fetch(`/api/branches/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (result.success) {
      await fetchBranches();
    }
    
    return result;
  };

  const deleteBranch = async (id: string) => {
    const response = await fetch(`/api/branches/${id}`, {
      method: 'DELETE',
    });
    
    const result = await response.json();
    
    if (result.success) {
      await fetchBranches();
    }
    
    return result;
  };

  return {
    branches,
    loading,
    error,
    refetch: fetchBranches,
    createBranch,
    updateBranch,
    deleteBranch,
  };
}
