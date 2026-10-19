import { NextResponse } from 'next/server';
import { getCommittee, getFacultyCoordinators } from '@/lib/serverStore';

export async function GET() {
  try {
    const committee = getCommittee(true);
    const faculty = getFacultyCoordinators(true);

    return NextResponse.json({
      success: true,
      data: {
        executiveCommittee: committee,
        facultyCoordinators: faculty
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
