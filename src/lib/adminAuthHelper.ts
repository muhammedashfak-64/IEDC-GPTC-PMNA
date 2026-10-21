import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, AuthUser } from '@/lib/serverStore';

export function getAdminUserFromRequest(req: NextRequest | Request): AuthUser | null {
  try {
    // 1. Try reading HTTP-only cookie
    let token: string | null = null;
    
    if ('cookies' in req && typeof (req as any).cookies?.get === 'function') {
      const cookie = (req as any).cookies.get('iedc_admin_session');
      if (cookie) token = cookie.value;
    } else {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(/iedc_admin_session=([^;]+)/);
      if (match) token = match[1];
    }

    // 2. Fallback to Authorization: Bearer <token>
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

export type AdminAuthResult =
  | { user: AuthUser; errorResponse: null }
  | { user: null; errorResponse: NextResponse };

export function requireAdminAuth(
  req: NextRequest | Request,
  requireFacultyRole = false
): AdminAuthResult {
  const user = getAdminUserFromRequest(req);

  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { success: false, error: 'Unauthorized. An active administrative session is required.' },
        { status: 401 }
      )
    };
  }

  if (requireFacultyRole && user.role !== 'faculty_coordinator' && user.role !== 'main_admin') {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { success: false, error: 'Forbidden. This action requires Faculty Coordinator or Main Administrator privileges.' },
        { status: 403 }
      )
    };
  }

  return { user, errorResponse: null };
}

export function requireMainAdminAuth(req: NextRequest | Request): AdminAuthResult {
  const user = getAdminUserFromRequest(req);

  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { success: false, error: 'Unauthorized. An active administrative session is required.' },
        { status: 401 }
      )
    };
  }

  if (user.role !== 'main_admin') {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { success: false, error: 'Forbidden. This action requires Main Administrator (Website Owner) privileges.' },
        { status: 403 }
      )
    };
  }

  return { user, errorResponse: null };
}
