import { NextRequest, NextResponse } from 'next/server';
import { supabase, createServiceClient } from '@/lib/supabase';

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

  const photosWithUrls = (data || []).map((p: any) => ({
    ...p,
    url: supabase.storage.from('photos').getPublicUrl(p.storage_path).data.publicUrl,
  }));

  return NextResponse.json({ data: photosWithUrls });
}

// POST /api/photos — upload a photo (open, no auth required)
// Uses SERVICE ROLE KEY to bypass all RLS + storage policies
export async function POST(req: NextRequest) {
  // Parse form data safely
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

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

  // Lenient file type validation — phones send weird MIME types
  const fileType = file.type || 'image/jpeg';
  if (!fileType.startsWith('image/')) {
    return NextResponse.json({ error: `Not an image: ${fileType}` }, { status: 400 });
  }

  // Max 15MB
  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 15MB)' }, { status: 400 });
  }

  // Service role client — bypasses ALL RLS and storage policies
  let svc: ReturnType<typeof createServiceClient>;
  try {
    svc = createServiceClient();
  } catch (e: any) {
    return NextResponse.json({ error: 'Server config error: ' + e.message }, { status: 500 });
  }

  // Safe file extension
  const rawExt = file.name?.split('.').pop()?.toLowerCase() || 'jpg';
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'gif'].includes(rawExt) ? rawExt : 'jpg';
  const storagePath = `community/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

  // Convert to Buffer — handles streaming edge cases on Vercel
  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return NextResponse.json({ error: 'Failed to read file' }, { status: 400 });
  }

  // Upload to Supabase Storage
  const { error: uploadErr } = await svc.storage
    .from('photos')
    .upload(storagePath, buffer, {
      contentType: fileType,
      upsert: false,
    });

  if (uploadErr) {
    return NextResponse.json({ error: `Storage: ${uploadErr.message}` }, { status: 500 });
  }

  // Insert photo record (user_id null for anonymous)
  const { data, error } = await svc
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
    // Clean up uploaded file if DB insert fails
    await svc.storage.from('photos').remove([storagePath]);
    return NextResponse.json({ error: `DB: ${error.message}` }, { status: 500 });
  }

  const publicUrl = svc.storage.from('photos').getPublicUrl(storagePath).data.publicUrl;
  return NextResponse.json({ data: { ...data, url: publicUrl } }, { status: 201 });
}