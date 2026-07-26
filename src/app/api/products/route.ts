import { NextResponse } from 'next/server';
import { ProductController } from '@/mvc/controllers/ProductController';
import { SecurityService } from '@/mvc/services/SecurityService';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const products = await ProductController.getProducts();
    return NextResponse.json(products);
  } catch {
    return NextResponse.json({ error: 'Lỗi lấy danh sách sản phẩm' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('session_token')?.value || request.headers.get('x-session-token');
    const payload = token ? await SecurityService.verifyToken(token) : null;

    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Chỉ Admin mới có quyền thêm món mới!' }, { status: 403 });
    }

    const body = await request.json();
    const { name, price, category } = body;

    const result = await ProductController.addProduct(name, Number(price), category);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Lỗi thêm sản phẩm' }, { status: 500 });
  }
}
