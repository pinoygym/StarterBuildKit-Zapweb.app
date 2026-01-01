import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/services/product.service';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

// GET /api/products/[id] - Fetch single product with UOMs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await productService.getProductById(id);
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error('Error fetching product:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update product and UOMs
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    try {
      const fs = await import('fs');
      fs.appendFileSync('product_debug.log', `[${new Date().toISOString()}] UPDATE ID: ${id}\nBODY: ${JSON.stringify(body, null, 2)}\n\n`);
    } catch (e) {
      console.error('Failed to write log', e);
    }

    // Extract userId from token
    let userId = undefined;
    const token = request.cookies.get('auth-token')?.value;
    if (token) {
      try {
        const payload = authService.verifyToken(token);
        userId = payload?.userId;
      } catch (err) {
        console.error('Error verifying token in PUT /api/products/[id]:', err);
      }
    }

    const product = await productService.updateProduct(id, body, userId);

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error('Error updating product:', error);

    try {
      const fs = await import('fs');
      fs.appendFileSync('product_debug.log', `[${new Date().toISOString()}] ERROR: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}\n\n`);
    } catch (e) { /* ignore */ }

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, fields: (error as any).fields },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: (error as any)?.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete product (inactive only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get user from token for logging and role-based logic
    let userRole = undefined;
    let userId = undefined;
    const token = request.cookies.get('auth-token')?.value;

    if (token) {
      try {
        const payload = authService.verifyToken(token);
        if (payload) {
          userId = payload.userId;
          const user = await userService.getUserById(payload.userId);
          if (user) {
            userRole = user.Role.name;
          }
        }
      } catch (error) {
        console.error('Error getting user credentials in DELETE:', error);
      }
    }

    await productService.deleteProduct(id, userId, userRole);
    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
