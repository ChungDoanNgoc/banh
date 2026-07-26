import { NextResponse } from 'next/server';
import { UserController } from '@/mvc/controllers/UserController';
import { SecurityService } from '@/mvc/services/SecurityService';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('session_token')?.value || request.headers.get('x-session-token');
    const payload = token ? await SecurityService.verifyToken(token) : null;

    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
    }

    const users = await UserController.getUsersPublic();
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: 'Lỗi lấy danh sách thành viên' }, { status: 500 });
  }
}
