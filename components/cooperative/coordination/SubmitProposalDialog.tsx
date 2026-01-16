'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const proposalSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    description: z.string().min(20, 'Description must be at least 20 characters'),
    category: z.string().min(1, 'Category is required'),
    proposedById: z.string().min(1, 'Proposer is required'),
    votingStartDate: z.string().optional(),
    votingEndDate: z.string().optional(),
    requiredVotes: z.coerce.number().min(0).optional(),
});

type ProposalFormValues = z.infer<typeof proposalSchema>;

export function SubmitProposalDialog() {
    const [open, setOpen] = React.useState(false);
    const queryClient = useQueryClient();

    const { data: membersResponse } = useQuery({
        queryKey: ['cooperative-members'],
        queryFn: async () => {
            const res = await fetch('/api/cooperative/members?limit=100');
            if (!res.ok) throw new Error('Failed to fetch members');
            return res.json();
        },
    });

    const members = membersResponse?.data || [];

    const form = useForm<ProposalFormValues>({
        resolver: zodResolver(proposalSchema),
        defaultValues: {
            title: '',
            description: '',
            category: 'policy',
            requiredVotes: 10,
        },
    });

    const mutation = useMutation({
        mutationFn: async (values: ProposalFormValues) => {
            const res = await fetch('/api/cooperative/proposals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to submit proposal');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['proposals'] });
            toast.success('Proposal submitted successfully');
            setOpen(false);
            form.reset();
        },
        onError: (error: any) => {
            toast.error(error.message);
        },
    });

    function onSubmit(values: ProposalFormValues) {
        mutation.mutate(values);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <FileText className="mr-2 h-4 w-4" /> Submit Proposal
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>Submit New Proposal</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="E.g. Amendment to Membership Fees" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description / Rationale</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Explain the proposal and why it should be implemented..."
                                            className="min-h-[120px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="policy">Policy</SelectItem>
                                                <SelectItem value="budget">Budget</SelectItem>
                                                <SelectItem value="project">Project</SelectItem>
                                                <SelectItem value="governance">Governance</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="requiredVotes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Required Votes</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="votingStartDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Voting Start Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="votingEndDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Voting End Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="proposedById"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Proposed By</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select member" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {members.map((member: any) => (
                                                <SelectItem key={member.id} value={member.id}>
                                                    {member.firstName} {member.lastName} ({member.memberCode})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Proposal
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
