import { NextRequest, NextResponse } from 'next/server';
import { verifyAndGetCertificate } from '@/lib/serverStore';

// In-memory rate limiting map: IP -> { count: number, firstRequestTime: number }
const rateLimitMap = new Map<string, { count: number; firstRequestTime: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record) {
    rateLimitMap.set(ip, { count: 1, firstRequestTime: now });
    return true;
  }
  if (now - record.firstRequestTime > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, firstRequestTime: now });
    return true;
  }
  if (record.count >= MAX_ATTEMPTS) {
    return false;
  }
  record.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many verification attempts. Please wait 5 minutes before trying again.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { eventId, registerNumber, mobileNumber } = body;

    if (!registerNumber || !mobileNumber) {
      return NextResponse.json(
        { success: false, error: 'Event, Registration Number, and 10-digit Mobile Number are required.' },
        { status: 400 }
      );
    }

    const cleanReg = String(registerNumber).trim();
    const cleanMobile = String(mobileNumber).trim().replace(/\D/g, '');

    if (cleanMobile.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 10-digit registered mobile number.' },
        { status: 400 }
      );
    }

    const cert = verifyAndGetCertificate(cleanReg, cleanMobile, eventId);

    if (!cert) {
      return NextResponse.json(
        { success: false, error: 'No matching verified certificate found. Please check your Registration Number and 10-digit Mobile Number.' },
        { status: 401 }
      );
    }

    // Return ONLY approved certificate information, securely omitting other participants' info
    return NextResponse.json({
      success: true,
      message: 'Certificate authentication successful.',
      certificate: {
        certificateId: cert.certificateId,
        participantName: cert.participantName,
        registerNumber: cert.registerNumber,
        eventName: cert.eventName,
        eventDate: cert.eventDate,
        certificateType: cert.certificateType,
        issueDate: cert.issueDate,
        qrCodeUrl: cert.qrCodeUrl,
        pdfStorageUrl: cert.pdfStorageUrl,
        verificationUrl: `http://localhost:3000/verify/${cert.certificateId}`
      }
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}
