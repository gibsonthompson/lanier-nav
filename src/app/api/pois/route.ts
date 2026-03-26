import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/pois — fetch all POIs with aggregated ratings
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type'); // optional filter
  const bounds = searchParams.get('bounds'); // optional: sw_lng,sw_lat,ne_lng,ne_lat

  let query = supabase
    .from('pois_with_ratings')
    .select('*')
    .order('created_at', { ascending: false });

  if (type) {
    query = query.eq('type', type);
  }

  if (bounds) {
    const [swLng, swLat, neLng, neLat] = bounds.split(',').map(Number);
    query = query
      .gte('lat', swLat).lte('lat', neLat)
      .gte('lng', swLng).lte('lng', neLng);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/pois — create a new POI (requires auth)
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Verify user via Supabase
  const { data: { user }, error: authErr } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  if (authErr || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const body = await req.json();
  const { type, name, description, lat, lng, details } = body;

  if (!type || !name || !lat || !lng) {
    return NextResponse.json({ error: 'Missing required fields: type, name, lat, lng' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('pois')
    .insert({
      type,
      name,
      description: description || '',
      lat,
      lng,
      details: details || {},
      source: 'community',
      verified: false,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}