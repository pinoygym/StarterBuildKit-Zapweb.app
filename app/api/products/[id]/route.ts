import { NextRequest } from 'next/server';
import { asyncHandler } from '@/lib/api-error';
import { productService } from '@/services/product.service';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';

export const dynamic = 'force-dynamic';

// GET /api/products/[id] - Fetch single product with UOMs
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { id } = params;
  const product = await productService.getProductById(id);
  return Response.json({ success: true, data: product });
});

// PUT /api/products/[id] - Update product and UOMs
export const PUT = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { id } = params;
  const body = await request.json();
  const product = await productService.updateProduct(id, body);

  return Response.json({ success: true, data: product });
});

// DELETE /api/products/[id] - Delete product (inactive only)
export const DELETE = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
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
  return Response.json({ success: true, message: 'Product deleted successfully' });
});
