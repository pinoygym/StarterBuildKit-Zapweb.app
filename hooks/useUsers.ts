'use client';

import { useState, useEffect } from 'react';
import { UserWithRelations, UserFilters, PaginatedUsers, CreateUserInput, UpdateUserInput } from '@/types/user.types';

export function useUsers(filters?: UserFilters, page = 1, limit = 20) {
  const [data, setData] = useState<PaginatedUsers | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters?.search && { search: filters.search }),
        ...(filters?.roleId && { roleId: filters.roleId }),
        ...(filters?.branchId && { branchId: filters.branchId }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.emailVerified !== undefined && { emailVerified: filters.emailVerified.toString() }),
      });

      const response = await fetch(`/api/users?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, limit, JSON.stringify(filters)]);

  return {
    users: data?.data || [],
    total: data?.total || 0,
    page: data?.page || 1,
    totalPages: data?.totalPages || 1,
    isLoading,
    error,
    refetch: fetchUsers,
  };
}

export function useUser(userId: string | null) {
  const [user, setUser] = useState<UserWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch user');
        
        const result = await response.json();
        setUser(result.user);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  return { user, isLoading, error };
}

export function useUserMutations() {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUser = async (data: CreateUserInput) => {
    try {
      setIsCreating(true);
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create user');
      }

      const result = await response.json();
      setError(null);
      return result.user;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  const updateUser = async (userId: string, data: UpdateUserInput) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user');
      }

      const result = await response.json();
      setError(null);
      return result.user;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete user');
      }

      setError(null);
      return true;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    createUser,
    updateUser,
    deleteUser,
    isCreating,
    isUpdating,
    isDeleting,
    error,
  };
}
