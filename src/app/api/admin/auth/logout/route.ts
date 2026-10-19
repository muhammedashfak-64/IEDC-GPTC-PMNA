import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Signed out of administrative console successfully.'
  });

  response.cookies.set({
    name: 'iedc_admin_session',
    value: '',
    httpOnly: true,
    path: '/',
    maxAge: 0
  });

  return response;
}
