import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  RoleWithPermissions,
  CreateRoleInput,
  UpdateRoleInput,
  RoleFilters,
  AssignPermissionsInput
} from '@/types/role.types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  roles?: T;
  message?: string;
  error?: any;
}

// Fetch all roles
export function useRoles(filters?: RoleFilters) {
  return useQuery<ApiResponse<RoleWithPermissions[]>>({
    queryKey: ['roles', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.isSystem !== undefined) params.append('isSystem', String(filters.isSystem));

      const response = await fetch(`/api/roles?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch roles');
      return response.json();
    },
  });
}

// Fetch single role by ID
export function useRole(roleId: string) {
  return useQuery<ApiResponse<RoleWithPermissions>>({
    queryKey: ['roles', roleId],
    queryFn: async () => {
      const response = await fetch(`/api/roles/${roleId}`);
      if (!response.ok) throw new Error('Failed to fetch role');
      return response.json();
    },
    enabled: !!roleId,
  });
}

// Create role mutation
export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRoleInput) => {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to create role');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

// Update role mutation
export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleId, data }: { roleId: string; data: UpdateRoleInput }) => {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to update role');
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles', variables.roleId] });
    },
  });
}

// Delete role mutation
export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roleId: string) => {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to delete role');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

// Assign permissions to role
export function useAssignPermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => {
      const response = await fetch(`/api/roles/${roleId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionIds }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to assign permissions');
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles', variables.roleId] });
    },
  });
}
