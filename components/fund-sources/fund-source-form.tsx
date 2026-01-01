'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useCreateFundSource, useUpdateFundSource } from '@/hooks/use-fund-sources';
import { useBranches } from '@/hooks/use-branches';
import { FundSourceWithBranch, FUND_SOURCE_TYPE_LABELS, FundSourceType } from '@/types/fund-source.types';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const fundSourceSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    code: z.string().min(1, 'Code is required').max(20, 'Code must be 20 characters or less'),
    type: z.string().min(1, 'Type is required'),
    branchId: z.string().optional().nullable(),
    bankName: z.string().optional().nullable(),
    accountNumber: z.string().optional().nullable(),
    accountHolder: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    openingBalance: z.coerce.number().min(0, 'Opening balance cannot be negative').optional(),
    isDefault: z.boolean().optional(),
});

type FundSourceFormData = z.infer<typeof fundSourceSchema>;

interface FundSourceFormProps {
    open: boolean;
    onClose: () => void;
    fundSource?: FundSourceWithBranch | null;
}

export function FundSourceForm({ open, onClose, fundSource }: FundSourceFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!fundSource;

    const { data: branches = [] } = useBranches();
    const createMutation = useCreateFundSource();
    const updateMutation = useUpdateFundSource();

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm<FundSourceFormData>({
        resolver: zodResolver(fundSourceSchema),
        defaultValues: {
            name: fundSource?.name || '',
            code: fundSource?.code || '',
            type: fundSource?.type || '',
            branchId: fundSource?.branchId || null,
            bankName: fundSource?.bankName || '',
            accountNumber: fundSource?.accountNumber || '',
            accountHolder: fundSource?.accountHolder || '',
            description: fundSource?.description || '',
            openingBalance: fundSource?.openingBalance || 0,
            isDefault: fundSource?.isDefault || false,
        },
    });

    const selectedType = watch('type');
    const isBankAccount = selectedType === 'BANK_ACCOUNT';

    const onSubmit = async (data: FundSourceFormData) => {
        setIsSubmitting(true);
        try {
            if (isEditing) {
                await updateMutation.mutateAsync({
                    id: fundSource.id,
                    data: {
                        name: data.name,
                        code: data.code,
                        type: data.type as FundSourceType,
                        branchId: data.branchId || null,
                        bankName: data.bankName || null,
                        accountNumber: data.accountNumber || null,
                        accountHolder: data.accountHolder || null,
                        description: data.description || null,
                        isDefault: data.isDefault,
                    },
                });
                toast.success('Fund source updated successfully');
            } else {
                await createMutation.mutateAsync({
                    name: data.name,
                    code: data.code,
                    type: data.type as FundSourceType,
                    branchId: data.branchId || null,
                    bankName: data.bankName || null,
                    accountNumber: data.accountNumber || null,
                    accountHolder: data.accountHolder || null,
                    description: data.description || null,
                    openingBalance: data.openingBalance || 0,
                    isDefault: data.isDefault,
                });
                toast.success('Fund source created successfully');
            }
            reset();
            onClose();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Fund Source' : 'Add Fund Source'}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update the fund source details.'
                            : 'Create a new fund source to track your finances.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input id="name" {...register('name')} placeholder="Main Cash Register" />
                            {errors.name && (
                                <p className="text-sm text-destructive">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="code">Code *</Label>
                            <Input id="code" {...register('code')} placeholder="CASH-01" />
                            {errors.code && (
                                <p className="text-sm text-destructive">{errors.code.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Type *</Label>
                            <Select
                                value={selectedType}
                                onValueChange={(value) => setValue('type', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(FUND_SOURCE_TYPE_LABELS).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.type && (
                                <p className="text-sm text-destructive">{errors.type.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="branchId">Branch</Label>
                            <Select
                                value={watch('branchId') || 'company_wide'}
                                onValueChange={(value) => setValue('branchId', value === 'company_wide' ? null : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Company-wide" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="company_wide">Company-wide</SelectItem>
                                    {branches.map((branch: { id: string; name: string }) => (
                                        <SelectItem key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {isBankAccount && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bankName">Bank Name</Label>
                                    <Input id="bankName" {...register('bankName')} placeholder="BDO" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="accountNumber">Account Number</Label>
                                    <Input id="accountNumber" {...register('accountNumber')} placeholder="****1234" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="accountHolder">Account Holder</Label>
                                <Input id="accountHolder" {...register('accountHolder')} placeholder="Company Name" />
                            </div>
                        </>
                    )}

                    {!isEditing && (
                        <div className="space-y-2">
                            <Label htmlFor="openingBalance">Opening Balance (₱)</Label>
                            <Input
                                id="openingBalance"
                                type="number"
                                step="0.01"
                                {...register('openingBalance')}
                                placeholder="0.00"
                            />
                            {errors.openingBalance && (
                                <p className="text-sm text-destructive">{errors.openingBalance.message}</p>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            {...register('description')}
                            placeholder="Optional description..."
                            rows={2}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="isDefault"
                            checked={watch('isDefault') || false}
                            onCheckedChange={(checked) => setValue('isDefault', checked)}
                        />
                        <Label htmlFor="isDefault">Set as default fund source</Label>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
