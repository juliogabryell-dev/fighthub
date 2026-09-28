import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminSession } from '@/lib/adminSession';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// GET ?status=pending|validated|rejected|all -> fights to review
export async function GET(request) {
  if (!(await verifyAdminSession(request))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });

  const status = new URL(request.url).searchParams.get('status') || 'pending';
  let query = supabase
    .from('fight_experiences')
    .select('*, fighter:fighter_id(id, full_name, handle, avatar_url)')
    .order('created_at', { ascending: status === 'pending' })
    .limit(200);
  if (status !== 'all') query = query.eq('validation_status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { count } = await supabase
    .from('fight_experiences')
    .select('id', { count: 'exact', head: true })
    .eq('validation_status', 'pending');

  return NextResponse.json({ fights: data || [], pending_count: count || 0 });
}

// POST { id, action: 'validate' | 'reject', note? }
export async function POST(request) {
  if (!(await verifyAdminSession(request))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });

  const { id, action, note } = await request.json().catch(() => ({}));
  if (!id || !['validate', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
  }
  if (action === 'reject' && !note?.trim()) {
    return NextResponse.json({ error: 'Informe o motivo da não validação.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('fight_experiences')
    .update({
      validation_status: action === 'validate' ? 'validated' : 'rejected',
      validation_note: action === 'reject' ? note.trim() : null,
      validated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
