import { NextResponse } from 'next/server';
import { expenseService } from '@/services/expense.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId') || undefined;
    const fromDate = searchParams.get('fromDate') 
      ? new Date(searchParams.get('fromDate')!) 
      : undefined;
    const toDate = searchParams.get('toDate') 
      ? new Date(searchParams.get('toDate')!) 
      : undefined;

    const report = await expenseService.getExpensesByVendor(branchId, fromDate, toDate);

    return NextResponse.json({ success: true, data: report });
  } catch (error: any) {
    console.error('Error generating expense by vendor report:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
