import { NextRequest, NextResponse } from 'next/server';
import { loadDb, saveDb, getResourcesAsync } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/resources - Public learning hub resources & templates from database
export async function GET(req: NextRequest) {
  try {
    const resources = await getResourcesAsync(true);
    return NextResponse.json({
      success: true,
      count: resources.length,
      data: resources
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/resources/view - Increment resource view counter
export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: 'Resource ID required' }, { status: 400 });

    const db = loadDb();
    if (!db.resources) db.resources = [];
    const target = db.resources.find((r: any) => r.id === id);
    if (target) {
      target.views = (target.views || 0) + 1;
      saveDb(db);
    }

    return NextResponse.json({ success: true, views: target?.views || 1 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
