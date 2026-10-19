import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserFromRequest } from '@/lib/adminAuthHelper';

export async function GET(req: NextRequest) {
  const user = getAdminUserFromRequest(req);

  if (!user) {
    return NextResponse.json({
      success: true,
      authenticated: false,
      user: null
    });
  }

  return NextResponse.json({
    success: true,
    authenticated: true,
    user
  });
}
