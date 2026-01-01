import { useMutation, useQueryClient } from '@tanstack/react-query';

interface VerifyUserResponse {
  success: boolean;
  message: string;
}

// Verify user mutation
export function useVerifyUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Use the dedicated verify endpoint
      const response = await fetch(`/api/users/${userId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to verify user');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}