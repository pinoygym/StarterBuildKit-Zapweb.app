'use client';

import { useState, useEffect } from 'react';
import { Role } from '@prisma/client';

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/roles');
      if (!response.ok) throw new Error('Failed to fetch roles');
      
      const result = await response.json();
      setRoles(result.roles || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return { roles, isLoading, error, refetch: fetchRoles };
}

export function useRoleMutations() {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRole = async (data: { name: string; code: string; description?: string }) => {
    try {
      setIsCreating(true);
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create role');
      }

      const result = await response.json();
      setError(null);
      return result.role;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createRole,
    isCreating,
    isUpdating,
    isDeleting,
    error,
  };
}
