import { NextRequest, NextResponse } from 'next/server';
import { getProgramQuotaDetails } from '@/lib/serverStore';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { quotaConfig, summary } = getProgramQuotaDetails(id);

    // Format safe public availability map (no private participant data)
    const publicClasses: Record<string, any> = {};
    for (const [key, stat] of Object.entries(summary.classes)) {
      publicClasses[key] = {
        department: stat.department,
        academicYear: stat.academicYear,
        enabled: stat.enabled,
        remainingSeats: stat.remainingSeats,
        status: stat.status
      };
    }

    return NextResponse.json({
      success: true,
      eventId: id,
      participationType: summary.participationType,
      isStatewide: summary.isStatewide,
      waitlistEnabled: summary.waitlistEnabled,
      singleClass:
        summary.participationType === 'Single Class'
          ? quotaConfig.singleClass
          : null,
      classes: publicClasses,
      externalQuota: {
        enabled: summary.externalQuota.enabled,
        remainingSeats: summary.externalQuota.remainingSeats,
        status: summary.externalQuota.status
      },
      registrationStartDate: quotaConfig.registrationStartDate || null,
      registrationClosingDate: quotaConfig.registrationClosingDate || null
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 404 });
  }
}
