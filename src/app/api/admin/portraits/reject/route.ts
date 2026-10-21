import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'AI portrait rejection workflow has been discontinued.' },
    { status: 410 }
  );
}
