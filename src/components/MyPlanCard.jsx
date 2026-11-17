'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/Icon';
import Link from 'next/link';
import { PLANS, formatBRL, formatDate, membershipStatus, accessDeadline, hasAutoRenewal } from '@/lib/plans';

const STATUS_STYLES = {
  none: 'bg-theme-text/5 border-theme-border/20 text-theme-text/50',
  awaiting_payment: 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]',
  active: 'bg-green-500/10 border-green-500/30 text-green-500',
  bonus: 'bg-[#1D9BF0]/10 border-[#1D9BF0]/30 text-[#1D9BF0]',
  expiring: 'bg-orange-500/10 border-orange-500/30 text-orange-500',
  expired: 'bg-red-500/10 border-red-500/30 text-red-500',
  blocked: 'bg-red-500/20 border-red-500/50 text-red-500',
};

// inline: rendered inside the profile header, without its own boxes,
// plan and referral code side by side with a divider between them
export default function MyPlanCard({ profile, inline = false, className = '' }) {
  const [membership, setMembership] = useState(null);
  const [referrals, setReferrals] = useState(0);
  const [rewards, setRewards] = useState([]);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    if (!profile?.id) return;
    const supabase = createClient();
    (async () => {
      const [{ data: m }, { count }, { data: r }] = await Promise.all([
        supabase.from('memberships').select('*').eq('profile_id', profile.id).maybeSingle(),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('referred_by', profile.id),
        supabase.from('referral_rewards').select('reward_type, status, paid_amount').eq('referrer_id', profile.id),
      ]);
      setMembership(m || null);
      setReferrals(count || 0);
      setRewards(r || []);
    })();
  }, [profile?.id]);

  if (!profile?.referral_code) return null;

  const st = membershipStatus(membership);
  const link = typeof window !== 'undefined' ? `${window.location.origin}/auth/register?ref=${profile.referral_code}` : '';
  const paidTotal = rewards.filter((r) => r.status === 'paid').reduce((sum, r) => sum + Number(r.paid_amount || 0), 0);
  const pendingCash = rewards.filter((r) => r.status === 'pending').length;
  const discounts = rewards.filter((r) => r.status === 'granted').length;

  async function copy(text, key) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      prompt('Copie:', text);
    }
  }

  return (
    <div
      className={
        inline
          ? `flex flex-col divide-y divide-theme-border/15 ${className}`
          : `mb-8 grid md:grid-cols-2 gap-4 ${className}`
      }
    >
      {/* Plan */}
      <div className={inline ? 'pb-4 min-w-0' :'bg-gradient-to-br from-dark-card to-dark-card2 rounded-xl p-5 border border-theme-border/10'}>
        <p className="font-barlow-condensed text-xs uppercase tracking-widest text-theme-text/40 mb-2">Meu plano</p>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <p className="font-bebas text-2xl tracking-wider text-theme-text">{PLANS[membership?.plan]?.label || '—'}</p>
          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-barlow-condensed uppercase tracking-wider ${STATUS_STYLES[st.key]}`}>
            {st.label}
          </span>
        </div>
        {membership?.status === 'awaiting_payment' ? (
          <p className="font-barlow text-sm text-theme-text/50">
            Assinatura: <strong className="text-theme-text">{formatBRL(PLANS[membership.plan]?.price)}</strong>/ano no cartão de crédito.
            {accessDeadline(membership) && <> Pague até <strong className="text-[#D4AF37]">{formatDate(accessDeadline(membership))}</strong> para não perder o acesso.</>}
          </p>
        ) : membership ? (
          <>
          {['active', 'bonus', 'expiring'].includes(st.key) ? (
            <p className={`flex items-center gap-1.5 font-barlow text-sm font-semibold mb-1 ${st.key === 'expiring' ? 'text-orange-500' : 'text-green-500'}`}>
              <Icon name="check" size={15} />
              Plano ativo · válido até {formatDate(membership.period_end)}
            </p>
          ) : (
            <p className="flex items-center gap-1.5 font-barlow text-sm font-semibold mb-1 text-red-500">
              Plano vencido em {formatDate(membership.period_end)}
            </p>
          )}
          <p className="font-barlow text-sm text-theme-text/50">
            {membership.is_bonus && '1º ano bônus. '}
            Próxima renovação: <strong className="text-theme-text">{formatBRL(membership.next_renewal_price)}</strong>
            {Number(membership.next_renewal_price) < Number(PLANS[membership.plan]?.price) && ' — desconto por indicação'}
            {hasAutoRenewal(membership) && ' · Renovação automática no cartão ativa.'}
          </p>
          </>
        ) : null}
        {membership && (
          <Link
            href="/assinatura"
            className={`inline-block mt-3 px-3 py-1.5 rounded-lg font-barlow-condensed text-[11px] uppercase tracking-wider ${
              hasAutoRenewal(membership)
                ? 'border border-theme-border/20 text-theme-text/60 hover:bg-theme-text/5'
                : `bg-[#C41E3A] text-white hover:bg-[#d42a46] ${membership.status === 'awaiting_payment' ? 'animate-soft-pulse' : ''}`
            }`}
          >
            {hasAutoRenewal(membership)
              ? 'Gerenciar assinatura'
              : membership.status === 'awaiting_payment' ? 'Pagar agora' : 'Ativar renovação automática'}
          </Link>
        )}
      </div>

      {/* Referral code */}
      <div className={inline ? 'pt-4 min-w-0' :'bg-gradient-to-br from-dark-card to-dark-card2 rounded-xl p-5 border border-[#D4AF37]/20'}>
        <p className="font-barlow-condensed text-xs uppercase tracking-widest text-theme-text/40 mb-2">Meu código de indicação</p>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="font-mono text-2xl tracking-[0.25em] text-[#D4AF37]">{profile.referral_code}</span>
          <button onClick={() => copy(profile.referral_code, 'code')} className="p-1.5 rounded-lg text-theme-text/40 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10" title="Copiar código">
            <Icon name={copied === 'code' ? 'check' : 'link'} size={14} />
          </button>
          <button
            onClick={() => copy(link, 'link')}
            className="ml-auto px-3 py-1.5 rounded-lg border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 font-barlow-condensed text-[11px] uppercase tracking-wider"
          >
            {copied === 'link' ? 'Link copiado!' : 'Copiar link de cadastro'}
          </button>
        </div>
        <p className="font-barlow text-xs text-theme-text/60">
          {referrals} cadastro(s) com seu código
          {pendingCash > 0 && ` · ${pendingCash} comissão(ões) a receber`}
          {paidTotal > 0 && ` · ${formatBRL(paidTotal)} recebido`}
          {discounts > 0 && ` · ${discounts} desconto(s) de renovação disponível(is)`}
        </p>
      </div>
    </div>
  );
}
