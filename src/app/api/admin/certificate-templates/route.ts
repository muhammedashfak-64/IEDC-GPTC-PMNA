import { NextRequest, NextResponse } from 'next/server';
import { getAdminUserFromRequest } from '@/lib/adminAuthHelper';
import {
  getCertificateTemplates,
  saveCertificateTemplate,
  setActiveCertificateTemplate,
  deleteCertificateTemplate
} from '@/lib/serverStore';

export async function GET(req: NextRequest) {
  const auth = getAdminUserFromRequest(req);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized admin access' }, { status: 401 });
  }

  const templates = getCertificateTemplates();
  return NextResponse.json({ success: true, data: templates });
}

export async function POST(req: NextRequest) {
  const auth = getAdminUserFromRequest(req);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized admin access' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body.title?.trim()) {
      return NextResponse.json({ success: false, error: 'Template title is required' }, { status: 400 });
    }
    if (!body.url?.trim()) {
      return NextResponse.json({ success: false, error: 'Template file URL is required' }, { status: 400 });
    }

    const saved = saveCertificateTemplate(body, auth);
    return NextResponse.json({ success: true, data: saved }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = getAdminUserFromRequest(req);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized admin access' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Template ID is required' }, { status: 400 });
    }

    const updated = setActiveCertificateTemplate(body.id, auth);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = getAdminUserFromRequest(req);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized admin access' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ success: false, error: 'Template ID parameter is required' }, { status: 400 });
  }

  const deleted = deleteCertificateTemplate(id, auth);
  return NextResponse.json({ success: deleted });
}
