'use client';

import { useState } from 'react';
import { UserWithRelations } from '@/types/user.types';
import { useDeleteUser } from '@/hooks/use-users';
import { useVerifyUser } from '@/hooks/use-verify-user';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';

interface UserTableProps {
  users: UserWithRelations[];
  onEdit: (user: UserWithRelations) => void;
}

export function UserTable({ users, onEdit }: UserTableProps) {
  const [userToDelete, setUserToDelete] = useState<UserWithRelations | null>(null);
  const deleteUser = useDeleteUser();
  const verifyUser = useVerifyUser();

  const handleDelete = async () => {
    if (!userToDelete) return;

    try {
      await deleteUser.mutateAsync(userToDelete.id);
      toast.success('User deleted successfully');
      setUserToDelete(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const handleVerify = async (user: UserWithRelations) => {
    try {
      await verifyUser.mutateAsync(user.id);
      toast.success(`User ${user.email} verified successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify user');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      ACTIVE: 'default',
      INACTIVE: 'secondary',
      SUSPENDED: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getEmailVerifiedBadge = (verified: boolean) => {
    return verified ? (
      <Badge variant="default">Verified</Badge>
    ) : (
      <Badge variant="secondary">Not Verified</Badge>
    );
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Email Verified</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.Role?.name || 'No Role'}</TableCell>
                  <TableCell>{user.Branch?.name || '-'}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>{getEmailVerifiedBadge(user.emailVerified)}</TableCell>
                  <TableCell>
                    {user.lastLoginAt 
                      ? new Date(user.lastLoginAt).toLocaleDateString() 
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!user.emailVerified && (
                          <DropdownMenuItem onClick={() => handleVerify(user)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Verify Email
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onEdit(user)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setUserToDelete(user)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmationDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
        title="Delete User"
        description={`Are you sure you want to delete ${userToDelete?.firstName} ${userToDelete?.lastName}? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmText="Delete"
        variant="destructive"
      />
    </>
  );
}