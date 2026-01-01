'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Download, Upload, AlertTriangle, DatabaseBackup, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function BackupRestoreCard() {
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCreateBackup = async () => {
        setIsBackingUp(true);
        try {
            const response = await fetch('/api/settings/database/backup');

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create backup');
            }

            // Parse JSON to get backup data and filename
            const backupData = await response.json();

            // Extract filename from response (set by API)
            let filename = backupData._filename || '';

            // Remove the _filename property from the export data
            delete backupData._filename;

            // Fallback if no filename
            if (!filename) {
                const now = new Date();
                const dateTime = now.toISOString()
                    .replace('T', '_')
                    .replace(/:/g, '-')
                    .split('.')[0];
                filename = `backup_${dateTime}.json`;
            }

            // Create blob from clean backup data
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast({
                title: 'Backup Created',
                description: 'Database backup has been downloaded successfully.',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to create backup',
                variant: 'destructive',
            });
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Reset input so same file can be selected again if needed
        event.target.value = '';

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const json = e.target?.result as string;
                const backupData = JSON.parse(json);

                setIsRestoring(true);
                const response = await fetch('/api/settings/database/restore', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(backupData),
                });

                const data = await response.json();

                if (data.success) {
                    toast({
                        title: 'Restore Successful',
                        description: 'Database has been restored from backup.',
                    });
                    // Optional: Reload page to reflect changes
                    window.location.reload();
                } else {
                    throw new Error(data.error || 'Failed to restore backup');
                }
            } catch (error: any) {
                toast({
                    title: 'Restore Failed',
                    description: error.message || 'Invalid backup file or server error',
                    variant: 'destructive',
                });
            } finally {
                setIsRestoring(false);
            }
        };
        reader.readAsText(file);
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DatabaseBackup className="h-5 w-5" />
                    Backup & Restore
                </CardTitle>
                <CardDescription>
                    Export your data for safekeeping or restore from a previous backup.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Backup Section */}
                    <div className="space-y-4 p-4 border rounded-lg bg-background">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Download className="h-4 w-4 text-blue-500" />
                            Export Database
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Download a JSON file containing all your database records.
                            This file can be used to restore your data later.
                        </p>
                        <Button
                            onClick={handleCreateBackup}
                            disabled={isBackingUp || isRestoring}
                            className="w-full"
                            variant="outline"
                        >
                            {isBackingUp ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating Backup...
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Backup
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Restore Section */}
                    <div className="space-y-4 p-4 border rounded-lg bg-background">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Upload className="h-4 w-4 text-orange-500" />
                            Import Database
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Restore your database from a backup file.
                        </p>

                        <Alert variant="destructive" className="py-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                                <strong>Warning:</strong> Restoring will overwrite ALL existing data.
                            </AlertDescription>
                        </Alert>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleRestoreBackup}
                            accept=".json"
                            className="hidden"
                        />

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    disabled={isBackingUp || isRestoring}
                                >
                                    {isRestoring ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Restoring...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Restore from Backup
                                        </>
                                    )}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirm Restore</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to restore from a backup?
                                        <br /><br />
                                        <span className="font-bold text-destructive">
                                            This action will permanently DELETE all current data and replace it with the backup data.
                                        </span>
                                        <br />
                                        This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={triggerFileInput} className="bg-destructive text-destructive-foreground">
                                        Yes, Select File & Restore
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
