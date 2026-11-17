import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminSession } from '@/lib/adminSession';
import { syncSubscriptionAmount, reconcileSubscription, logNotification } from '@/lib/mercadopago';

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
      .select('id, full_name, handle, avatar_url, role, is_fighter, is_coach, status, created_at, referral_code, referral_code_used, referred_by, membership:memberships(*), payments(id, kind, status, amount, created_at)')
      .neq('role', 'admin')
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Referrer resolved here: the self-referencing embed (profiles -> profiles)
    // isn't found by PostgREST's schema cache and made this whole query fail
    const byId = new Map((data || []).map((p) => [p.id, p]));
    const accounts = (data || []).map((p) => ({
      ...p,
      referrer: p.referred_by && byId.get(p.referred_by)
        ? {
          id: p.referred_by,
          full_name: byId.get(p.referred_by).full_name,
          referral_code: byId.get(p.referred_by).referral_code,
        }
        : null,
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

  if (view === 'mp_log') {
    const { data, error } = await supabase
      .from('mp_notifications')
      .select('*, profile:profiles(id, full_name, handle)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ log: data || [] });
  }

  return NextResponse.json({ error: 'view inválida' }, { status: 400 });
}

// Reconciles one account with Mercado Pago and logs the outcome
async function syncAccount(supabase, profileId, actor) {
  try {
    const r = await reconcileSubscription(supabase, profileId);
    const recorded = r.recorded.map((x) => `${x.result} (${x.payment_id})`).join(', ');
    await logNotification(supabase, {
      source: 'sync', type: 'reconcile', profile_id: profileId, status: 'ok',
      result: `${actor}: assinatura ${r.status}${recorded ? ` · registrado: ${recorded}` : ' · nada novo'}`,
    });
    return { ok: true, ...r };
  } catch (e) {
    await logNotification(supabase, { source: 'sync', type: 'reconcile', profile_id: profileId, status: 'error', error: e.message });
    return { ok: false, error: e.message };
  }
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
  } else if (body.action === 'mp_sync' && body.profile_id) {
    const r = await syncAccount(supabase, body.profile_id, actor);
    if (!r.ok) return NextResponse.json({ error: `Mercado Pago: ${r.error}` }, { status: 502 });
    return NextResponse.json(r);
  } else if (body.action === 'mp_sync_all') {
    const { data: list } = await supabase.from('memberships').select('profile_id').not('mp_preapproval_id', 'is', null);
    let recorded = 0;
    let errors = 0;
    for (const row of list || []) {
      const r = await syncAccount(supabase, row.profile_id, actor);
      if (!r.ok) errors += 1;
      else recorded += r.recorded.length;
    }
    return NextResponse.json({ ok: true, checked: (list || []).length, recorded, errors });
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

  // Keep Mercado Pago subscription amounts in line (renewal price / referral discount)
  if (body.action === 'confirm_payment') {
    const { data: pay } = await supabase.from('payments').select('profile_id').eq('id', body.payment_id).maybeSingle();
    if (pay) {
      await syncSubscriptionAmount(supabase, pay.profile_id);
      const { data: p } = await supabase.from('profiles').select('referred_by').eq('id', pay.profile_id).maybeSingle();
      if (p?.referred_by) await syncSubscriptionAmount(supabase, p.referred_by);
    }
  } else if (body.action === 'confirm_renewal') {
    await syncSubscriptionAmount(supabase, body.profile_id);
  }
  return NextResponse.json({ ok: true });
}
