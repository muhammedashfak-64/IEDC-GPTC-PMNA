import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuthHelper';
import { getAuditLogs } from '@/lib/serverStore';

export async function GET(req: NextRequest) {
  // Only Faculty Coordinators can access system audit logs
  const { errorResponse } = requireAdminAuth(req, true);
  if (errorResponse) return errorResponse;

  const logs = getAuditLogs();
  return NextResponse.json({ success: true, count: logs.length, data: logs });
}
