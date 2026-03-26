import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/photos?poi_id=xxx or ?hazard_id=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const poi_id = searchParams.get('poi_id');
  const hazard_id = searchParams.get('hazard_id');

  if (!poi_id && !hazard_id) {
    return NextResponse.json({ error: 'poi_id or hazard_id required' }, { status: 400 });
  }

  let query = supabase
    .from('photos')
    .select('*, profiles(display_name)')
    .order('created_at', { ascending: false });

  if (poi_id) query = query.eq('poi_id', poi_id);
  if (hazard_id) query = query.eq('hazard_id', hazard_id);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Generate public URLs for each photo
  const photosWithUrls = data.map((p: any) => ({
    ...p,
    url: supabase.storage.from('photos').getPublicUrl(p.storage_path).data.publicUrl,
  }));

  return NextResponse.json({ data: photosWithUrls });
}

// POST /api/photos — upload a photo (open, no auth required)
// Expects multipart FormData with: file, poi_id or hazard_id, caption (optional)
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const poi_id = formData.get('poi_id') as string | null;
  const hazard_id = formData.get('hazard_id') as string | null;
  const caption = (formData.get('caption') as string) || '';

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (!poi_id && !hazard_id) {
    return NextResponse.json({ error: 'poi_id or hazard_id required' }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP, HEIC allowed' }, { status: 400 });
  }

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
  }

  // Upload to Supabase Storage (anonymous folder)
  const ext = file.name.split('.').pop() || 'jpg';
  const storagePath = `community/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from('photos')
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadErr) {
    return NextResponse.json({ error: `Upload failed: ${uploadErr.message}` }, { status: 500 });
  }

  // Create photo record (user_id null for anonymous)
  const { data, error } = await supabase
    .from('photos')
    .insert({
      poi_id: poi_id || null,
      hazard_id: hazard_id || null,
      user_id: null,
      storage_path: storagePath,
      caption,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const publicUrl = supabase.storage.from('photos').getPublicUrl(storagePath).data.publicUrl;

  return NextResponse.json({ data: { ...data, url: publicUrl } }, { status: 201 });
}