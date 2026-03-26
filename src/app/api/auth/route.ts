import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/auth — signup or login
// Body: { action: 'signup' | 'login', email, password, display_name? }
export async function POST(req: NextRequest) {
  const { action, email, password, display_name } = await req.json();

  if (!action || !email || !password) {
    return NextResponse.json({ error: 'action, email, and password required' }, { status: 400 });
  }

  if (action === 'signup') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: display_name || email.split('@')[0] },
      },
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({
      user: data.user ? { id: data.user.id, email: data.user.email } : null,
      session: data.session,
    }, { status: 201 });
  }

  if (action === 'login') {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 401 });

    return NextResponse.json({
      user: { id: data.user.id, email: data.user.email },
      session: data.session,
    });
  }

  return NextResponse.json({ error: 'action must be signup or login' }, { status: 400 });
}