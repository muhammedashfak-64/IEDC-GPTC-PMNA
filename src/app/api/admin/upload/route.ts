import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuthHelper';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

// Allowed image types & max 5MB limit
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const { user, errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'team';

    const isDoc = ['documents', 'brochures', 'certificates'].includes(folder);
    const allowedTypes = isDoc
      ? [...ALLOWED_MIME_TYPES, 'application/pdf']
      : ALLOWED_MIME_TYPES;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `Invalid file format. ${isDoc ? 'Only JPG, PNG, WebP and PDF files' : 'Only JPG, PNG, and WebP images'} are allowed.` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 5MB limit.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const extension = path.extname(file.name) || (file.type === 'application/pdf' ? '.pdf' : '.jpg');
    const cleanBase = path.basename(file.name, extension).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${cleanBase}_${Date.now()}${extension}`;

    const bucketMap: Record<string, string> = {
      team: 'team-photos',
      events: 'event-posters',
      gallery: 'gallery',
      documents: 'documents',
      brochures: 'documents',
      certificates: 'certificates'
    };
    const bucket = (formData.get('bucket') as string) || bucketMap[folder] || 'team-photos';

    let publicUrl = '';

    // 1. Try uploading to Supabase Storage if configured
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(`${folder}/${filename}`, buffer, {
            contentType: file.type,
            upsert: true
          });

        if (!error && data) {
          const { data: publicData } = supabase.storage
            .from(bucket)
            .getPublicUrl(`${folder}/${filename}`);
          publicUrl = publicData.publicUrl;
        }
      } catch (err) {
        console.warn('Supabase storage upload failed, falling back to local storage:', err);
      }
    }

    // 2. Local filesystem storage fallback (ensures offline/dev work and immediate preview)
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const localFilePath = path.join(uploadDir, filename);
    fs.writeFileSync(localFilePath, buffer);

    if (!publicUrl) {
      publicUrl = `/uploads/${folder}/${filename}`;
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      size: file.size,
      mimeType: file.type
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Upload failed' }, { status: 500 });
  }
}
