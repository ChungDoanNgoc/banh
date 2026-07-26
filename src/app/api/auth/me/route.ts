import { NextResponse } from 'next/server';
import { SecurityService } from '@/mvc/services/SecurityService';
import { UserRepository } from '@/mvc/repositories/UserRepository';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('session_token')?.value || request.headers.get('x-session-token');

    if (!token) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const payload = await SecurityService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Phiên làm việc đã hết hạn' }, { status: 401 });
    }

    const user = await UserRepository.findByUsername(payload.username);
    if (!user) {
      return NextResponse.json({ error: 'Tài khoản không tồn tại' }, { status: 404 });
    }

    // Tra ve UserModel sang public View (strip password)
    return NextResponse.json(user.toPublicView());
  } catch {
    return NextResponse.json({ error: 'Lỗi xác thực!' }, { status: 500 });
  }
}
