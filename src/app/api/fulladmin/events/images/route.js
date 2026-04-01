import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function checkAuth(request) {
  return !!request.cookies.get('admin_session')?.value;
}

// POST: Upload image for event
export async function POST(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const eventId = formData.get('event_id');
    const displayOrder = parseInt(formData.get('display_order') || '0', 10);

    if (!file || !eventId) {
      return NextResponse.json({ error: 'Arquivo e event_id são obrigatórios' }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop();
    const fileName = `${eventId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('events')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('events')
      .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;

    const { data, error } = await supabase
      .from('event_images')
      .insert({
        event_id: eventId,
        image_url: imageUrl,
        display_order: displayOrder,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ image: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: Update image order
export async function PUT(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });
  }

  try {
    const { images } = await request.json();
    // images: [{ id, display_order }]

    if (!images || !Array.isArray(images)) {
      return NextResponse.json({ error: 'Lista de imagens inválida' }, { status: 400 });
    }

    for (const img of images) {
      await supabase
        .from('event_images')
        .update({ display_order: img.display_order })
        .eq('id', img.id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Delete image
export async function DELETE(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });
  }

  try {
    const { id, image_url } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'ID da imagem é obrigatório' }, { status: 400 });
    }

    // Delete from storage
    if (image_url) {
      const match = image_url.match(/events\/(.+)$/);
      if (match) {
        await supabase.storage.from('events').remove([match[1]]);
      }
    }

    // Delete from database
    const { error } = await supabase.from('event_images').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
