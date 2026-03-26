import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { SAMPLE_POIS } from '@/data/pois';
import { SAMPLE_HAZARDS } from '@/data/hazards';

// POST /api/seed — one-time migration of hardcoded data into Supabase
// Protected by a seed secret so it can't be called by anyone
export async function POST(req: Request) {
  const { secret } = await req.json().catch(() => ({ secret: '' }));

  if (secret !== process.env.SEED_SECRET && secret !== 'lanier-seed-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sb = createServiceClient();

    // ── Seed POIs ──
    const poiRows = SAMPLE_POIS.map((p) => ({
      type: p.type,
      name: p.name,
      description: p.description,
      lat: p.lat,
      lng: p.lng,
      details: p.details || {},
      source: 'seed' as const,
      verified: true,
    }));

    const { data: poiData, error: poiErr } = await sb
      .from('pois')
      .upsert(poiRows, { onConflict: 'name' })
      .select('id, name');

    if (poiErr) throw new Error(`POI seed error: ${poiErr.message}`);

    // ── Seed Hazards ──
    const hazardRows = SAMPLE_HAZARDS.map((h) => ({
      type: h.type,
      lat: h.lat,
      lng: h.lng,
      description: h.description,
      elevation_ft: h.elevation_ft,
      severity: h.severity,
      status: 'active' as const,
      source: (h.reported_by === 'USACE' || h.reported_by === 'USACE ATON' ? 'usace' : 'community') as 'usace' | 'community',
      reported_by_name: h.reported_by || null,
    }));

    const { data: hazData, error: hazErr } = await sb
      .from('hazards')
      .insert(hazardRows)
      .select('id, type');

    if (hazErr) throw new Error(`Hazard seed error: ${hazErr.message}`);

    return NextResponse.json({
      success: true,
      seeded: {
        pois: poiData?.length || 0,
        hazards: hazData?.length || 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}