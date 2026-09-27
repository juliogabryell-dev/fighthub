import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/lib/supabase/server';
import { BINDING_TYPES, findRule } from '@/lib/bindings';

export const dynamic = 'force-dynamic';

const ENTITY_TABLES = {
  team: { table: 'teams', select: 'id, owner_id, name, logo_url, owner:owner_id(handle, avatar_url)', name: (r) => r.name },
  federation: { table: 'federations', select: 'id, owner_id, official_name, abbreviation, logo_url, owner:owner_id(handle, avatar_url)', name: (r) => r.official_name },
  match_maker: { table: 'match_makers', select: 'id, owner_id, logo_url, owner:owner_id(full_name, handle, avatar_url)', name: (r) => r.owner?.full_name },
};

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function getSessionUser() {
  const supabase = await createSessionClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Map of kind -> entity id the current user acts as
async function getMyKinds(admin, userId) {
  const { data: profile } = await admin.from('profiles').select('id, role, is_fighter, is_coach').eq('id', userId).single();
  const kinds = {};
  if (!profile) return kinds;
  if (profile.is_fighter) kinds.fighter = userId;
  if (profile.is_coach) kinds.coach = userId;
  if (profile.role === 'academy') kinds.academy = userId;
  for (const [kind, cfg] of Object.entries(ENTITY_TABLES)) {
    const { data } = await admin.from(cfg.table).select('id').eq('owner_id', userId).maybeSingle();
    if (data) kinds[kind] = data.id;
  }
  return kinds;
}

// Profile id that owns an entity of <kind>
async function ownerOf(admin, kind, id) {
  if (['fighter', 'coach', 'academy'].includes(kind)) return id;
  const { data } = await admin.from(ENTITY_TABLES[kind].table).select('owner_id').eq('id', id).maybeSingle();
  return data?.owner_id || null;
}

async function entityExists(admin, kind, id) {
  if (ENTITY_TABLES[kind]) {
    const { data } = await admin.from(ENTITY_TABLES[kind].table).select('id').eq('id', id).eq('status', 'active').maybeSingle();
    return !!data;
  }
  const { data: p } = await admin.from('profiles').select('id, role, is_fighter, is_coach, status').eq('id', id).maybeSingle();
  if (!p || p.status !== 'active') return false;
  if (kind === 'fighter') return !!p.is_fighter;
  if (kind === 'coach') return !!p.is_coach;
  if (kind === 'academy') return p.role === 'academy';
  return false;
}

// Batch-load display info: { `${kind}:${id}`: { name, handle, avatar_url } }
async function loadEntities(admin, refs) {
  const out = {};
  const byKind = {};
  for (const { kind, id } of refs) (byKind[kind] ||= new Set()).add(id);
  for (const [kind, ids] of Object.entries(byKind)) {
    const list = [...ids];
    if (ENTITY_TABLES[kind]) {
      const cfg = ENTITY_TABLES[kind];
      const { data } = await admin.from(cfg.table).select(cfg.select).in('id', list);
      for (const r of data || []) {
        out[`${kind}:${r.id}`] = { name: cfg.name(r) || '—', handle: r.owner?.handle || null, avatar_url: r.logo_url || r.owner?.avatar_url || null };
      }
    } else {
      const { data } = await admin.from('profiles').select('id, full_name, handle, avatar_url').in('id', list);
      for (const r of data || []) {
        out[`${kind}:${r.id}`] = { name: r.full_name || '—', handle: r.handle, avatar_url: r.avatar_url };
      }
    }
  }
  return out;
}

function err(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// GET /api/bindings                        -> my bindings (incoming, outgoing, active)
// GET /api/bindings?search=<kind>&q=<text> -> search entities to request a binding with
export async function GET(request) {
  const user = await getSessionUser();
  if (!user) return err('Não autenticado', 401);
  const admin = getAdminClient();
  if (!admin) return err('Supabase não configurado', 500);

  const { searchParams } = new URL(request.url);
  const searchKind = searchParams.get('search');

  if (searchKind) {
    const q = (searchParams.get('q') || '').trim().replace(/[%,()]/g, '');
    let results = [];
    if (ENTITY_TABLES[searchKind]) {
      const cfg = ENTITY_TABLES[searchKind];
      let query = admin.from(cfg.table).select(cfg.select).eq('status', 'active').neq('owner_id', user.id).limit(30);
      if (q && searchKind === 'team') query = query.ilike('name', `%${q}%`);
      if (q && searchKind === 'federation') query = query.or(`official_name.ilike.%${q}%,abbreviation.ilike.%${q}%`);
      const { data } = await query;
      results = (data || []).map((r) => ({ id: r.id, name: cfg.name(r), handle: r.owner?.handle || null, avatar_url: r.logo_url || r.owner?.avatar_url || null }));
      if (q && searchKind === 'match_maker') {
        const lq = q.toLowerCase();
        results = results.filter((r) => (r.name || '').toLowerCase().includes(lq) || (r.handle || '').toLowerCase().includes(lq));
      }
    } else if (['fighter', 'coach', 'academy'].includes(searchKind)) {
      let query = admin.from('profiles').select('id, full_name, handle, avatar_url').eq('status', 'active').neq('id', user.id).limit(30);
      if (searchKind === 'fighter') query = query.eq('is_fighter', true);
      if (searchKind === 'coach') query = query.eq('is_coach', true);
      if (searchKind === 'academy') query = query.eq('role', 'academy');
      if (q) query = query.or(`full_name.ilike.%${q}%,handle.ilike.%${q.replace(/^@/, '')}%`);
      const { data } = await query;
      results = (data || []).map((r) => ({ id: r.id, name: r.full_name, handle: r.handle, avatar_url: r.avatar_url }));
    }
    return NextResponse.json({ results });
  }

  const myKinds = await getMyKinds(admin, user.id);
  const rows = [];
  for (const [type, cfg] of Object.entries(BINDING_TYPES)) {
    for (const [mySide, otherSide] of [[cfg.a, cfg.b], [cfg.b, cfg.a]]) {
      const myId = myKinds[mySide.kind];
      if (!myId) continue;
      const select = cfg.modality ? '*, martial_art:martial_art_id(id, art_name)' : '*';
      const { data } = await admin.from(type).select(select).eq(mySide.field, myId).in('status', ['pending', 'active']);
      for (const r of data || []) {
        // dual-role user bound to themselves can't happen; skip duplicates just in case
        if (rows.some((x) => x.type === type && x.id === r.id)) continue;
        rows.push({
          type,
          id: r.id,
          status: r.status,
          created_at: r.created_at,
          martial_art: r.martial_art || null,
          my_kind: mySide.kind,
          other: { kind: otherSide.kind, id: r[otherSide.field] },
          direction: r.status === 'pending' ? (r.requested_by === user.id ? 'outgoing' : 'incoming') : null,
        });
      }
    }
  }

  const entities = await loadEntities(admin, rows.map((r) => r.other));
  for (const r of rows) Object.assign(r.other, entities[`${r.other.kind}:${r.other.id}`] || { name: '—' });
  rows.sort((x, y) => (y.created_at || '').localeCompare(x.created_at || ''));

  return NextResponse.json({ bindings: rows, my_kinds: Object.keys(myKinds) });
}

// POST /api/bindings
//   { action: 'request', my_kind, target_kind, target_id, martial_art_id? }
//   { action: 'accept' | 'reject' | 'remove', type, id }
export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return err('Não autenticado', 401);
  const admin = getAdminClient();
  if (!admin) return err('Supabase não configurado', 500);

  const body = await request.json().catch(() => ({}));
  const myKinds = await getMyKinds(admin, user.id);

  if (body.action === 'request') {
    const { my_kind, target_kind, target_id, martial_art_id } = body;
    const rule = findRule(my_kind, target_kind);
    if (!rule) return err('Tipo de vínculo não permitido.');
    const myId = myKinds[my_kind];
    if (!myId) return err('Seu perfil não permite este vínculo.', 403);
    if (!target_id || !(await entityExists(admin, target_kind, target_id))) return err('Destinatário não encontrado.');
    if ((await ownerOf(admin, target_kind, target_id)) === user.id) return err('Você não pode se vincular a si mesmo.');

    const cfg = BINDING_TYPES[rule.type];
    const mySide = cfg.a.kind === my_kind ? cfg.a : cfg.b;
    const otherSide = mySide === cfg.a ? cfg.b : cfg.a;
    const row = { [mySide.field]: myId, [otherSide.field]: target_id };

    if (cfg.modality) {
      if (!martial_art_id) return err('Selecione a modalidade.');
      const fighterId = cfg.a.kind === 'fighter' ? row[cfg.a.field] : row[cfg.b.field];
      const { data: art } = await admin.from('fighter_martial_arts').select('id').eq('id', martial_art_id).eq('fighter_id', fighterId).maybeSingle();
      if (!art) return err('Modalidade inválida para este lutador.');
      row.martial_art_id = martial_art_id;

      const { count } = await admin.from(rule.type).select('id', { count: 'exact', head: true })
        .eq('fighter_id', fighterId).eq('martial_art_id', martial_art_id).in('status', ['pending', 'active']);
      if ((count || 0) >= cfg.limitPerModality) {
        return err(`Limite de ${cfg.limitPerModality} vínculos por modalidade atingido para este lutador.`);
      }
    }

    let existingQuery = admin.from(rule.type).select('id, status');
    for (const [k, v] of Object.entries(row)) existingQuery = existingQuery.eq(k, v);
    const { data: existing } = await existingQuery.maybeSingle();

    if (existing && existing.status !== 'rejected') {
      return err(existing.status === 'active' ? 'Este vínculo já está ativo.' : 'Já existe uma solicitação pendente para este vínculo.');
    }
    const { error } = existing
      ? await admin.from(rule.type).update({ status: 'pending', requested_by: user.id }).eq('id', existing.id)
      : await admin.from(rule.type).insert({ ...row, status: 'pending', requested_by: user.id });
    if (error) return err('Erro ao solicitar vínculo: ' + error.message, 500);
    return NextResponse.json({ ok: true });
  }

  if (['accept', 'reject', 'remove'].includes(body.action)) {
    const cfg = BINDING_TYPES[body.type];
    if (!cfg || !body.id) return err('Dados incompletos.');
    const { data: row } = await admin.from(body.type).select('*').eq('id', body.id).maybeSingle();
    if (!row) return err('Vínculo não encontrado.', 404);

    const ownerA = await ownerOf(admin, cfg.a.kind, row[cfg.a.field]);
    const ownerB = await ownerOf(admin, cfg.b.kind, row[cfg.b.field]);
    if (user.id !== ownerA && user.id !== ownerB) return err('Não autorizado.', 403);

    if (body.action === 'remove') {
      // Either side can cancel a pending request or remove an active binding
      const { error } = await admin.from(body.type).delete().eq('id', body.id);
      if (error) return err('Erro ao remover vínculo: ' + error.message, 500);
      return NextResponse.json({ ok: true });
    }

    if (row.status !== 'pending') return err('Esta solicitação já foi respondida.');
    if (row.requested_by === user.id) return err('Apenas a parte solicitada pode responder.', 403);

    const { error } = await admin.from(body.type)
      .update({ status: body.action === 'accept' ? 'active' : 'rejected' })
      .eq('id', body.id);
    if (error) return err('Erro ao responder solicitação: ' + error.message, 500);
    return NextResponse.json({ ok: true });
  }

  return err('Ação inválida.');
}
