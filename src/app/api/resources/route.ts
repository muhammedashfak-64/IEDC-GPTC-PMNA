import { NextRequest, NextResponse } from 'next/server';
import { loadDb, saveDb } from '@/lib/serverStore';

// GET /api/resources - Public learning hub resources & templates from database
export async function GET(req: NextRequest) {
  try {
    const db = loadDb();
    const resources = (db.resources || []).filter((r: any) => r.status === 'Published');
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
