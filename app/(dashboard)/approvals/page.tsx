'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

type ApprovalRequest = {
    id: string;
    type: string;
    entityId: string;
    data: string;
    status: string;
    reason?: string;
    reviewNote?: string;
    createdAt: string;
    RequestedBy: {
        firstName: string;
        lastName: string;
        email: string;
    };
};

export default function ApprovalsPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('PENDING');
    const [requests, setRequests] = useState<ApprovalRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // Dialog state
    const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
    const [reviewNote, setReviewNote] = useState('');
    const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchRequests(activeTab);
    }, [activeTab]);

    const fetchRequests = async (status: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/approvals?status=${status}`);
            const data = await res.json();
            if (data.success) {
                setRequests(data.data);
            }
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Failed to fetch requests', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async () => {
        if (!selectedRequest || !actionType) return;
        setProcessing(true);
        try {
            const endpoint = actionType === 'APPROVE' ? 'approve' : 'reject';
            const res = await fetch(`/api/approvals/${selectedRequest.id}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviewNote }),
            });

            const result = await res.json();
            if (result.success) {
                toast({ title: 'Success', description: `Request ${actionType.toLowerCase()}d` });
                setSelectedRequest(null);
                fetchRequests(activeTab);
            } else {
                toast({ title: 'Error', description: result.error, variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Action failed', variant: 'destructive' });
        } finally {
            setProcessing(false);
        }
    };

    const openReviewDialog = (request: ApprovalRequest, type: 'APPROVE' | 'REJECT') => {
        setSelectedRequest(request);
        setActionType(type);
        setReviewNote('');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Approvals</h2>
                    <p className="text-muted-foreground">Manage pending requests for sensitive actions</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="PENDING">Pending</TabsTrigger>
                    <TabsTrigger value="APPROVED">Approved</TabsTrigger>
                    <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
                </TabsList>
                <TabsContent value={activeTab}>
                    <Card>
                        <CardHeader>
                            <CardTitle>{activeTab} Requests</CardTitle>
                            <CardDescription>
                                List of {activeTab.toLowerCase()} approval requests.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-4">Loading...</div>
                            ) : requests.length === 0 ? (
                                <div className="text-center py-4 text-muted-foreground">No requests found.</div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Requested By</TableHead>
                                            <TableHead>Reason</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Details</TableHead>
                                            {activeTab === 'PENDING' && <TableHead className="text-right">Actions</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {requests.map((request) => (
                                            <TableRow key={request.id}>
                                                <TableCell>
                                                    <Badge variant="outline">{request.type.replace('_', ' ')}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{request.RequestedBy.firstName} {request.RequestedBy.lastName}</span>
                                                        <span className="text-xs text-muted-foreground">{request.RequestedBy.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate" title={request.reason}>
                                                    {request.reason || '-'}
                                                </TableCell>
                                                <TableCell>{format(new Date(request.createdAt), 'PPP p')}</TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="sm" onClick={() => {
                                                        // Show details in dialog (reuse the action dialog or a new one)
                                                        // For now, just logging or could expand row
                                                        // Ideally show the JSON data formatted
                                                        alert(JSON.stringify(JSON.parse(request.data), null, 2));
                                                    }}>
                                                        <Eye className="h-4 w-4 mr-1" /> View Data
                                                    </Button>
                                                </TableCell>
                                                {activeTab === 'PENDING' && (
                                                    <TableCell className="text-right space-x-2">
                                                        <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700" onClick={() => openReviewDialog(request, 'APPROVE')}>
                                                            <Check className="h-4 w-4 mr-1" /> Approve
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => openReviewDialog(request, 'REJECT')}>
                                                            <X className="h-4 w-4 mr-1" /> Reject
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{actionType === 'APPROVE' ? 'Approve' : 'Reject'} Request</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to {actionType?.toLowerCase()} this request?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {selectedRequest && (
                            <div className="bg-muted p-3 rounded-md text-sm font-mono whitespace-pre-wrap max-h-[200px] overflow-auto">
                                {JSON.stringify(JSON.parse(selectedRequest.data), null, 2)}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Review Note (Optional)</label>
                            <Textarea
                                placeholder="Add a note..."
                                value={reviewNote}
                                onChange={(e) => setReviewNote(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedRequest(null)} disabled={processing}>Cancel</Button>
                        <Button
                            variant={actionType === 'APPROVE' ? 'default' : 'destructive'}
                            onClick={handleAction}
                            disabled={processing}
                        >
                            {processing ? 'Processing...' : `Confirm ${actionType === 'APPROVE' ? 'Approval' : 'Rejection'}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
