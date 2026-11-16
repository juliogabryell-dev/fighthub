import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PLANS } from '@/lib/plans';
import {
  getServiceClient, mpFetch, cancelPreapproval, siteUrl, expectedAmount, applyPreapproval, syncSubscriptionAmount,
} from '@/lib/mercadopago';

export const dynamic = 'force-dynamic';

async function context() {
  const auth = await createClient();
  const { data: { user } = {} } = auth ? await auth.auth.getUser() : {};
  if (!user) return { error: NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 }) };
  const supabase = getServiceClient();
  if (!supabase) return { error: NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 }) };
  const { data: membership } = await supabase.from('memberships').select('*').eq('profile_id', user.id).maybeSingle();
  return { user, supabase, membership };
}

async function readMembership(supabase, profileId) {
  const { data } = await supabase.from('memberships').select('*').eq('profile_id', profileId).maybeSingle();
  return data;
}

// GET ?sync=1 — current membership; with sync, refreshes the subscription status
// from Mercado Pago (used when the user comes back from the checkout).
export async function GET(request) {
  const ctx = await context();
  if (ctx.error) return ctx.error;
  const { user, supabase } = ctx;
  let { membership } = ctx;

  const sync = new URL(request.url).searchParams.get('sync');
  if (sync && membership?.mp_preapproval_id) {
    try {
      await applyPreapproval(supabase, await mpFetch(`/preapproval/${membership.mp_preapproval_id}`));
      membership = await readMembership(supabase, user.id);
    } catch (e) {
      console.error('[mercadopago] sync', e.message, e.details);
    }
  }

  let amount = null;
  if (membership) amount = await expectedAmount(supabase, membership);
  return NextResponse.json({ membership, amount, email: user.email });
}

// POST — creates (or reuses) the annual card subscription and returns the checkout URL
export async function POST(request) {
  const ctx = await context();
  if (ctx.error) return ctx.error;
  const { user, supabase, membership: m } = ctx;
  if (!m) return NextResponse.json({ error: 'Sua conta não possui plano pago.' }, { status: 400 });

  try {
    if (m.mp_preapproval_id) {
      const current = await mpFetch(`/preapproval/${m.mp_preapproval_id}`);
      if (current.status === 'authorized') {
        await applyPreapproval(supabase, current);
        return NextResponse.json({ error: 'Você já tem a renovação automática ativa.' }, { status: 409 });
      }
      if (current.status === 'pending' && current.init_point) {
        await syncSubscriptionAmount(supabase, user.id);
        return NextResponse.json({ init_point: current.init_point });
      }
      if (current.status === 'paused') {
        await cancelPreapproval(m.mp_preapproval_id);
      }
    }

    const amount = await expectedAmount(supabase, m);
    const autoRecurring = { frequency: 12, frequency_type: 'months', transaction_amount: amount, currency_id: 'BRL' };
    // Plan still valid (e.g. entity bonus year): first charge only when it ends
    if (m.status === 'active' && m.period_end && new Date(m.period_end) > new Date()) {
      autoRecurring.start_date = new Date(m.period_end).toISOString();
    }

    const pre = await mpFetch('/preapproval', {
      method: 'POST',
      body: {
        reason: `FightLog - ${PLANS[m.plan]?.label || 'Plano'} (anual)`,
        external_reference: user.id,
        payer_email: user.email,
        auto_recurring: autoRecurring,
        back_url: `${siteUrl(request)}/assinatura`,
        status: 'pending',
      },
    });

    await supabase
      .from('memberships')
      .update({ mp_preapproval_id: pre.id, mp_subscription_status: pre.status })
      .eq('profile_id', user.id);

    return NextResponse.json({ init_point: pre.init_point });
  } catch (e) {
    console.error('[mercadopago] criar assinatura', e.message, e.details);
    return NextResponse.json({ error: 'Não foi possível iniciar o pagamento. Tente novamente em instantes.' }, { status: 502 });
  }
}

// DELETE — cancels the automatic renewal (the current period stays valid)
export async function DELETE() {
  const ctx = await context();
  if (ctx.error) return ctx.error;
  const { user, supabase, membership: m } = ctx;
  if (!m?.mp_preapproval_id) return NextResponse.json({ error: 'Nenhuma assinatura encontrada.' }, { status: 400 });

  try {
    const pre = await cancelPreapproval(m.mp_preapproval_id);
    await applyPreapproval(supabase, { ...pre, external_reference: user.id, id: m.mp_preapproval_id });
    return NextResponse.json({ membership: await readMembership(supabase, user.id) });
  } catch (e) {
    console.error('[mercadopago] cancelar assinatura', e.message, e.details);
    return NextResponse.json({ error: 'Não foi possível cancelar agora. Tente novamente.' }, { status: 502 });
  }
}
