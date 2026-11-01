import { NextRequest, NextResponse } from 'next/server';
import { getIdeasAsync, createIdea } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const list = await getIdeasAsync(true); // Return approved ideas for public showcase
    return NextResponse.json(
      { success: true, count: list.length, data: list },
      { headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title || !body.problemStatement || !body.proposedSolution) {
      return NextResponse.json(
        { success: false, error: 'Title, Problem Statement, and Proposed Solution are required.' },
        { status: 400 }
      );
    }
    const newIdea = await createIdea({
      title: body.title,
      problemStatement: body.problemStatement,
      proposedSolution: body.proposedSolution,
      studentName: body.studentName || 'Student Innovator',
      registerNumber: body.registerNumber || '',
      department: body.department || 'General',
      status: 'Pending'
    });
    return NextResponse.json({ success: true, data: newIdea });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
