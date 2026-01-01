import { NextRequest, NextResponse } from 'next/server';
import { inventoryService } from '@/services/inventory.service';
import { AppError } from '@/lib/errors';
import { AddStockInput } from '@/types/inventory.types';

// POST /api/inventory/add-stock - Add stock to inventory
export async function POST(request: NextRequest) {
  try {
    const body: AddStockInput = await request.json();

    const batch = await inventoryService.addStock(body);
    
    return NextResponse.json(
      { success: true, data: batch, message: 'Stock added successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding stock:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to add stock' },
      { status: 500 }
    );
  }
}
