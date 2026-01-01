import { asyncHandler } from '@/lib/api-error';
import { expenseService } from '@/services/expense.service';

export const dynamic = 'force-dynamic';

export const GET = asyncHandler(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get('branchId') || undefined;
  const category = searchParams.get('category') || undefined;
  const paymentMethod = searchParams.get('paymentMethod') || undefined;
  const vendor = searchParams.get('vendor') || undefined;
  const fromDate = searchParams.get('fromDate')
    ? new Date(searchParams.get('fromDate')!)
    : undefined;
  const toDate = searchParams.get('toDate')
    ? new Date(searchParams.get('toDate')!)
    : undefined;

  const expenses = await expenseService.getAllExpenses({
    branchId,
    category,
    paymentMethod,
    vendor,
    fromDate,
    toDate,
  });

  return Response.json({ success: true, data: expenses });
});

export const POST = asyncHandler(async (request: Request) => {
  const body = await request.json();

  if (!body.branchId || !body.expenseDate || !body.category || !body.amount || !body.description || !body.paymentMethod) {
    return Response.json(
      { success: false, error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const expense = await expenseService.createExpense({
    branchId: body.branchId,
    expenseDate: new Date(body.expenseDate),
    category: body.category,
    amount: parseFloat(body.amount),
    description: body.description,
    paymentMethod: body.paymentMethod,
    vendor: body.vendor,
    receiptUrl: body.receiptUrl,
  });

  return Response.json({ success: true, data: expense });
});
