import { NextResponse } from 'next/server';
import { OrderController } from '@/mvc/controllers/OrderController';

export async function GET() {
  try {
    const data = await OrderController.getOrdersOverview();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Lỗi tải đơn hàng' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await OrderController.placeOrder(body);
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    return NextResponse.json(res);
  } catch {
    return NextResponse.json({ error: 'Lỗi tạo đơn hàng' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if ('isFormClosed' in body) {
      const res = await OrderController.toggleOrderingWindow(Boolean(body.isFormClosed));
      return NextResponse.json(res);
    }
    return NextResponse.json({ error: 'Tham số không hợp lệ' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Lỗi cập nhật cấu hình' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerName = searchParams.get('customerName');

    if (customerName) {
      await OrderController.deleteUserOrders(customerName);
      return NextResponse.json({ success: true });
    }

    await OrderController.resetDailyOrders();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Lỗi xóa đơn hàng' }, { status: 500 });
  }
}
