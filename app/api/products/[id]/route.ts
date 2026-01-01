import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/services/product.service';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { AppError } from '@/lib/errors';

// GET /api/products/[id] - Fetch single product with UOMs
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const product = await productService.updateProduct(id, body);

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error('Error updating product:', error);

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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get user role from token
    let userRole = undefined;
    const token = request.cookies.get('auth-token')?.value;

    if (token) {
      try {
        const payload = authService.verifyToken(token);
        if (payload) {
          const user = await userService.getUserById(payload.userId);
          if (user) {
            userRole = user.Role.name;
          }
        }
      } catch (error) {
        console.error('Error getting user role:', error);
      }
    }

    await productService.deleteProduct(id, userRole);
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
