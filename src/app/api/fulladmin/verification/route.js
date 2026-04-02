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

// GET: List pending verification requests
export async function GET(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });
  }

  try {
    // Profiles with verification_requested (for academy role or general)
    const { data: profileRequests } = await supabase
      .from('profiles')
      .select('id, full_name, handle, avatar_url, role, is_fighter, is_coach, verification_requested, fighter_verification_requested, coach_verification_requested, verified, fighter_verified, coach_verified')
      .or('verification_requested.eq.true,fighter_verification_requested.eq.true,coach_verification_requested.eq.true')
      .order('created_at', { ascending: false });

    // Entity tables
    const [{ data: referees }, { data: teams }, { data: matchMakers }, { data: federations }] = await Promise.all([
      supabase.from('referees').select('id, owner_id, verified, verification_requested, owner:owner_id(full_name, handle, avatar_url)').eq('verification_requested', true).eq('verified', false),
      supabase.from('teams').select('id, owner_id, name, verified, verification_requested, owner:owner_id(full_name, handle, avatar_url)').eq('verification_requested', true).eq('verified', false),
      supabase.from('match_makers').select('id, owner_id, verified, verification_requested, owner:owner_id(full_name, handle, avatar_url)').eq('verification_requested', true).eq('verified', false),
      supabase.from('federations').select('id, owner_id, official_name, verified, verification_requested, owner:owner_id(full_name, handle, avatar_url)').eq('verification_requested', true).eq('verified', false),
    ]);

    const pending = [];

    // Profile-based requests (fighter, coach, academy)
    for (const p of (profileRequests || [])) {
      if (p.fighter_verification_requested && !p.fighter_verified) {
        pending.push({ id: p.id, type: 'fighter', table: 'profiles', field: 'fighter_verified', requestField: 'fighter_verification_requested', name: p.full_name, handle: p.handle, avatar_url: p.avatar_url, label: 'Lutador' });
      }
      if (p.coach_verification_requested && !p.coach_verified) {
        pending.push({ id: p.id, type: 'coach', table: 'profiles', field: 'coach_verified', requestField: 'coach_verification_requested', name: p.full_name, handle: p.handle, avatar_url: p.avatar_url, label: 'Treinador' });
      }
      if (p.verification_requested && !p.verified && p.role === 'academy') {
        pending.push({ id: p.id, type: 'academy', table: 'profiles', field: 'verified', requestField: 'verification_requested', name: p.full_name, handle: p.handle, avatar_url: p.avatar_url, label: 'Academia' });
      }
    }

    // Entity-based requests
    for (const r of (referees || [])) {
      pending.push({ id: r.id, type: 'referee', table: 'referees', field: 'verified', requestField: 'verification_requested', name: r.owner?.full_name, handle: r.owner?.handle, avatar_url: r.owner?.avatar_url, label: 'Árbitro' });
    }
    for (const t of (teams || [])) {
      pending.push({ id: t.id, type: 'team', table: 'teams', field: 'verified', requestField: 'verification_requested', name: t.name || t.owner?.full_name, handle: t.owner?.handle, avatar_url: t.owner?.avatar_url, label: 'Equipe' });
    }
    for (const m of (matchMakers || [])) {
      pending.push({ id: m.id, type: 'match_maker', table: 'match_makers', field: 'verified', requestField: 'verification_requested', name: m.owner?.full_name, handle: m.owner?.handle, avatar_url: m.owner?.avatar_url, label: 'Match Maker' });
    }
    for (const f of (federations || [])) {
      pending.push({ id: f.id, type: 'federation', table: 'federations', field: 'verified', requestField: 'verification_requested', name: f.official_name || f.owner?.full_name, handle: f.owner?.handle, avatar_url: f.owner?.avatar_url, label: 'Federação' });
    }

    return NextResponse.json({ pending });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Approve or reject verification
export async function POST(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });
  }

  try {
    const { id, table, field, requestField, action } = await request.json();

    if (!id || !table || !field || !action) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    if (action === 'approve') {
      await supabase.from(table).update({
        [field]: true,
        [requestField]: false,
        verified_at: new Date().toISOString(),
      }).eq('id', id);
    } else {
      // reject - just clear the request
      await supabase.from(table).update({
        [requestField]: false,
      }).eq('id', id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
