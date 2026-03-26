import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state'); // User's email

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Handle errors
  if (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(`${baseUrl}/dashboard/settings?error=google_denied`);
  }

  if (!code || !state) {
    console.error('Missing code or state');
    return NextResponse.redirect(`${baseUrl}/dashboard/settings?error=invalid_request`);
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_CALENDAR_REDIRECT_URI!,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(`${baseUrl}/dashboard/settings?error=token_exchange_failed`);
    }

    const tokens = await tokenResponse.json();
    console.log('✅ Google tokens received');

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Update client in database
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        google_calendar_connected: true,
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .ilike('email', state);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.redirect(`${baseUrl}/dashboard/settings?error=db_error`);
    }

    console.log('✅ Google Calendar connected for:', state);
    return NextResponse.redirect(`${baseUrl}/dashboard/settings?success=google_connected`);

  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(`${baseUrl}/dashboard/settings?error=unknown`);
  }
}
