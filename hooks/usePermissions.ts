'use client';

import { useState, useEffect } from 'react';
import { Permission } from '@prisma/client';

export function usePermissions(grouped = false) {
  const [permissions, setPermissions] = useState<Permission[] | Record<string, Permission[]>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setIsLoading(true);
        const queryParams = new URLSearchParams({
          ...(grouped && { grouped: 'true' }),
        });

        const response = await fetch(`/api/permissions?${queryParams}`);
        if (!response.ok) throw new Error('Failed to fetch permissions');
        
        const result = await response.json();
        setPermissions(result.permissions || []);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, [grouped]);

  return { permissions, isLoading, error };
}
