import { NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: 'Username/Email and Password are required.' },
        { status: 400 }
      );
    }

    const result = await authenticateAdmin(identifier, password);

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Invalid administrative credentials or inactive account.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: `Welcome back, ${result.user.full_name}`,
      user: result.user,
      token: result.token
    });

    // Set secure HTTP-only cookie for session persistence (7 days)
    response.cookies.set({
      name: 'iedc_admin_session',
      value: result.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Authentication failed' },
      { status: 500 }
    );
  }
}
