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
  const adminCookie = request.cookies.get('admin_session')?.value;
  if (!adminCookie) return false;
  return true;
}

// GET: List all events (admin sees all, public sees published future events)
export async function GET(request) {
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const publicOnly = searchParams.get('public') === 'true';

  try {
    let query = supabase
      .from('events')
      .select('*, event_images(id, image_url, display_order)')
      .order('event_date', { ascending: true });

    if (publicOnly) {
      query = query
        .eq('is_published', true)
        .gte('event_date', new Date().toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;

    // Sort images by display_order
    const events = (data || []).map((event) => ({
      ...event,
      event_images: (event.event_images || []).sort((a, b) => a.display_order - b.display_order),
    }));

    return NextResponse.json({ events });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Create event
export async function POST(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { title, description_short, description_full, event_date, payment_link, external_link, is_published } = body;

    if (!title || !description_short || !event_date) {
      return NextResponse.json({ error: 'Título, descrição curta e data são obrigatórios' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('events')
      .insert({
        title,
        description_short,
        description_full: description_full || null,
        event_date,
        payment_link: payment_link || null,
        external_link: external_link || null,
        is_published: is_published !== false,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ event: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: Update event
export async function PUT(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { id, title, description_short, description_full, event_date, payment_link, external_link, is_published } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do evento é obrigatório' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('events')
      .update({
        title,
        description_short,
        description_full: description_full || null,
        event_date,
        payment_link: payment_link || null,
        external_link: external_link || null,
        is_published,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ event: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Delete event
export async function DELETE(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });
  }

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'ID do evento é obrigatório' }, { status: 400 });
    }

    // Delete images from storage first
    const { data: images } = await supabase
      .from('event_images')
      .select('image_url')
      .eq('event_id', id);

    if (images && images.length > 0) {
      const paths = images
        .map((img) => {
          const match = img.image_url.match(/event-images\/(.+)$/);
          return match ? match[1] : null;
        })
        .filter(Boolean);

      if (paths.length > 0) {
        await supabase.storage.from('event-images').remove(paths);
      }
    }

    // Delete event (cascade deletes event_images rows)
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
