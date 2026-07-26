import { NextResponse } from 'next/server';
import { AuthController } from '@/mvc/controllers/AuthController';
import { SecurityService } from '@/mvc/services/SecurityService';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('session_token')?.value || request.headers.get('x-session-token');

    if (!token) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const payload = await SecurityService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Phiên đăng nhập không hợp lệ!' }, { status: 401 });
    }

    const body = await request.json();
    const { oldPassword, newPassword } = body;

    const result = await AuthController.changePassword(payload.username, oldPassword, newPassword);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Lỗi hệ thống!' }, { status: 500 });
  }
}
