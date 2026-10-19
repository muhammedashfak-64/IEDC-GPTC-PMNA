import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdminAuth } from '@/lib/adminAuthHelper';
import { getSettings, updateSettings } from '@/lib/serverStore';
import { isSupabaseConfigured, testSupabaseConnection } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { errorResponse } = requireAdminAuth(req);
  if (errorResponse) return errorResponse;

  const settings = getSettings();
  const supabaseStatus = await testSupabaseConnection();

  return NextResponse.json({
    success: true,
    data: settings,
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nxlaazpcbvzxmdboqlxe.supabase.co',
      isConfigured: isSupabaseConfigured(),
      status: supabaseStatus
    }
  });
}

export async function POST(req: NextRequest) {
  // Only Faculty Coordinators can alter system/website settings
  const { user, errorResponse } = requireAdminAuth(req, true);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();

    // If Faculty submitted updated Supabase credentials
    if (body.supabaseAnonKey || body.supabaseServiceKey) {
      const envPath = path.join(process.cwd(), '.env.local');
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf-8');
      }

      if (body.supabaseAnonKey) {
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = body.supabaseAnonKey.trim();
        if (envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
          envContent = envContent.replace(/NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/, `NEXT_PUBLIC_SUPABASE_ANON_KEY=${body.supabaseAnonKey.trim()}`);
        } else {
          envContent += `\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${body.supabaseAnonKey.trim()}`;
        }
      }

      if (body.supabaseServiceKey) {
        process.env.SUPABASE_SERVICE_ROLE_KEY = body.supabaseServiceKey.trim();
        if (envContent.includes('SUPABASE_SERVICE_ROLE_KEY=')) {
          envContent = envContent.replace(/SUPABASE_SERVICE_ROLE_KEY=.*/, `SUPABASE_SERVICE_ROLE_KEY=${body.supabaseServiceKey.trim()}`);
        } else {
          envContent += `\nSUPABASE_SERVICE_ROLE_KEY=${body.supabaseServiceKey.trim()}`;
        }
      }

      fs.writeFileSync(envPath, envContent, 'utf-8');
    }

    const updated = updateSettings(body, user);
    const testResult = await testSupabaseConnection();

    return NextResponse.json({
      success: true,
      data: updated,
      supabaseStatus: testResult
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
