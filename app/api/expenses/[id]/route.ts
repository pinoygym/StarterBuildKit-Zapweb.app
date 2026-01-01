import { asyncHandler } from '@/lib/api-error';
import { expenseService } from '@/services/expense.service';

export const dynamic = 'force-dynamic';

export const GET = asyncHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const expense = await expenseService.getExpenseById(id);

  if (!expense) {
    return Response.json(
      { success: false, error: 'Expense not found' },
      { status: 404 }
    );
  }

  return Response.json({ success: true, data: expense });
});

export const PUT = asyncHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const body = await request.json();

  const expense = await expenseService.updateExpense(id, body);

  return Response.json({ success: true, data: expense });
});

export const DELETE = asyncHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await expenseService.deleteExpense(id);

  return Response.json({ success: true, message: 'Expense deleted successfully' });
});
