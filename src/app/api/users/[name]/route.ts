import { NextResponse } from 'next/server';
import { UserController } from '@/mvc/controllers/UserController';
import { SecurityService } from '@/mvc/services/SecurityService';
import { cookies } from 'next/headers';

export async function DELETE(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('session_token')?.value || request.headers.get('x-session-token');
    const payload = token ? await SecurityService.verifyToken(token) : null;

    if (!payload) {
      return NextResponse.json({ error: 'Chưa đăng nhập!' }, { status: 401 });
    }

    const targetUsername = decodeURIComponent(params.name);
    const result = await UserController.deleteUser(payload.username, payload.role, targetUsername);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Lỗi xóa tài khoản' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('session_token')?.value || request.headers.get('x-session-token');
    const payload = token ? await SecurityService.verifyToken(token) : null;

    if (!payload) {
      return NextResponse.json({ error: 'Chưa đăng nhập!' }, { status: 401 });
    }

    const targetUsername = decodeURIComponent(params.name);
    const result = await UserController.promoteToAdmin(payload.role, targetUsername);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Lỗi nâng quyền tài khoản' }, { status: 500 });
  }
}
