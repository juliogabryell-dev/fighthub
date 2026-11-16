// Mercado Pago subscriptions (preapproval) — server only.
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { PLANS } from '@/lib/plans';

const API = 'https://api.mercadopago.com';

export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export function siteUrl(request) {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, '');
  return new URL(request.url).origin;
}

export async function mpFetch(path, { method = 'GET', body } = {}) {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error('MP_ACCESS_TOKEN não configurado');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  if (method === 'POST') headers['X-Idempotency-Key'] = crypto.randomUUID();
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `Mercado Pago respondeu ${res.status}`);
    err.status = res.status;
    err.details = data;
    throw err;
  }
  return data;
}

// The docs spell it "canceled" in places and the API returns "cancelled": try both
export async function cancelPreapproval(id) {
  try {
    return await mpFetch(`/preapproval/${id}`, { method: 'PUT', body: { status: 'cancelled' } });
  } catch (e) {
    if (e.status !== 400) throw e;
    return mpFetch(`/preapproval/${id}`, { method: 'PUT', body: { status: 'canceled' } });
  }
}

// x-signature: "ts=...,v1=<hmac>" ; manifest "id:<data.id>;request-id:<x-request-id>;ts:<ts>;"
export function verifyWebhookSignature(headers, dataId) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[mercadopago] MP_WEBHOOK_SECRET não configurado — notificação recusada');
    return false;
  }
  const signature = headers.get('x-signature') || '';
  const requestId = headers.get('x-request-id') || '';
  const parts = Object.fromEntries(
    signature.split(',').map((p) => p.split('=').map((s) => s.trim())).filter((p) => p.length === 2)
  );
  if (!parts.ts || !parts.v1) return false;

  const id = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
  let manifest = `id:${id};`;
  if (requestId) manifest += `request-id:${requestId};`;
  manifest += `ts:${parts.ts};`;

  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(parts.v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Amount the subscription must charge next, from the database
export async function expectedAmount(supabase, membership) {
  if (membership.status === 'awaiting_payment') {
    const { data } = await supabase
      .from('payments')
      .select('amount')
      .eq('profile_id', membership.profile_id)
      .eq('kind', 'registration')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return Number(data?.amount ?? PLANS[membership.plan]?.price);
  }
  return Number(membership.next_renewal_price);
}

// Keeps the subscription amount equal to what the next charge should be
// (registration price, full renewal or R$ 114,99 with a referral discount).
export async function syncSubscriptionAmount(supabase, profileId) {
  try {
    const { data: m } = await supabase.from('memberships').select('*').eq('profile_id', profileId).maybeSingle();
    if (!m?.mp_preapproval_id || !['authorized', 'pending'].includes(m.mp_subscription_status)) return;
    const target = await expectedAmount(supabase, m);
    const pre = await mpFetch(`/preapproval/${m.mp_preapproval_id}`);
    if (Math.abs(Number(pre.auto_recurring?.transaction_amount) - target) < 0.01) return;
    await mpFetch(`/preapproval/${m.mp_preapproval_id}`, {
      method: 'PUT',
      body: { auto_recurring: { transaction_amount: target, currency_id: 'BRL' } },
    });
  } catch (e) {
    console.error('[mercadopago] falha ao ajustar valor da assinatura', profileId, e.message, e.details);
  }
}

const STATUS_EVENTS = {
  authorized: ['subscription_authorized', 'Renovação automática no cartão ativada'],
  paused: ['subscription_paused', 'Assinatura pausada no Mercado Pago'],
  cancelled: ['subscription_canceled', 'Assinatura cancelada'],
  canceled: ['subscription_canceled', 'Assinatura cancelada'],
};

// Stores the subscription status (only for the subscription linked to the account)
export async function applyPreapproval(supabase, pre) {
  const profileId = pre.external_reference;
  if (!profileId) return;
  const { data: m } = await supabase
    .from('memberships')
    .select('profile_id, mp_preapproval_id, mp_subscription_status')
    .eq('profile_id', profileId)
    .maybeSingle();
  if (!m || m.mp_preapproval_id !== pre.id) return;
  if (m.mp_subscription_status === pre.status) return;

  await supabase.from('memberships').update({ mp_subscription_status: pre.status }).eq('profile_id', profileId);
  const ev = STATUS_EVENTS[pre.status];
  if (ev) {
    await supabase.from('membership_events').insert({
      profile_id: profileId, event: ev[0], description: ev[1], actor: 'Mercado Pago',
    });
  }
}

// Records an approved recurring charge
export async function applyAuthorizedPayment(supabase, ap) {
  const payment = ap.payment || {};
  if (payment.status !== 'approved' || !payment.id || !ap.preapproval_id) return 'ignored';

  const pre = await mpFetch(`/preapproval/${ap.preapproval_id}`);
  const profileId = pre.external_reference;
  if (!profileId) return 'ignored';

  const { data: result, error } = await supabase.rpc('mp_record_charge', {
    p_profile_id: profileId,
    p_mp_payment_id: String(payment.id),
    p_amount: Number(ap.transaction_amount),
  });
  if (error) throw new Error(error.message);
  if (result === 'duplicate') return result;

  await applyPreapproval(supabase, pre);
  await syncSubscriptionAmount(supabase, profileId);
  // A registration may have granted the referrer a renewal discount
  if (result === 'registration') {
    const { data: p } = await supabase.from('profiles').select('referred_by').eq('id', profileId).maybeSingle();
    if (p?.referred_by) await syncSubscriptionAmount(supabase, p.referred_by);
  }
  return result;
}
