import { asyncHandler } from '@/lib/api-error';
import { expenseService } from '@/services/expense.service';

export const dynamic = 'force-dynamic';

export const GET = asyncHandler(async (request: Request) {
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

    return Response.json({ success: true, data: report });
  } catch (error: any) {
    console.error('Error generating expense by vendor report:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
