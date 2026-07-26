import { NextResponse } from 'next/server';
import { OrderController } from '@/mvc/controllers/OrderController';

export async function GET() {
  try {
    const buffer = await OrderController.exportOrdersExcelBuffer();

    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', `attachment; filename="BanhTieu_Orders_${new Date().toISOString().slice(0, 10)}.xlsx"`);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers
    });
  } catch {
    return NextResponse.json({ error: 'Lỗi xuất tệp Excel' }, { status: 500 });
  }
}
