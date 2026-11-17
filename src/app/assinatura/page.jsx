'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  PLANS, formatBRL, formatDate, membershipStatus, accessDeadline, hasAutoRenewal, isMembershipBlocked,
  MEMBERSHIP_STATUS_STYLES,
} from '@/lib/plans';

const BTN_PRIMARY = 'w-full py-3 rounded-lg bg-gradient-to-r from-[#C41E3A] to-[#a01830] text-white font-barlow-condensed uppercase tracking-widest text-sm font-semibold hover:from-[#d42a46] hover:to-[#b82040] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed';
const BTN_GHOST = 'w-full py-2.5 rounded-lg border border-theme-border/20 text-theme-text/60 hover:text-theme-text hover:bg-theme-text/5 font-barlow-condensed uppercase tracking-widest text-xs';

export default function AssinaturaPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [returned, setReturned] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load(sync) {
    const res = await fetch(`/api/subscription${sync ? '?sync=1' : ''}`, { cache: 'no-store' });
    if (res.status === 401) {
      router.replace('/auth/login');
      return;
    }
    setData(await res.json());
  }

  useEffect(() => {
    const back = new URLSearchParams(window.location.search).has('preapproval_id');
    setReturned(back);
    load(back);
    if (back) window.history.replaceState(null, '', '/assinatura');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Back from the checkout and still awaiting payment: check Mercado Pago every
  // 30s for up to 15 minutes so the plan is released as soon as it is approved.
  const waiting = returned && data?.membership?.status === 'awaiting_payment';
  useEffect(() => {
    if (!waiting) return undefined;
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (tries > 30) clearInterval(timer);
      else load(true);
    }, 30000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waiting]);

  // Mercado Pago opens in a new tab so the portal stays open here. The tab is
  // opened right on the click (before the fetch) so browsers don't block it.
  async function subscribe() {
    setBusy(true);
    setError('');
    const tab = window.open('', '_blank');
    const res = await fetch('/api/subscription', { method: 'POST' });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.init_point) {
      if (tab && !tab.closed) {
        tab.location.href = json.init_point;
        setReturned(true);
        setBusy(false);
      } else {
        window.location.href = json.init_point;
      }
      return;
    }
    if (tab && !tab.closed) tab.close();
    setError(json.error || 'Não foi possível iniciar o pagamento.');
    setBusy(false);
    load(true);
  }

  // Coming back to this tab (e.g. after paying in the Mercado Pago tab): check right away
  useEffect(() => {
    if (!returned) return undefined;
    const onFocus = () => load(true);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returned]);

  async function cancel() {
    if (!window.confirm('Cancelar a renovação automática? Seu plano continua válido até o fim do período já pago.')) return;
    setBusy(true);
    setError('');
    const res = await fetch('/api/subscription', { method: 'DELETE' });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) setError(json.error || 'Não foi possível cancelar.');
    setBusy(false);
    load(false);
  }

  async function logout() {
    await createClient().auth.signOut();
    router.replace('/');
    router.refresh();
  }

  const m = data?.membership;
  const st = membershipStatus(m);
  const blocked = isMembershipBlocked(m);
  const deadline = accessDeadline(m);
  const autoRenew = hasAutoRenewal(m);
  const awaiting = m?.status === 'awaiting_payment';
  const pendingCheckout = m?.mp_subscription_status === 'pending';

  return (
    <div className="min-h-screen bg-dark-bg flex items-start justify-center px-4">
      <div className="max-w-md w-full mx-auto mt-32 mb-20">
        <div className="bg-gradient-to-br from-dark-card to-dark-card2 rounded-2xl p-8 border border-theme-border/10 shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="font-bebas text-3xl tracking-wider text-theme-text">MEU PLANO</h1>
            <p className="font-barlow text-theme-text/50 text-sm mt-1">Assinatura anual no cartão de crédito</p>
          </div>

          {!data ? (
            <p className="font-barlow text-sm text-theme-text/40 text-center py-6">Carregando...</p>
          ) : !m ? (
            <div className="text-center space-y-4">
              <p className="font-barlow text-sm text-theme-text/60">Sua conta não possui plano pago.</p>
              <Link href="/perfil" className={BTN_GHOST + ' block'}>Ir para o perfil</Link>
            </div>
          ) : (
            <div className="space-y-5">
              {blocked && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="font-barlow text-red-400 text-sm text-center">
                    Seu acesso ao portal está bloqueado por falta de pagamento. Assine o plano para liberar.
                  </p>
                </div>
              )}

              {returned && !awaiting && m.status === 'active' && !m.is_bonus && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <p className="font-barlow text-green-400 text-sm text-center">Pagamento aprovado! Seu plano está ativo.</p>
                </div>
              )}

              {returned && awaiting && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <p className="font-barlow text-green-400 text-sm text-center">
                    Conclua o pagamento na guia do Mercado Pago. Após a aprovação (pode levar até 1 hora) seu plano é ativado automaticamente. Esta página confere sozinha a cada 30 segundos.
                  </p>
                </div>
              )}

              <div className="p-4 rounded-xl bg-theme-text/[0.03] border border-theme-border/10">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <p className="font-bebas text-2xl tracking-wider text-theme-text">{PLANS[m.plan]?.label}</p>
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-barlow-condensed uppercase tracking-wider ${MEMBERSHIP_STATUS_STYLES[st.key]}`}>
                    {st.label}
                  </span>
                </div>
                <p className="font-barlow text-sm text-theme-text/60">
                  {awaiting ? 'Valor da assinatura' : 'Próxima renovação'}:{' '}
                  <strong className="text-theme-text">{formatBRL(data.amount)}</strong>/ano
                </p>
                {!awaiting && m.period_end && (
                  <p className="font-barlow text-sm text-theme-text/60">
                    Válido até <strong className="text-theme-text">{formatDate(m.period_end)}</strong>
                    {m.is_bonus && ' (1º ano bônus)'}
                  </p>
                )}
                {deadline && !blocked && !autoRenew && (awaiting || st.key === 'expired') && (
                  <p className="font-barlow text-sm text-[#D4AF37] mt-1">
                    Pague até {formatDate(deadline)} para não perder o acesso.
                  </p>
                )}
                <p className="font-barlow text-xs text-theme-text/40 mt-2">
                  {autoRenew
                    ? 'Renovação automática ativa: o cartão é cobrado uma vez por ano.'
                    : 'Renovação automática desativada.'}
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="font-barlow text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              {autoRenew ? (
                <button onClick={cancel} disabled={busy} className={BTN_GHOST}>
                  Cancelar renovação automática
                </button>
              ) : (
                <>
                  <button onClick={subscribe} disabled={busy} className={BTN_PRIMARY}>
                    {busy ? 'Abrindo Mercado Pago...' : pendingCheckout ? 'Continuar pagamento' : `Assinar por ${formatBRL(data.amount)}/ano`}
                  </button>
                  <p className="font-barlow text-xs text-theme-text/40 text-center">
                    Pagamento seguro pelo Mercado Pago, só no cartão de crédito. A cobrança se repete a cada 12 meses e pode ser cancelada aqui a qualquer momento.
                    {m.status === 'active' && m.period_end && new Date(m.period_end) > new Date() &&
                      ` A primeira cobrança será em ${formatDate(m.period_end)}.`}
                  </p>
                </>
              )}

              <div className="flex gap-2">
                {!blocked && <Link href="/perfil" className={BTN_GHOST + ' text-center'}>Voltar ao perfil</Link>}
                <button onClick={logout} className={BTN_GHOST}>Sair</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
