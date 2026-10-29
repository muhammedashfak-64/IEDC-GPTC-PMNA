import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuthHelper';
import {
  getCertificateTemplates,
  getCertificateTemplatesAsync,
  saveCertificateTemplate,
  updateCertificateTemplate,
  setActiveCertificateTemplate,
  deleteCertificateTemplate
} from '@/lib/serverStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  const templates = await getCertificateTemplatesAsync();
  return NextResponse.json({ success: true, data: templates });
}

export async function POST(req: NextRequest) {
  const { user, errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    if (!body.title?.trim()) {
      return NextResponse.json({ success: false, error: 'Template title is required' }, { status: 400 });
    }
    if (!body.url?.trim() && !body.cleanUrl?.trim()) {
      return NextResponse.json({ success: false, error: 'Template file URL is required' }, { status: 400 });
    }

    const saved = saveCertificateTemplate(body, user);
    return NextResponse.json({ success: true, data: saved }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const { user, errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Template ID is required' }, { status: 400 });
    }

    let updated: any;
    if (body.templateConfig !== undefined || body.title !== undefined) {
      updated = updateCertificateTemplate(body.id, body, user);
    } else {
      updated = setActiveCertificateTemplate(body.id, user);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const { user, errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ success: false, error: 'Template ID parameter is required' }, { status: 400 });
  }

  try {
    const deleted = deleteCertificateTemplate(id, user);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
