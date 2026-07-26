import { NextResponse } from 'next/server';
import { ProductController } from '@/mvc/controllers/ProductController';
import { SecurityService } from '@/mvc/services/SecurityService';
import { cookies } from 'next/headers';

export function generateStaticParams() {
  return [];
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('session_token')?.value || request.headers.get('x-session-token');
    const payload = token ? await SecurityService.verifyToken(token) : null;

    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Chỉ Admin mới có quyền sửa đơn giá!' }, { status: 403 });
    }

    const id = params.id;
    const body = await request.json();
    const { price } = body;

    const result = await ProductController.updatePrice(id, Number(price));
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Lỗi cập nhật giá sản phẩm' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('session_token')?.value || request.headers.get('x-session-token');
    const payload = token ? await SecurityService.verifyToken(token) : null;

    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Chỉ Admin mới có quyền xóa sản phẩm!' }, { status: 403 });
    }

    const id = params.id;
    const result = await ProductController.deleteProduct(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Lỗi xóa sản phẩm' }, { status: 500 });
  }
}
