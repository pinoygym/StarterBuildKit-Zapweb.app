'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IdCard, Check, Plus, Trash2, Paintbrush } from "lucide-react";

async function fetchTemplates() {
    const res = await fetch('/api/cooperative/id-templates');
    if (!res.ok) throw new Error('Failed to fetch templates');
    return res.json();
}

export function IDStation() {
    const { data: templates, isLoading } = useQuery({ queryKey: ['id-templates'], queryFn: fetchTemplates });

    if (isLoading) return <div className="p-4">Loading templates...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">ID Station</h2>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Create Template
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {templates?.map((template: any) => (
                    <Card key={template.id} className={`transition-all ${template.isDefault ? 'border-primary ring-1 ring-primary/20' : 'hover:border-primary/50'}`}>
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-medium">{template.name}</CardTitle>
                            {template.isDefault && <Badge variant="secondary" className="gap-1"><Check className="h-3 w-3" /> Default</Badge>}
                        </CardHeader>
                        <CardContent>
                            {/* Preview Card */}
                            <div
                                className={`w-full aspect-[1.586] rounded-lg border shadow-sm relative overflow-hidden mb-4 transition-all`}
                                style={{
                                    background: `linear-gradient(135deg, ${template.primaryColor || '#ffffff'} 0%, ${template.secondaryColor || '#f3f4f6'} 100%)`,
                                    color: template.textColor || '#000000'
                                }}
                            >
                                <div className="absolute inset-4 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <div className="h-8 w-8 bg-black/10 rounded-full" />
                                        <div className="text-[10px] font-bold tracking-widest uppercase opacity-70">COOP ID</div>
                                    </div>

                                    <div className="flex gap-3 items-center">
                                        <div className="h-12 w-12 bg-black/5 rounded-full border border-black/10" />
                                        <div className="space-y-1 w-full">
                                            <div className="h-2 w-2/3 bg-black/10 rounded" />
                                            <div className="h-2 w-1/3 bg-black/10 rounded" />
                                        </div>
                                    </div>

                                    <div className="text-[8px] opacity-50 text-center">
                                        {template.orientation} layout
                                    </div>
                                </div>
                            </div>

                            <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2">
                                <div>
                                    <span className="opacity-70">Primary:</span>
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: template.primaryColor }} />
                                        {template.primaryColor}
                                    </div>
                                </div>
                                <div>
                                    <span className="opacity-70">Secondary:</span>
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: template.secondaryColor }} />
                                        {template.secondaryColor}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between pt-2">
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary"><Paintbrush className="h-4 w-4 mr-2" /> Edit</Button>
                            {!template.isDefault && <Button variant="ghost" size="sm">Set Default</Button>}
                        </CardFooter>
                    </Card>
                ))}

                <Card className="border-dashed flex flex-col items-center justify-center p-8 text-muted-foreground hover:bg-muted/50 cursor-pointer transition-colors min-h-[300px]">
                    <div className="flex flex-col items-center gap-2">
                        <div className="p-4 rounded-full bg-muted">
                            <Plus className="h-6 w-6" />
                        </div>
                        <p className="font-medium">New Template</p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
