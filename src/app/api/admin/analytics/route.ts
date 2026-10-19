import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuthHelper';
import { getEvents, getCertificates, getProjects, getRegistrations, getIdeas } from '@/lib/serverStore';

export async function GET(req: NextRequest) {
  const { errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  const events = getEvents();
  const certs = getCertificates();
  const projects = getProjects();
  const registrations = getRegistrations();
  const ideas = getIdeas();

  return NextResponse.json({
    success: true,
    data: {
      stats: {
        totalEvents: events.length,
        publishedEvents: events.filter((e: any) => e.status === 'Published').length,
        totalCertificates: certs.length,
        publishedCertificates: certs.filter((c: any) => c.status === 'Published').length,
        totalRegistrations: registrations.length,
        totalProjects: projects.length,
        totalIdeas: ideas.length,
        approvedIdeas: ideas.filter((i: any) => i.status === 'Approved').length
      },
      memberGrowth: [
        { month: 'Jan', members: 120 },
        { month: 'Feb', members: 180 },
        { month: 'Mar', members: 240 },
        { month: 'Apr', members: 310 },
        { month: 'May', members: 380 },
        { month: 'Jun', members: 450 },
        { month: 'Jul', members: 540 },
        { month: 'Aug', members: 650 }
      ],
      departmentBreakdown: [
        { department: 'Computer Engineering', count: 245 },
        { department: 'Electronics Engineering', count: 198 },
        { department: 'Electrical Engineering', count: 112 },
        { department: 'Mechanical Engineering', count: 68 },
        { department: 'Civil Engineering', count: 27 }
      ]
    }
  });
}
