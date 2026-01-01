import { NextResponse } from 'next/server';
import { expenseService } from '@/services/expense.service';

export async function GET(request: Request) {
  try {
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

    return NextResponse.json({ success: true, data: expenses });
  } catch (error: any) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.branchId || !body.expenseDate || !body.category || !body.amount || !body.description || !body.paymentMethod) {
      return NextResponse.json(
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

    return NextResponse.json({ success: true, data: expense });
  } catch (error: any) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
