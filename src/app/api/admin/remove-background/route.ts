import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'Background removal and AI processing features have been discontinued.' },
    { status: 410 }
  );
}
