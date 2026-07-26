import { NextResponse } from 'next/server';
import { AuthController } from '@/mvc/controllers/AuthController';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, isAdminMode } = body;

    const result = await AuthController.login(username, password, Boolean(isAdminMode));
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const cookieStore = cookies();
    cookieStore.set('session_token', result.token || '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24,
      path: '/'
    });

    return NextResponse.json({
      success: true,
      token: result.token,
      user: result.user
    });
  } catch {
    return NextResponse.json({ error: 'Lỗi xử lý hệ thống!' }, { status: 500 });
  }
}
