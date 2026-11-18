import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminSession';
import { getServiceClient } from '@/lib/mercadopago';

export const dynamic = 'force-dynamic';

// Portal accounts for the fulladmin (service role, so it doesn't depend on the
// browser being logged in to the portal as an admin profile). Admin profiles
// (role 'admin') are not portal users and are left out.
export async function GET(request) {
  if (!(await verifyAdminSession(request))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  const supabase = getServiceClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .neq('role', 'admin')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data || [] });
}

const ENTITY_TABLES = ['referees', 'teams', 'match_makers', 'federations'];
const EDITABLE = ['full_name', 'role', 'status', 'city', 'state', 'bio', 'is_fighter', 'is_coach'];

// POST { action: 'approve' | 'reject', user_id } | { action: 'edit', user_id, fields }
export async function POST(request) {
  if (!(await verifyAdminSession(request))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  const supabase = getServiceClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });

  const { action, user_id, fields } = await request.json().catch(() => ({}));
  if (!user_id) return NextResponse.json({ error: 'user_id obrigatório' }, { status: 400 });

  if (action === 'approve' || action === 'reject') {
    const status = action === 'approve' ? 'active' : 'rejected';
    const { error } = await supabase.from('profiles').update({ status }).eq('id', user_id).neq('role', 'admin');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await Promise.all(ENTITY_TABLES.map((t) => supabase.from(t).update({ status }).eq('owner_id', user_id)));
    return NextResponse.json({ ok: true });
  }

  if (action === 'edit') {
    const update = Object.fromEntries(Object.entries(fields || {}).filter(([k]) => EDITABLE.includes(k)));
    if (update.role === 'admin') return NextResponse.json({ error: 'Admins são gerenciados na aba Admins' }, { status: 400 });
    const { error } = await supabase.from('profiles').update(update).eq('id', user_id).neq('role', 'admin');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
}
