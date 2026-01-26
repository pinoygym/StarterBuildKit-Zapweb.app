import { generatePayrollAction } from '@/app/actions/hr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export default async function PayrollPage({ searchParams }: { searchParams: { periodId?: string } }) {
    // Fetch recent periods
    const periods = await prisma.payrollPeriod.findMany({
        orderBy: { startDate: 'desc' },
        take: 5
    });

    const selectedPeriodId = searchParams?.periodId || periods[0]?.id;

    let payrollRecords = [];
    if (selectedPeriodId) {
        payrollRecords = await prisma.payrollRecord.findMany({
            where: { payrollPeriodId: selectedPeriodId },
            include: { User: true }
        });
    }

    async function generate(formData: FormData) {
        'use server';
        const start = formData.get('start') as string;
        const end = formData.get('end') as string;
        if (start && end) {
            await generatePayrollAction(start, end);
            revalidatePath('/hr/payroll');
        }
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Payroll Processing</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Generate New Payroll</CardTitle>
                        <CardDescription>Select date range to process attendance</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={generate} className="flex gap-4 items-end">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Start Date</label>
                                <Input type="date" name="start" required />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">End Date</label>
                                <Input type="date" name="end" required />
                            </div>
                            <Button type="submit">Process</Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {periods.map((p: any) => (
                                <li key={p.id} className="flex justify-between items-center border-b pb-2">
                                    <span>{p.startDate.toLocaleDateString()} - {p.endDate.toLocaleDateString()}</span>
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{p.status}</span>
                                </li>
                            ))}
                            {periods.length === 0 && <p className="text-muted-foreground text-sm">No payroll history found.</p>}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Payroll Breakdown</CardTitle>
                    <CardDescription>
                        {selectedPeriodId ? 'Showing records for selected period' : 'No period selected'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50">
                                    <th className="h-12 px-4 text-left font-medium">Employee</th>
                                    <th className="h-12 px-4 text-right font-medium">Reg Hours</th>
                                    <th className="h-12 px-4 text-right font-medium">Gross Pay</th>
                                    <th className="h-12 px-4 text-right font-medium">Deductions</th>
                                    <th className="h-12 px-4 text-right font-medium">Net Pay</th>
                                    <th className="h-12 px-4 text-center font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payrollRecords.length === 0 ? (
                                    <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No records found</td></tr>
                                ) : (
                                    payrollRecords.map((record: any) => (
                                        <tr key={record.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 font-medium">{record.User?.firstName} {record.User?.lastName}</td>
                                            <td className="p-4 text-right">{record.regularHours.toFixed(2)}</td>
                                            <td className="p-4 text-right">₱{record.grossPay.toFixed(2)}</td>
                                            <td className="p-4 text-right">₱{record.deductions.toFixed(2)}</td>
                                            <td className="p-4 text-right font-bold">₱{record.netPay.toFixed(2)}</td>
                                            <td className="p-4 text-center">
                                                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">{record.status}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
