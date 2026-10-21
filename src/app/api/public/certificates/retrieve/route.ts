import { NextRequest, NextResponse } from 'next/server';
import { retrieveStudentCertificate } from '@/lib/serverStore';

// In-memory rate limiting map: ip -> { count, expiresAt }
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.expiresAt) {
    rateLimitMap.set(ip, { count: 1, expiresAt: now + 60 * 1000 });
    return true;
  }
  if (entry.count >= 15) {
    return false; // exceeded 15 attempts per minute
  }
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { success: false, error: 'Too many lookup requests. Please wait a minute and try again.' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const event_id = body.event_id || body.eventId;
    const full_name = body.full_name || body.fullName || body.name;
    const mobile_number = body.mobile_number || body.mobileNumber || body.phone;

    if (!full_name || !mobile_number) {
      return NextResponse.json(
        { success: false, error: 'Full name and registered mobile number are required.' },
        { status: 400 }
      );
    }

    const result = await retrieveStudentCertificate(event_id, full_name, mobile_number);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'No published certificate was found for the supplied details.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      certificate: result.certificate
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'No published certificate was found for the supplied details.' },
      { status: 500 }
    );
  }
}
