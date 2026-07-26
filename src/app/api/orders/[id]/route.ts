import { NextResponse } from 'next/server';
import { OrderController } from '@/mvc/controllers/OrderController';

export function generateStaticParams() {
  return [];
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();

    if ('isPaid' in body) {
      const res = await OrderController.togglePayment(id, Boolean(body.isPaid));
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
    }

    if ('quantity' in body) {
      const res = await OrderController.updateOrderQuantity(id, Number(body.quantity));
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Lỗi cập nhật đơn hàng' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const res = await OrderController.deleteOrder(id);
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Lỗi xóa đơn hàng' }, { status: 500 });
  }
}
