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
import { useCreateFundTransfer, useFundSources } from '@/hooks/use-fund-sources';
import { FundSourceWithBranch } from '@/types/fund-source.types';
import { toast } from 'sonner';
import { Loader2, ArrowRight } from 'lucide-react';

const transferSchema = z.object({
    fromFundSourceId: z.string().min(1, 'Source is required'),
    toFundSourceId: z.string().min(1, 'Destination is required'),
    amount: z.coerce.number().positive('Amount must be greater than 0'),
    transferFee: z.coerce.number().min(0, 'Fee cannot be negative').optional(),
    description: z.string().optional(),
}).refine((data) => data.fromFundSourceId !== data.toFundSourceId, {
    message: 'Source and destination must be different',
    path: ['toFundSourceId'],
});

type TransferFormData = z.infer<typeof transferSchema>;

interface FundTransferDialogProps {
    open: boolean;
    onClose: () => void;
    defaultFromId?: string;
}

export function FundTransferDialog({ open, onClose, defaultFromId }: FundTransferDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: fundSources = [] } = useFundSources({ status: 'active' });
    const transferMutation = useCreateFundTransfer();

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm<TransferFormData>({
        resolver: zodResolver(transferSchema),
        defaultValues: {
            fromFundSourceId: defaultFromId || '',
            toFundSourceId: '',
            amount: 0,
            transferFee: 0,
            description: '',
        },
    });

    const selectedFromId = watch('fromFundSourceId');
    const selectedFrom = fundSources.find((fs: FundSourceWithBranch) => fs.id === selectedFromId);
    const amount = watch('amount') || 0;
    const transferFee = watch('transferFee') || 0;
    const netAmount = amount - transferFee;

    const onSubmit = async (data: TransferFormData) => {
        setIsSubmitting(true);
        try {
            await transferMutation.mutateAsync({
                fromFundSourceId: data.fromFundSourceId,
                toFundSourceId: data.toFundSourceId,
                amount: data.amount,
                transferFee: data.transferFee || 0,
                description: data.description,
            });
            toast.success('Transfer completed successfully');
            reset();
            onClose();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Transfer failed');
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
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Transfer Funds</DialogTitle>
                    <DialogDescription>
                        Transfer money between fund sources.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 space-y-2">
                            <Label>From *</Label>
                            <Select
                                value={selectedFromId}
                                onValueChange={(value) => setValue('fromFundSourceId', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select source" />
                                </SelectTrigger>
                                <SelectContent>
                                    {fundSources.map((fs: FundSourceWithBranch) => (
                                        <SelectItem key={fs.id} value={fs.id}>
                                            {fs.name} (₱{fs.currentBalance.toLocaleString()})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.fromFundSourceId && (
                                <p className="text-sm text-destructive">{errors.fromFundSourceId.message}</p>
                            )}
                        </div>

                        <ArrowRight className="h-5 w-5 text-muted-foreground mt-6" />

                        <div className="flex-1 space-y-2">
                            <Label>To *</Label>
                            <Select
                                value={watch('toFundSourceId')}
                                onValueChange={(value) => setValue('toFundSourceId', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select destination" />
                                </SelectTrigger>
                                <SelectContent>
                                    {fundSources
                                        .filter((fs: FundSourceWithBranch) => fs.id !== selectedFromId)
                                        .map((fs: FundSourceWithBranch) => (
                                            <SelectItem key={fs.id} value={fs.id}>
                                                {fs.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            {errors.toFundSourceId && (
                                <p className="text-sm text-destructive">{errors.toFundSourceId.message}</p>
                            )}
                        </div>
                    </div>

                    {selectedFrom && (
                        <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                            Available balance: <strong>₱{selectedFrom.currentBalance.toLocaleString()}</strong>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (₱) *</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                {...register('amount')}
                                placeholder="0.00"
                            />
                            {errors.amount && (
                                <p className="text-sm text-destructive">{errors.amount.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="transferFee">Transfer Fee (₱)</Label>
                            <Input
                                id="transferFee"
                                type="number"
                                step="0.01"
                                {...register('transferFee')}
                                placeholder="0.00"
                            />
                            {errors.transferFee && (
                                <p className="text-sm text-destructive">{errors.transferFee.message}</p>
                            )}
                        </div>
                    </div>

                    {amount > 0 && (
                        <div className="text-sm bg-muted p-3 rounded space-y-1">
                            <div className="flex justify-between">
                                <span>Transfer Amount:</span>
                                <span>₱{amount.toLocaleString()}</span>
                            </div>
                            {transferFee > 0 && (
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Transfer Fee:</span>
                                    <span>-₱{transferFee.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-medium border-t pt-1">
                                <span>Net Amount (to destination):</span>
                                <span>₱{netAmount.toLocaleString()}</span>
                            </div>
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

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Transfer
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
