import { NextResponse } from 'next/server';
import { getTeamMembers } from '@/lib/serverStore';

export async function GET() {
  try {
    const publishedMembers = getTeamMembers(true);
    
    // Extract unique categories and departments for convenient client-side filtering
    const categories = Array.from(new Set(publishedMembers.map((m: any) => m.category || 'Executive Members')));
    const departments = Array.from(new Set(publishedMembers.map((m: any) => m.department).filter(Boolean)));

    return NextResponse.json({
      success: true,
      count: publishedMembers.length,
      data: publishedMembers,
      filters: {
        categories,
        departments
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
