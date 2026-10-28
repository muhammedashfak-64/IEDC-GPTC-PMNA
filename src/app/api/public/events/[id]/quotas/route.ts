import { NextRequest, NextResponse } from 'next/server';
import { getProgramQuotaDetailsAsync } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { quotaConfig, summary } = await getProgramQuotaDetailsAsync(id);

    // Format safe public availability map (no private participant data)
    const publicClasses: Record<string, any> = {};
    for (const [key, stat] of Object.entries(summary.classes)) {
      publicClasses[key] = {
        department: stat.department,
        academicYear: stat.academicYear,
        enabled: stat.enabled,
        capacity: stat.maxSeats,
        registered: stat.confirmedCount,
        remainingSeats: stat.remainingSeats,
        waitlistCount: stat.waitlistCount,
        status: stat.status
      };
    }

    return NextResponse.json({
      success: true,
      eventId: id,
      participationType: summary.participationType,
      isStatewide: summary.isStatewide,
      waitlistEnabled: summary.waitlistEnabled,
      totalCapacity: summary.totalCapacity,
      totalConfirmed: summary.internalConfirmed + summary.externalConfirmed,
      totalRemaining: Math.max(0, summary.internalRemaining + summary.externalRemaining),
      singleClass:
        summary.participationType === 'Single Class'
          ? quotaConfig.singleClass
          : null,
      classes: publicClasses,
      externalQuota: {
        enabled: summary.externalQuota.enabled,
        capacity: summary.externalQuota.maxSeats,
        registered: summary.externalQuota.confirmedCount,
        remainingSeats: summary.externalQuota.remainingSeats,
        waitlistCount: summary.externalQuota.waitlistCount,
        status: summary.externalQuota.status
      },
      registrationStartDate: quotaConfig.registrationStartDate || null,
      registrationClosingDate: quotaConfig.registrationClosingDate || null
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 404 });
  }
}
