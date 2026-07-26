import { NextResponse } from 'next/server';
import { AuthController } from '@/mvc/controllers/AuthController';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    const result = await AuthController.register(username, password);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Lỗi xử lý hệ thống!' }, { status: 500 });
  }
}
