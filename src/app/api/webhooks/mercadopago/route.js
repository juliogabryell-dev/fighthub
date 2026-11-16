import { NextResponse } from 'next/server';
import {
  getServiceClient, mpFetch, verifyWebhookSignature, applyPreapproval, applyAuthorizedPayment,
} from '@/lib/mercadopago';

export const dynamic = 'force-dynamic';

// Mercado Pago notifications. The body is only a trigger: every state change
// comes from a fresh GET to the Mercado Pago API with our access token.
export async function POST(request) {
  const url = new URL(request.url);
  const body = await request.json().catch(() => ({}));
  const type = body.type || url.searchParams.get('type') || url.searchParams.get('topic');
  const dataId = String(url.searchParams.get('data.id') || body?.data?.id || '');

  if (!dataId) return NextResponse.json({ ok: true, ignored: 'sem data.id' });
  if (!verifyWebhookSignature(request.headers, dataId)) {
    console.warn('[mercadopago] assinatura inválida', { type, dataId });
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
  }

  const supabase = getServiceClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });

  try {
    if (type === 'subscription_preapproval') {
      const pre = await mpFetch(`/preapproval/${dataId}`);
      await applyPreapproval(supabase, pre);
    } else if (type === 'subscription_authorized_payment') {
      const ap = await mpFetch(`/authorized_payments/${dataId}`);
      const result = await applyAuthorizedPayment(supabase, ap);
      console.log('[mercadopago] cobrança', dataId, result);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    // 500 makes Mercado Pago retry later
    console.error('[mercadopago] erro ao processar notificação', { type, dataId }, e.message, e.details);
    return NextResponse.json({ error: 'Falha ao processar' }, { status: 500 });
  }
}
