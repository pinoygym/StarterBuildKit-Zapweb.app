'use client';

import { useEffect, useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface SalesAgent {
    id: string;
    name: string;
    code: string;
}

interface SalesAgentSelectorProps {
    value?: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export function SalesAgentSelector({ value, onChange, disabled }: SalesAgentSelectorProps) {
    const [agents, setAgents] = useState<SalesAgent[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAgents = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/data-maintenance/sales-agents?status=active');
                const result = await response.json();
                if (result.success) {
                    setAgents(result.data);
                } else {
                    console.error('Failed to fetch sales agents:', result.error);
                    toast.error('Failed to load sales agents');
                }
            } catch (error) {
                console.error('Error fetching sales agents:', error);
                toast.error('Error loading sales agents');
            } finally {
                setLoading(false);
            }
        };

        fetchAgents();
    }, []);

    return (
        <div className="grid gap-2">
            <Label htmlFor="sales-agent">Sales Agent</Label>
            <Select value={value} onValueChange={onChange} disabled={disabled || loading}>
                <SelectTrigger id="sales-agent" className="w-full">
                    <SelectValue placeholder={loading ? 'Loading...' : 'Select Sales Agent (Optional)'} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="no-agent">None</SelectItem>
                    {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                            {agent.name} ({agent.code})
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
