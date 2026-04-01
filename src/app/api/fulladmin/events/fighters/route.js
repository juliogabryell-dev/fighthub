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

// GET: Search fighters or list event fighters
export async function GET(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');
  const search = searchParams.get('search');

  try {
    // Search fighters by name
    if (search) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, handle, avatar_url')
        .eq('is_fighter', true)
        .eq('status', 'active')
        .ilike('full_name', `%${search}%`)
        .order('full_name')
        .limit(10);

      if (error) throw error;
      return NextResponse.json({ fighters: data || [] });
    }

    // List fighters for an event
    if (eventId) {
      const { data, error } = await supabase
        .from('event_fighters')
        .select('id, fighter:fighter_id(id, full_name, handle, avatar_url, city, state)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return NextResponse.json({ event_fighters: data || [] });
    }

    return NextResponse.json({ error: 'event_id ou search é obrigatório' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Add fighter to event
export async function POST(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });
  }

  try {
    const { event_id, fighter_id } = await request.json();
    if (!event_id || !fighter_id) {
      return NextResponse.json({ error: 'event_id e fighter_id são obrigatórios' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('event_fighters')
      .insert({ event_id, fighter_id })
      .select('id, fighter:fighter_id(id, full_name, handle, avatar_url, city, state)')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Lutador já vinculado a este evento' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ event_fighter: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Remove fighter from event
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
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const { error } = await supabase.from('event_fighters').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
