import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// POST: Fighter registers for event
export async function POST(request) {
  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });

  try {
    const { event_id, fighter_id, father_name, mother_name } = await request.json();
    if (!event_id || !fighter_id) {
      return NextResponse.json({ error: 'event_id e fighter_id são obrigatórios' }, { status: 400 });
    }

    // Update father/mother name if provided
    if (father_name || mother_name) {
      const update = {};
      if (father_name) update.father_name = father_name;
      if (mother_name) update.mother_name = mother_name;
      await supabase.from('profiles').update(update).eq('id', fighter_id);
    }

    // Create registration
    const { data, error } = await supabase
      .from('event_registrations')
      .insert({ event_id, fighter_id, status: 'pending' })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Você já está inscrito neste evento' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ registration: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET: List registrations (for admin or fighter's own)
export async function GET(request) {
  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');
  const fighterId = searchParams.get('fighter_id');
  const pendingOnly = searchParams.get('pending') === 'true';

  try {
    if (fighterId) {
      // Fighter's own registrations
      let query = supabase
        .from('event_registrations')
        .select('*, event:event_id(id, title, event_date, venue_name, venue_city)')
        .eq('fighter_id', fighterId)
        .order('created_at', { ascending: false });
      const { data } = await query;
      return NextResponse.json({ registrations: data || [] });
    }

    if (eventId) {
      let query = supabase
        .from('event_registrations')
        .select('*, fighter:fighter_id(id, full_name, handle, avatar_url, city, state, phone, whatsapp, birth_date, father_name, mother_name, height_cm, weight_kg, blood_type, bio, instagram, fighter_verified)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      if (pendingOnly) query = query.eq('status', 'pending');
      const { data } = await query;
      return NextResponse.json({ registrations: data || [] });
    }

    // All pending (for admin)
    const { data } = await supabase
      .from('event_registrations')
      .select('*, event:event_id(id, title, event_date), fighter:fighter_id(id, full_name, handle, avatar_url, city, state, phone, whatsapp, birth_date, father_name, mother_name, height_cm, weight_kg, blood_type, bio, instagram, fighter_verified)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    return NextResponse.json({ registrations: data || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: Admin approve/reject
export async function PUT(request) {
  const adminCookie = request.cookies.get('admin_session')?.value;
  if (!adminCookie) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });

  try {
    const { id, status } = await request.json();
    if (!id || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const { error } = await supabase
      .from('event_registrations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
