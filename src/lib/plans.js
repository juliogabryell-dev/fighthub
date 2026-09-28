// Plan prices — keep in sync with plan_price() in supabase/migration_plans_referrals.sql
export const PLANS = {
  lutador: { label: 'Plano Lutador', price: 129.99, referralRenewalPrice: 114.99 },
  entidade: { label: 'Plano Entidade Oficial', price: 499 },
};

export const ROLE_LABELS = {
  fighter: 'Lutador',
  coach: 'Treinador',
  referee: 'Árbitro',
  match_maker: 'Match Maker',
  academy: 'Academia',
  team: 'Equipe',
  federation: 'Federação',
};

export function formatBRL(value) {
  if (value === null || value === undefined || value === '') return '—';
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR');
}

// Display status derived from the membership row
export function membershipStatus(m) {
  if (!m) return { key: 'none', label: 'Sem plano' };
  if (m.status === 'awaiting_payment') return { key: 'awaiting_payment', label: 'Aguardando pagamento' };
  const end = m.period_end ? new Date(m.period_end) : null;
  if (end && end < new Date()) return { key: 'expired', label: 'Vencido' };
  if (end && end - new Date() < 30 * 24 * 60 * 60 * 1000) return { key: 'expiring', label: 'Vence em até 30 dias' };
  if (m.is_bonus) return { key: 'bonus', label: '1º ano bônus' };
  return { key: 'active', label: 'Ativo' };
}

export const MEMBERSHIP_STATUS_STYLES = {
  none: 'bg-white/5 border-white/10 text-white/40',
  awaiting_payment: 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]',
  active: 'bg-green-500/10 border-green-500/30 text-green-400',
  bonus: 'bg-[#1D9BF0]/10 border-[#1D9BF0]/30 text-[#1D9BF0]',
  expiring: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
  expired: 'bg-red-500/10 border-red-500/30 text-red-400',
};

export const EVENT_LABELS = {
  registered: 'Cadastro',
  referred: 'Indicação',
  bonus_started: '1º ano bônus',
  payment_confirmed: 'Pagamento confirmado',
  renewal_confirmed: 'Renovação confirmada',
  discount_granted: 'Desconto de indicação',
  reward_created: 'Comissão gerada',
  reward_paid: 'Comissão paga',
};
