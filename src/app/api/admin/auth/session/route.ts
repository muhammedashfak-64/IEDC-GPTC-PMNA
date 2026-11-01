import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserFromRequest } from '@/lib/adminAuthHelper';
import { createSessionToken } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const user = getAdminUserFromRequest(req);

  if (!user) {
    return NextResponse.json({
      success: true,
      authenticated: false,
      user: null
    });
  }

  const response = NextResponse.json({
    success: true,
    authenticated: true,
    user
  });

  // Sliding session renewal: automatically refresh the secure cookie
  try {
    const refreshedToken = createSessionToken(user);
    response.cookies.set({
      name: 'iedc_admin_session',
      value: refreshedToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });
  } catch {}

  return response;
}
