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

const PERSON = 'id, full_name, handle, avatar_url, role, referral_code';

// GET ?view=accounts | rewards | history&profile_id=
export async function GET(request) {
  if (!(await verifyAdminSession(request))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'accounts';

  if (view === 'accounts') {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, handle, avatar_url, role, is_fighter, is_coach, status, created_at, referral_code, referral_code_used, referrer:profiles!profiles_referred_by_fkey(id, full_name, referral_code), membership:memberships(*), payments(id, kind, status, amount, created_at)')
      .neq('role', 'admin')
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const accounts = (data || []).map((p) => ({
      ...p,
      membership: Array.isArray(p.membership) ? p.membership[0] || null : p.membership,
      pending_payment: (p.payments || []).find((x) => x.status === 'pending') || null,
      payments: undefined,
    }));
    return NextResponse.json({ accounts });
  }

  if (view === 'rewards') {
    const { data, error } = await supabase
      .from('referral_rewards')
      .select(`*, referrer:profiles!referral_rewards_referrer_id_fkey(${PERSON}), referred:profiles!referral_rewards_referred_id_fkey(${PERSON})`)
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ rewards: data || [] });
  }

  if (view === 'history') {
    const profileId = searchParams.get('profile_id');
    if (!profileId) return NextResponse.json({ error: 'profile_id obrigatório' }, { status: 400 });
    const [events, payments, referrals] = await Promise.all([
      supabase.from('membership_events').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }),
      supabase.from('payments').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, handle, role, created_at').eq('referred_by', profileId).order('created_at', { ascending: false }),
    ]);
    return NextResponse.json({
      events: events.data || [],
      payments: payments.data || [],
      referrals: referrals.data || [],
    });
  }

  return NextResponse.json({ error: 'view inválida' }, { status: 400 });
}

// POST { action: 'confirm_payment', payment_id }
//      { action: 'confirm_renewal', profile_id }
//      { action: 'pay_reward', reward_id, amount }
export async function POST(request) {
  const admin = await verifyAdminSession(request);
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });

  const body = await request.json().catch(() => ({}));
  const actor = admin.name || admin.email || 'Admin';
  let result;

  if (body.action === 'confirm_payment' && body.payment_id) {
    result = await supabase.rpc('admin_confirm_payment', { p_payment_id: body.payment_id, p_actor: actor });
  } else if (body.action === 'confirm_renewal' && body.profile_id) {
    result = await supabase.rpc('admin_confirm_renewal', { p_profile_id: body.profile_id, p_actor: actor });
  } else if (body.action === 'pay_reward' && body.reward_id) {
    const amount = Number(String(body.amount ?? '').replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Informe o valor pago.' }, { status: 400 });
    }
    result = await supabase.rpc('admin_pay_reward', { p_reward_id: body.reward_id, p_amount: amount, p_actor: actor });
  } else {
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
