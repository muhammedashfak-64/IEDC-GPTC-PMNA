import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuthHelper';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';
import fs from 'fs';
import path from 'path';

// Allowed MIME Types
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/svg+xml', 'image/gif'];
const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/msword', // doc
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-excel', // xls
  'text/csv',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation' // pptx
];
const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];

// Max file sizes
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_DOC_SIZE = 25 * 1024 * 1024; // 25 MB
const MAX_VIDEO_SIZE = 60 * 1024 * 1024; // 60 MB

export async function POST(req: NextRequest) {
  const { user, errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'website';
    const explicitBucket = formData.get('bucket') as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided.' }, { status: 400 });
    }

    const mime = file.type.toLowerCase();
    const isImage = IMAGE_MIME_TYPES.includes(mime);
    const isDoc = DOCUMENT_MIME_TYPES.includes(mime);
    const isVideo = VIDEO_MIME_TYPES.includes(mime);

    // Validate type based on context
    const allowsVideo = ['gallery'].includes(folder);
    const allowsDoc = ['documents', 'brochures', 'certificates', 'resources', 'projects'].includes(folder);

    let isValidType = isImage;
    if (allowsDoc && isDoc) isValidType = true;
    if (allowsVideo && isVideo) isValidType = true;

    // Fallback check by extension if mime type is generic application/octet-stream
    const rawExtension = path.extname(file.name).toLowerCase();
    if (!isValidType) {
      const validDocExts = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.csv', '.pptx'];
      const validImgExts = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'];
      const validVideoExts = ['.mp4', '.webm'];

      if (validImgExts.includes(rawExtension)) isValidType = true;
      if (allowsDoc && validDocExts.includes(rawExtension)) isValidType = true;
      if (allowsVideo && validVideoExts.includes(rawExtension)) isValidType = true;
    }

    if (!isValidType) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file format (${rawExtension || mime}). Please select a supported JPG, PNG, WebP image${
            allowsDoc ? ', PDF, DOCX, XLSX, CSV document' : ''
          }${allowsVideo ? ', or MP4 video' : ''}.`
        },
        { status: 400 }
      );
    }

    // Validate file size
    const maxSize = isVideo ? MAX_VIDEO_SIZE : isDoc ? MAX_DOC_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      const limitMb = Math.round(maxSize / (1024 * 1024));
      return NextResponse.json(
        { success: false, error: `File size exceeds the permitted limit of ${limitMb}MB.` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const extension = rawExtension || (isDoc ? '.pdf' : isVideo ? '.mp4' : '.jpg');
    const cleanBase = path.basename(file.name, extension).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
    const filename = `${cleanBase}_${Date.now()}${extension}`;

    // Bucket mapping
    const bucketMap: Record<string, string> = {
      team: 'team-photos',
      faculty: 'team-photos',
      committee: 'team-photos',
      events: 'event-posters',
      gallery: 'gallery',
      projects: 'project-files',
      resources: 'resources',
      startups: 'website-assets',
      website: 'website-assets',
      homepage: 'website-assets',
      settings: 'website-assets',
      partners: 'website-assets',
      blogs: 'website-assets',
      announcements: 'website-assets',
      certificates: 'certificates',
      documents: 'documents',
      brochures: 'documents'
    };

    const bucket = explicitBucket || bucketMap[folder] || 'website-assets';
    let fileUrl = '';
    let storagePath = `${folder}/${filename}`;

    // 1. Upload to Supabase Storage using service-role client (secure & bypasses client RLS)
    if (isSupabaseAdminConfigured()) {
      try {
        const { data, error } = await supabaseAdmin.storage
          .from(bucket)
          .upload(storagePath, buffer, {
            contentType: file.type || 'application/octet-stream',
            upsert: true
          });

        if (!error && data) {
          if (bucket === 'certificates') {
            // Private bucket: create a signed URL valid for 24 hours, or return the storage path
            const { data: signedData } = await supabaseAdmin.storage
              .from(bucket)
              .createSignedUrl(storagePath, 60 * 60 * 24);
            fileUrl = signedData?.signedUrl || `/api/certificates/download?path=${encodeURIComponent(storagePath)}`;
          } else {
            // Public bucket: retrieve permanent public URL
            const { data: publicData } = supabaseAdmin.storage
              .from(bucket)
              .getPublicUrl(storagePath);
            fileUrl = publicData.publicUrl;
          }
        } else if (error) {
          console.warn('Supabase storage upload error:', error.message);
        }
      } catch (storageErr) {
        console.warn('Supabase storage exception:', storageErr);
      }
    }

    // 2. Local fallback mirror (ensures offline development resilience)
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const localFilePath = path.join(uploadDir, filename);
      fs.writeFileSync(localFilePath, buffer);

      if (!fileUrl) {
        fileUrl = `/uploads/${folder}/${filename}`;
      }
    } catch (fsErr) {
      console.warn('Local file fallback write error:', fsErr);
    }

    return NextResponse.json({
      success: true,
      url: fileUrl,
      storagePath,
      bucket,
      filename,
      originalName: file.name,
      size: file.size,
      mimeType: file.type
    });
  } catch (err: any) {
    console.error('Upload handler error:', err);
    return NextResponse.json({ success: false, error: err.message || 'File upload failed' }, { status: 500 });
  }
}
