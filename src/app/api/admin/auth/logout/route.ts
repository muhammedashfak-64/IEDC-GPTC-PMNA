import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Signed out of administrative console successfully.'
  });

  response.cookies.set({
    name: 'iedc_admin_session',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });

  return response;
}
