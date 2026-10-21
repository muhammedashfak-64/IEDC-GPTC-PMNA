import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { loadDb } from '@/lib/serverStore';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const cleanEmail = String(email || '').trim().toLowerCase();

    if (!cleanEmail) {
      return NextResponse.json(
        { success: false, error: 'Please enter your registered administrative recovery email.' },
        { status: 400 }
      );
    }

    const db = loadDb();
    const user = (db.profiles || []).find(
      (p: any) => p.email?.trim().toLowerCase() === cleanEmail || p.username?.trim().toLowerCase() === cleanEmail
    );

    // If account not found
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'No administrative account found with this email or username. Please check your spelling.'
        },
        { status: 404 }
      );
    }

    // Faculty and Student operators must have their resets initiated by Main Admin
    if (user.role !== 'main_admin') {
      return NextResponse.json({
        success: false,
        error: `Account @${user.username} is a ${user.role === 'faculty_coordinator' ? 'Faculty Coordinator' : 'Student Operator'} account. As per institutional security policy, password resets for operators are initiated directly by the Main Administrator via the Operator & Access Management console.`
      });
    }

    // Main Administrator: Secure Supabase Auth Recovery Flow
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: false,
        configured: false,
        error: 'Supabase Auth SMTP is not configured on this environment. To recover the Main Administrator password, please configure your Supabase Project Settings (Authentication -> Email Templates).'
      });
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const redirectUrl = `${origin}/admin/login?recovery=true`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: redirectUrl
    });

    if (resetError) {
      return NextResponse.json({
        success: false,
        configured: true,
        error: `Supabase Auth recovery error: ${resetError.message}. Ensure SMTP provider is verified in Supabase Dashboard.`
      });
    }

    return NextResponse.json({
      success: true,
      configured: true,
      message: `A secure password recovery link has been dispatched to ${cleanEmail}. Click the link in your email to reset your credentials.`
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
