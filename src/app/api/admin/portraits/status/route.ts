import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  return NextResponse.json({
    success: false,
    aiAvailable: false,
    message: 'AI Portrait processing is discontinued.'
  });
}
