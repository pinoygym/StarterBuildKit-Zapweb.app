'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sprout, MapPin, Plus } from "lucide-react";

async function fetchFarms() {
    const res = await fetch('/api/cooperative/farms');
    if (!res.ok) throw new Error('Failed to fetch farms');
    return res.json();
}

export function FarmManagement() {
    const { data: farms, isLoading } = useQuery({ queryKey: ['farms'], queryFn: fetchFarms });

    if (isLoading) return <div className="p-4">Loading farms...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Farm Management</h2>
                <Button><Plus className="mr-2 h-4 w-4" /> Register Farm</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Registered Farms</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Farm Name</TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Crop</TableHead>
                                    <TableHead>Size (Ha)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {farms?.map((farm: any) => (
                                    <TableRow key={farm.id}>
                                        <TableCell className="font-medium">{farm.name}</TableCell>
                                        <TableCell>{farm.Member?.firstName} {farm.Member?.lastName}</TableCell>
                                        <TableCell className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <MapPin className="h-3 w-3" /> {farm.latitude?.toFixed(4)}, {farm.longitude?.toFixed(4)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Sprout className="h-3 w-3 text-green-600" /> {farm.cropType}
                                            </div>
                                        </TableCell>
                                        <TableCell>{farm.sizeHectares}</TableCell>
                                    </TableRow>
                                ))}
                                {farms?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground p-8">No farms registered yet.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="min-h-[400px] flex flex-col">
                    <CardHeader>
                        <CardTitle>Farm Map</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 bg-muted/20 rounded-md m-4 flex items-center justify-center border-dashed border-2">
                        <div className="text-muted-foreground text-center">
                            <MapPin className="h-10 w-10 mx-auto mb-2 opacity-50" />
                            <p>Map View Integration Placeholder</p>
                            <p className="text-xs text-muted-foreground mt-1">Geo-location visualization</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
