import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/hazards/vote — vote confirm or cleared on a hazard
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

  const { hazard_id, vote_type } = await req.json();

  if (!hazard_id || !['confirm', 'cleared'].includes(vote_type)) {
    return NextResponse.json({ error: 'hazard_id and vote_type (confirm|cleared) required' }, { status: 400 });
  }

  // Upsert — user can change their vote
  const { data, error } = await supabase
    .from('hazard_votes')
    .upsert(
      { hazard_id, user_id: user.id, vote_type },
      { onConflict: 'hazard_id,user_id' }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}