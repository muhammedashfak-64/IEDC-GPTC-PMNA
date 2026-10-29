import { NextRequest, NextResponse } from 'next/server';
import { registerStudentForEvent } from '@/lib/serverStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventId = String(body.eventId || '').trim();

    if (!eventId) {
      return NextResponse.json({ success: false, error: 'Event ID is required' }, { status: 400 });
    }

    const studentName = String(body.studentName || '').trim();
    const registerNumber = String(body.registerNumber || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const department = String(body.department || '').trim();

    if (!studentName || studentName.length < 2) {
      return NextResponse.json({ success: false, error: 'Please enter your full legal student name.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return NextResponse.json({ success: false, error: 'Please enter a valid 10-digit mobile number.' }, { status: 400 });
    }

    const collegeName = String(body.collegeName || '').trim();
    const isExternal =
      body.participationCategory === 'External' ||
      (collegeName &&
        !collegeName.toLowerCase().includes('perinthalmanna') &&
        !collegeName.toLowerCase().includes('gptc pmna'));

    const participationCategory: 'Internal' | 'External' = isExternal ? 'External' : 'Internal';

    if (participationCategory === 'Internal' && !department) {
      return NextResponse.json({ success: false, error: 'Please select your academic department.' }, { status: 400 });
    }

    if (participationCategory === 'External' && !collegeName) {
      return NextResponse.json({ success: false, error: 'Please enter your institution / college name.' }, { status: 400 });
    }

    if (participationCategory === 'External') {
      const extBranch = String(body.branch || body.department || '').trim();
      if (!extBranch) {
        return NextResponse.json({ success: false, error: 'Please enter your branch / department name.' }, { status: 400 });
      }
    }

    if (body.consent === false) {
      return NextResponse.json({ success: false, error: 'Consent to attend and adhere to event guidelines is required.' }, { status: 400 });
    }

    const registration = await registerStudentForEvent({
      eventId,
      studentName,
      registerNumber,
      email,
      phone,
      department: department || body.branch || body.course || 'External',
      branch: body.branch || department || body.course || '',
      academicYear: body.academicYear || 'First Year',
      semester: body.semester || null,
      collegeName: collegeName || 'Govt Polytechnic College Perinthalmanna',
      participationCategory,
      district: body.district ? String(body.district).trim() : '',
      course: body.course ? String(body.course).trim() : '',
      additionalNotes: body.additionalNotes || '',
      consent: true
    });

    const isWaitlisted = registration.status === 'Waitlisted';
    const message = isWaitlisted
      ? `Seats full! You have joined the official Waiting List at position #${registration.waitlistPosition}. We will notify you if a seat opens up.`
      : 'Your registration has been confirmed successfully!';

    return NextResponse.json(
      {
        success: true,
        message,
        status: registration.status,
        waitlistPosition: registration.waitlistPosition,
        data: registration
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Registration failed' }, { status: 400 });
  }
}
