import { getDailyAttendanceStats } from '@/app/actions/hr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, AlertCircle, CalendarOff } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export default async function AttendanceDashboard() {
    const statsRes = await getDailyAttendanceStats();
    const stats = statsRes.success ? statsRes.data : { present: 0, late: 0, absent: 0, onLeave: 0, total: 0 };

    // Fetch live roster
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const records = await prisma.attendanceRecord.findMany({
        where: { date: startOfDay },
        include: { User: true }
    });

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Daily Dashboard</h1>
                <div className="text-muted-foreground">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Present Now</CardTitle>
                        <Users className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.present}</div>
                        <p className="text-xs text-muted-foreground">{((stats.present / (stats.total || 1)) * 100).toFixed(0)}% of workforce</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.late}</div>
                        <p className="text-xs text-muted-foreground text-red-500">Requires attention</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Absent</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.absent}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">On Leave</CardTitle>
                        <CalendarOff className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.onLeave}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Live Floor Roster</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Employee</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Time In</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Time Out</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {records.length === 0 ? (
                                    <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No records for today</td></tr>
                                ) : (
                                    records.map((record: any) => (
                                        <tr key={record.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 font-medium">{record.User?.firstName} {record.User?.lastName}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold
                          ${record.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                                                        record.status === 'LATE' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td className="p-4">{record.checkIn ? record.checkIn.toLocaleTimeString() : '-'}</td>
                                            <td className="p-4">{record.checkOut ? record.checkOut.toLocaleTimeString() : '-'}</td>
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
