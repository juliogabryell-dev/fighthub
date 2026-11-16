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

// Days of access kept after sign-up without payment, or after the plan expires
export const GRACE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

// Last moment the account can use the portal, or null when there is no limit
export function accessDeadline(m) {
  if (!m) return null;
  if (m.status === 'awaiting_payment') {
    if (m.grace_until) return new Date(m.grace_until);
    return m.created_at ? new Date(new Date(m.created_at).getTime() + GRACE_DAYS * DAY_MS) : null;
  }
  return m.period_end ? new Date(new Date(m.period_end).getTime() + GRACE_DAYS * DAY_MS) : null;
}

export function isMembershipBlocked(m) {
  const deadline = accessDeadline(m);
  return !!deadline && deadline < new Date();
}

export function hasAutoRenewal(m) {
  return m?.mp_subscription_status === 'authorized';
}

// Display status derived from the membership row
export function membershipStatus(m) {
  if (!m) return { key: 'none', label: 'Sem plano' };
  if (isMembershipBlocked(m)) return { key: 'blocked', label: 'Bloqueado' };
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
  blocked: 'bg-red-500/20 border-red-500/50 text-red-300',
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
  subscription_authorized: 'Assinatura ativada',
  subscription_paused: 'Assinatura pausada',
  subscription_canceled: 'Assinatura cancelada',
  mp_amount_mismatch: 'Valor divergente (MP)',
};
