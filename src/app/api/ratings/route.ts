import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/ratings?poi_id=xxx — get rating summary
export async function GET(req: NextRequest) {
  const poi_id = new URL(req.url).searchParams.get('poi_id');
  if (!poi_id) {
    return NextResponse.json({ error: 'poi_id required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('ratings')
    .select('score')
    .eq('poi_id', poi_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const scores = data.map((r: any) => r.score);
  const avg = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;

  return NextResponse.json({
    poi_id,
    avg_rating: Math.round(avg * 10) / 10,
    count: scores.length,
  });
}

// POST /api/ratings — upsert a rating (1-5)
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

  const { poi_id, score } = await req.json();

  if (!poi_id || !score || score < 1 || score > 5) {
    return NextResponse.json({ error: 'poi_id and score (1-5) required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('ratings')
    .upsert(
      { poi_id, user_id: user.id, score },
      { onConflict: 'poi_id,user_id' }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}