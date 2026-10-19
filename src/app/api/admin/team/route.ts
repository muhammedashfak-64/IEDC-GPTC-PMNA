import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuthHelper';
import {
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  reorderTeamMembers,
  bulkUpdateTeamMembers
} from '@/lib/serverStore';

export async function GET(req: NextRequest) {
  const { errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  const members = getTeamMembers(false);
  return NextResponse.json({
    success: true,
    count: members.length,
    data: members
  });
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    if (!body.name || !body.role) {
      return NextResponse.json(
        { success: false, error: 'Full name and Role/Designation are required' },
        { status: 400 }
      );
    }

    const created = createTeamMember(body, user);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const { user, errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();

    // Check if this is a bulk action
    if (body.bulkAction && Array.isArray(body.ids)) {
      bulkUpdateTeamMembers(body.ids, body.bulkAction, user);
      return NextResponse.json({
        success: true,
        message: `Bulk ${body.bulkAction} completed successfully`
      });
    }

    // Check if this is a reordering action
    if (body.reorder && Array.isArray(body.orderMap)) {
      const updatedList = reorderTeamMembers(body.orderMap, user);
      return NextResponse.json({
        success: true,
        data: updatedList,
        message: 'Order updated successfully'
      });
    }

    // Standard single member update
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Member ID is required' }, { status: 400 });
    }

    const updated = updateTeamMember(id, updates, user);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const { user, errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Member ID required' }, { status: 400 });
    }

    deleteTeamMember(id, user);
    return NextResponse.json({ success: true, message: 'Member deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
