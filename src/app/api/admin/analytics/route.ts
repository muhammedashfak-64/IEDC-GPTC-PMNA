import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuthHelper';
import { loadDb } from '@/lib/serverStore';

export async function GET(req: NextRequest) {
  const { errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  const db = loadDb();
  const allRegistrations: any[] = db.registrations || [];
  const allEvents: any[] = db.events || [];
  const allCertificates: any[] = db.certificates || [];
  const allProjects: any[] = db.projects || [];
  const allIdeas: any[] = db.ideas || [];
  const allResources: any[] = db.resources || [];
  const allTeamMembers: any[] = db.teamMembers || [];
  const allFaculty: any[] = db.facultyCoordinators || [];
  const allStartups: any[] = db.startups || [];

  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') || 'all';
  const customStart = searchParams.get('startDate');
  const customEnd = searchParams.get('endDate');

  // Compute date boundary
  const now = new Date();
  let startTime: number | null = null;
  let endTime: number | null = null;

  if (range === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    startTime = start.getTime();
    endTime = now.getTime();
  } else if (range === '7d') {
    startTime = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    endTime = now.getTime();
  } else if (range === '30d') {
    startTime = now.getTime() - 30 * 24 * 60 * 60 * 1000;
    endTime = now.getTime();
  } else if (range === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    startTime = start.getTime();
    endTime = now.getTime();
  } else if (range === 'year') {
    const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    startTime = start.getTime();
    endTime = now.getTime();
  } else if (range === 'custom' && customStart) {
    startTime = new Date(customStart).getTime();
    if (customEnd) {
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      endTime = end.getTime();
    } else {
      endTime = now.getTime();
    }
  }

  // Filter registrations by date range
  const filteredRegistrations = allRegistrations.filter((r) => {
    if (!startTime) return true;
    const t = new Date(r.registeredAt || r.createdAt || 0).getTime();
    if (isNaN(t) || t === 0) return true;
    if (t < startTime) return false;
    if (endTime && t > endTime) return false;
    return true;
  });

  // Filter events by date range
  const filteredEvents = allEvents.filter((e) => {
    if (!startTime) return true;
    const t = new Date(e.date || e.createdAt || 0).getTime();
    if (isNaN(t) || t === 0) return true;
    if (t < startTime) return false;
    if (endTime && t > endTime) return false;
    return true;
  });

  // Filter certificates by date range
  const filteredCertificates = allCertificates.filter((c) => {
    if (!startTime) return true;
    const t = new Date(c.issuedAt || c.issueDate || c.createdAt || 0).getTime();
    if (isNaN(t) || t === 0) return true;
    if (t < startTime) return false;
    if (endTime && t > endTime) return false;
    return true;
  });

  // Status breakdown of registrations
  const confirmed = filteredRegistrations.filter((r) => r.status === 'Confirmed').length;
  const attended = filteredRegistrations.filter((r) => r.status === 'Attended').length;
  const waitlisted = filteredRegistrations.filter((r) => r.status === 'Waitlisted').length;
  const cancelled = filteredRegistrations.filter((r) => r.status === 'Cancelled' || r.status === 'Rejected').length;
  const eligibleForRate = attended + confirmed;
  const attendanceRate = eligibleForRate > 0 ? Math.round((attended / eligibleForRate) * 100) : 0;

  // Department breakdown
  const departmentCounts: Record<string, number> = {};
  filteredRegistrations.forEach((r) => {
    const dept = r.department ? String(r.department).trim() : 'Other / General';
    departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
  });
  const departmentBreakdown = Object.entries(departmentCounts)
    .map(([department, count]) => ({ department, count }))
    .sort((a, b) => b.count - a.count);

  // Category breakdown
  let internalCount = 0;
  let externalCount = 0;
  filteredRegistrations.forEach((r) => {
    if (r.participationCategory === 'External') {
      externalCount++;
    } else {
      internalCount++;
    }
  });

  // Academic Year breakdown
  const academicYearCounts: Record<string, number> = {};
  filteredRegistrations.forEach((r) => {
    const yr = r.academicYear ? String(r.academicYear).trim() : 'Unspecified';
    academicYearCounts[yr] = (academicYearCounts[yr] || 0) + 1;
  });
  const academicYearBreakdown = Object.entries(academicYearCounts)
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => b.count - a.count);

  // Event attendance breakdown (per event from filtered registrations)
  const eventAttendanceMap = new Map<string, { title: string; registered: number; attended: number }>();
  allEvents.forEach((e) => {
    eventAttendanceMap.set(e.id, { title: e.title, registered: 0, attended: 0 });
  });

  filteredRegistrations.forEach((r) => {
    if (!r.eventId) return;
    const entry = eventAttendanceMap.get(r.eventId);
    if (entry) {
      if (r.status === 'Confirmed' || r.status === 'Attended') {
        entry.registered++;
      }
      if (r.status === 'Attended') {
        entry.attended++;
      }
    } else {
      const title = r.eventTitle || 'Campus Event';
      eventAttendanceMap.set(r.eventId, {
        title,
        registered: r.status === 'Confirmed' || r.status === 'Attended' ? 1 : 0,
        attended: r.status === 'Attended' ? 1 : 0
      });
    }
  });

  const eventAttendanceBreakdown = Array.from(eventAttendanceMap.values())
    .filter((e) => e.registered > 0 || e.attended > 0)
    .slice(0, 10);

  // Timeline aggregation (group registrations by month or day based on range)
  const isDaily = range === '7d' || range === '30d' || range === 'today';
  const timelineMap: Record<string, number> = {};

  // Sort registrations by registered date
  const sortedRegs = [...filteredRegistrations].sort((a, b) => {
    return new Date(a.registeredAt || a.createdAt || 0).getTime() - new Date(b.registeredAt || b.createdAt || 0).getTime();
  });

  sortedRegs.forEach((r) => {
    const d = new Date(r.registeredAt || r.createdAt || 0);
    if (isNaN(d.getTime())) return;

    const key = isDaily
      ? d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
      : d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

    timelineMap[key] = (timelineMap[key] || 0) + 1;
  });

  const timelineLabels = Object.keys(timelineMap);
  let runningTotal = 0;
  const timelineData = timelineLabels.map((lbl) => {
    runningTotal += timelineMap[lbl];
    return {
      period: lbl,
      count: timelineMap[lbl],
      cumulative: runningTotal
    };
  });

  // Calculate certificate downloads
  const totalCertDownloads = allCertificates.reduce((acc, c) => acc + (Number(c.downloadsCount) || 0), 0);

  // Today ISO date for comparing upcoming vs completed
  const todayIso = now.toISOString().slice(0, 10);
  const upcomingEvents = allEvents.filter((e) => e.date >= todayIso && e.status === 'Published').length;
  const completedEvents = allEvents.filter((e) => e.date < todayIso || e.status === 'Completed').length;

  return NextResponse.json({
    success: true,
    data: {
      range,
      stats: {
        totalRegistrations: filteredRegistrations.length,
        allTimeRegistrations: allRegistrations.length,
        confirmedRegistrations: confirmed,
        attendedRegistrations: attended,
        waitlistedRegistrations: waitlisted,
        cancelledRegistrations: cancelled,
        attendanceRate,
        totalEvents: allEvents.length,
        filteredEventsCount: filteredEvents.length,
        publishedEvents: allEvents.filter((e) => e.status === 'Published').length,
        upcomingEvents,
        completedEvents,
        totalCertificates: allCertificates.length,
        filteredCertificatesCount: filteredCertificates.length,
        publishedCertificates: allCertificates.filter((c) => c.status === 'Published').length,
        totalCertDownloads,
        totalProjects: allProjects.length,
        totalIdeas: allIdeas.length,
        approvedIdeas: allIdeas.filter((i) => i.status === 'Approved').length,
        totalResources: allResources.length,
        publishedResources: allResources.filter((r) => r.status === 'Published').length,
        totalTeamMembers: allTeamMembers.length,
        totalFaculty: allFaculty.length,
        totalStartups: allStartups.length
      },
      timeline: timelineData,
      departmentBreakdown,
      eventAttendanceBreakdown,
      categoryBreakdown: {
        internal: internalCount,
        external: externalCount
      },
      academicYearBreakdown
    }
  });
}
