import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/comments?poi_id=xxx or ?hazard_id=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const poi_id = searchParams.get('poi_id');
  const hazard_id = searchParams.get('hazard_id');

  if (!poi_id && !hazard_id) {
    return NextResponse.json({ error: 'poi_id or hazard_id required' }, { status: 400 });
  }

  let query = supabase
    .from('comments')
    .select('*, profiles(display_name, avatar_url)')
    .order('created_at', { ascending: true });

  if (poi_id) query = query.eq('poi_id', poi_id);
  if (hazard_id) query = query.eq('hazard_id', hazard_id);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/comments
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: { user }, error: authErr } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );
  if (authErr || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { poi_id, hazard_id, body } = await req.json();

  if (!body || (!poi_id && !hazard_id)) {
    return NextResponse.json({ error: 'body and (poi_id or hazard_id) required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      poi_id: poi_id || null,
      hazard_id: hazard_id || null,
      user_id: user.id,
      body,
    })
    .select('*, profiles(display_name, avatar_url)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}