'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import {
  PLANS, ROLE_LABELS, EVENT_LABELS, MEMBERSHIP_STATUS_STYLES,
  formatBRL, formatDate, formatDateTime, membershipStatus,
} from '@/lib/plans';

const STATUS_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'awaiting_payment', label: 'Aguardando pagamento' },
  { key: 'active', label: 'Ativos' },
  { key: 'bonus', label: '1º ano bônus' },
  { key: 'expiring', label: 'Vencendo' },
  { key: 'expired', label: 'Vencidos' },
];

function accountTypes(a) {
  const types = new Set([a.role]);
  if (a.is_fighter) types.add('fighter');
  if (a.is_coach) types.add('coach');
  return [...types].filter((t) => ROLE_LABELS[t]);
}

async function post(body) {
  const res = await fetch('/api/fulladmin/memberships', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro inesperado');
}

export default function PaymentsManager({ onPendingCount }) {
  const [view, setView] = useState('accounts');
  const [accounts, setAccounts] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [typeFilter, setTypeFilter] = useState([]); // empty = all
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [acc, rew] = await Promise.all([
        fetch('/api/fulladmin/memberships?view=accounts', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/fulladmin/memberships?view=rewards', { cache: 'no-store' }).then((r) => r.json()),
      ]);
      setAccounts(acc.accounts || []);
      setRewards(rew.rewards || []);
      const pendingPayments = (acc.accounts || []).filter((a) => a.pending_payment).length;
      const pendingRewards = (rew.rewards || []).filter((r) => r.status === 'pending').length;
      onPendingCount?.(pendingPayments + pendingRewards);
    } finally {
      setLoading(false);
    }
  }, [onPendingCount]);

  useEffect(() => { load(); }, [load]);

  async function run(key, body, confirmText) {
    if (confirmText && !confirm(confirmText)) return false;
    setBusy(key);
    try {
      await post(body);
      await load();
      return true;
    } catch (e) {
      alert(e.message);
      return false;
    } finally {
      setBusy(null);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase().replace(/^@/, '');
    return accounts.filter((a) => {
      if (typeFilter.length && !accountTypes(a).some((t) => typeFilter.includes(t))) return false;
      if (statusFilter !== 'all' && membershipStatus(a.membership).key !== statusFilter) return false;
      if (q && ![a.full_name, a.handle, a.referral_code, a.referrer?.full_name].some((v) => (v || '').toLowerCase().includes(q))) return false;
      return true;
    });
  }, [accounts, typeFilter, statusFilter, search]);

  const pendingRewards = rewards.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[
          { key: 'accounts', label: 'Cadastros', count: accounts.filter((a) => a.pending_payment).length },
          { key: 'rewards', label: 'Indicações', count: pendingRewards },
        ].map((v) => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`px-4 py-2 rounded-lg font-barlow-condensed text-xs uppercase tracking-wider border transition-all ${
              view === v.key ? 'bg-[#C41E3A]/20 border-[#C41E3A]/50 text-[#C41E3A]' : 'border-white/10 text-white/40 hover:text-white/60'
            }`}
          >
            {v.label}
            {v.count > 0 && <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-[#D4AF37]/20 text-[#D4AF37]">{v.count}</span>}
          </button>
        ))}
        <button onClick={load} className="ml-auto px-3 py-2 rounded-lg border border-white/10 text-white/40 hover:text-white/60 font-barlow-condensed text-xs uppercase tracking-wider">
          Atualizar
        </button>
      </div>

      {view === 'accounts' && (
        <>
          <div className="flex flex-col gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, @handle, código ou quem indicou..."
              className="w-full bg-white/5 border border-white/10 rounded-lg text-white font-barlow text-sm px-4 py-2.5 focus:border-[#C41E3A]/50 outline-none placeholder:text-white/25"
            />
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(ROLE_LABELS).map(([key, label]) => {
                const on = typeFilter.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => setTypeFilter(on ? typeFilter.filter((t) => t !== key) : [...typeFilter, key])}
                    className={`px-3 py-1.5 rounded-lg font-barlow-condensed text-[10px] uppercase tracking-wider border transition-all ${
                      on ? 'bg-white/10 border-white/30 text-white' : 'border-white/5 text-white/30 hover:text-white/50'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
              {typeFilter.length > 0 && (
                <button onClick={() => setTypeFilter([])} className="px-2 font-barlow text-[11px] text-white/30 hover:text-white/60">limpar</button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg font-barlow-condensed text-[10px] uppercase tracking-wider border transition-all ${
                    statusFilter === f.key ? 'bg-[#C41E3A]/15 border-[#C41E3A]/40 text-[#C41E3A]' : 'border-white/5 text-white/30 hover:text-white/50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <p className="font-barlow text-xs text-white/30">{filtered.length} cadastro(s)</p>

          {loading ? (
            <p className="font-barlow text-sm text-white/40 py-8 text-center">Carregando...</p>
          ) : (
            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl border border-white/10 divide-y divide-white/5">
              {filtered.map((a) => {
                const st = membershipStatus(a.membership);
                return (
                  <div key={a.id} className="p-3 flex flex-col lg:flex-row lg:items-center gap-3">
                    <button onClick={() => setDetail(a)} className="flex items-center gap-3 min-w-0 flex-1 text-left group">
                      <Avatar name={a.full_name} url={a.avatar_url} size={36} />
                      <div className="min-w-0">
                        <p className="font-barlow-condensed text-white truncate group-hover:underline">{a.full_name}</p>
                        <p className="font-barlow text-[11px] text-white/35 truncate">
                          {accountTypes(a).map((t) => ROLE_LABELS[t]).join(' · ')}
                          {' · '}Código <span className="font-mono text-white/60">{a.referral_code || '—'}</span>
                          {a.referrer && <> · Indicado por <span className="text-white/60">{a.referrer.full_name}</span></>}
                        </p>
                      </div>
                    </button>
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-barlow-condensed uppercase tracking-wider ${MEMBERSHIP_STATUS_STYLES[st.key]}`}>
                        {st.label}
                      </span>
                      <span className="font-barlow text-[11px] text-white/40 whitespace-nowrap">
                        {a.membership?.period_end ? `até ${formatDate(a.membership.period_end)}` : PLANS[a.membership?.plan]?.label || ''}
                      </span>
                      {a.pending_payment ? (
                        <button
                          disabled={busy === a.id}
                          onClick={() => run(a.id, { action: 'confirm_payment', payment_id: a.pending_payment.id },
                            `Confirmar pagamento de ${formatBRL(a.pending_payment.amount)} do cadastro de ${a.full_name}?`)}
                          className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 font-barlow-condensed text-[11px] uppercase tracking-wider disabled:opacity-40 whitespace-nowrap"
                        >
                          Confirmar pagamento {formatBRL(a.pending_payment.amount)}
                        </button>
                      ) : a.membership?.status === 'active' ? (
                        <button
                          disabled={busy === a.id}
                          onClick={() => run(a.id, { action: 'confirm_renewal', profile_id: a.id },
                            `Confirmar renovação de ${a.full_name} por ${formatBRL(a.membership.next_renewal_price)}?`)}
                          className="px-3 py-1.5 rounded-lg bg-[#1D9BF0]/10 border border-[#1D9BF0]/30 text-[#1D9BF0] hover:bg-[#1D9BF0]/20 font-barlow-condensed text-[11px] uppercase tracking-wider disabled:opacity-40 whitespace-nowrap"
                        >
                          Confirmar renovação {formatBRL(a.membership.next_renewal_price)}
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && <p className="font-barlow text-sm text-white/40 py-8 text-center">Nenhum cadastro encontrado.</p>}
            </div>
          )}
        </>
      )}

      {view === 'rewards' && <RewardsList rewards={rewards} loading={loading} busy={busy} run={run} />}

      {detail && <AccountDetail account={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function RewardsList({ rewards, loading, busy, run }) {
  const [amounts, setAmounts] = useState({});
  const [filter, setFilter] = useState('pending');
  const list = rewards.filter((r) => filter === 'all' || (filter === 'pending' ? r.status === 'pending' : r.status !== 'pending'));

  const STATUS = {
    pending: { label: 'Comissão a pagar', cls: 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]' },
    paid: { label: 'Comissão paga', cls: 'bg-green-500/10 border-green-500/30 text-green-400' },
    granted: { label: 'Desconto na renovação (R$ 114,99)', cls: 'bg-[#1D9BF0]/10 border-[#1D9BF0]/30 text-[#1D9BF0]' },
    used: { label: 'Desconto utilizado', cls: 'bg-white/5 border-white/10 text-white/40' },
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {[{ key: 'pending', label: 'A pagar' }, { key: 'done', label: 'Pagas / descontos' }, { key: 'all', label: 'Todas' }].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg font-barlow-condensed text-[10px] uppercase tracking-wider border ${
              filter === f.key ? 'bg-[#C41E3A]/15 border-[#C41E3A]/40 text-[#C41E3A]' : 'border-white/5 text-white/30 hover:text-white/50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <p className="font-barlow text-xs text-white/30">
        A indicação é gerada quando o pagamento do cadastro indicado é confirmado (renovações não contam).
        Lutador que indica ganha a próxima renovação por R$ 114,99; os demais recebem uma comissão.
      </p>
      {loading ? (
        <p className="font-barlow text-sm text-white/40 py-8 text-center">Carregando...</p>
      ) : (
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl border border-white/10 divide-y divide-white/5">
          {list.map((r) => (
            <div key={r.id} className="p-3 flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-barlow-condensed text-white">
                  {r.referrer?.full_name || '—'}
                  <span className="text-white/30 font-barlow text-xs"> ({ROLE_LABELS[r.referrer?.role] || r.referrer?.role}, código {r.referrer?.referral_code})</span>
                </p>
                <p className="font-barlow text-[11px] text-white/40">
                  Indicou <span className="text-white/60">{r.referred?.full_name || '—'}</span> ({ROLE_LABELS[r.referred?.role] || r.referred?.role})
                  {' · '}gerada em {formatDateTime(r.created_at)}
                  {r.paid_at && <> · {r.status === 'used' ? 'usado' : 'pago'} em {formatDateTime(r.paid_at)}{r.paid_by && ` por ${r.paid_by}`}</>}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-barlow-condensed uppercase tracking-wider ${STATUS[r.status]?.cls}`}>
                  {STATUS[r.status]?.label}
                </span>
                {r.status === 'paid' && <span className="font-barlow-condensed text-green-400">{formatBRL(r.paid_amount)}</span>}
                {r.status === 'pending' && (
                  <>
                    <input
                      inputMode="decimal"
                      value={amounts[r.id] || ''}
                      onChange={(e) => setAmounts({ ...amounts, [r.id]: e.target.value })}
                      placeholder="Valor pago (R$)"
                      className="w-32 bg-white/5 border border-white/10 rounded-lg text-white font-barlow text-sm px-3 py-1.5 outline-none focus:border-green-500/50 placeholder:text-white/25"
                    />
                    <button
                      disabled={busy === r.id || !amounts[r.id]}
                      onClick={() => run(r.id, { action: 'pay_reward', reward_id: r.id, amount: amounts[r.id] },
                        `Marcar comissão de ${r.referrer?.full_name} como paga (R$ ${amounts[r.id]})?`)}
                      className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 font-barlow-condensed text-[11px] uppercase tracking-wider disabled:opacity-40"
                    >
                      Marcar como pago
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {list.length === 0 && <p className="font-barlow text-sm text-white/40 py-8 text-center">Nenhuma indicação nesta lista.</p>}
        </div>
      )}
    </div>
  );
}

function AccountDetail({ account, onClose }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`/api/fulladmin/memberships?view=history&profile_id=${account.id}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then(setData);
  }, [account.id]);

  const m = account.membership;
  const st = membershipStatus(m);

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#12121c] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-5">
          <Avatar name={account.full_name} url={account.avatar_url} size={48} />
          <div className="flex-1 min-w-0">
            <p className="font-bebas text-2xl text-white tracking-wider truncate">{account.full_name}</p>
            <p className="font-barlow text-xs text-white/40">
              {accountTypes(account).map((t) => ROLE_LABELS[t]).join(' · ')} · Código <span className="font-mono text-white/70">{account.referral_code}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/40 hover:text-white"><Icon name="x" size={18} /></button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          {[
            ['Plano', PLANS[m?.plan]?.label || '—'],
            ['Situação', st.label],
            ['Validade', m?.period_end ? formatDate(m.period_end) : '—'],
            ['Próx. renovação', formatBRL(m?.next_renewal_price)],
          ].map(([k, v]) => (
            <div key={k} className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
              <p className="font-barlow-condensed text-[10px] uppercase tracking-widest text-white/30">{k}</p>
              <p className="font-barlow text-sm text-white/80">{v}</p>
            </div>
          ))}
        </div>

        {account.referrer && (
          <p className="font-barlow text-sm text-white/50 mb-4">
            Indicado por <span className="text-white">{account.referrer.full_name}</span> (código {account.referrer.referral_code})
          </p>
        )}

        {!data ? (
          <p className="font-barlow text-sm text-white/40">Carregando histórico...</p>
        ) : (
          <div className="space-y-6">
            <section>
              <h4 className="font-barlow-condensed text-xs uppercase tracking-widest text-[#D4AF37] mb-2">Histórico</h4>
              <ol className="border-l border-white/10 ml-1.5 space-y-3">
                {data.events.map((ev) => (
                  <li key={ev.id} className="pl-4 relative">
                    <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[#C41E3A]" />
                    <p className="font-barlow text-sm text-white/80">
                      <span className="font-barlow-condensed uppercase tracking-wider text-xs text-white/50 mr-2">{EVENT_LABELS[ev.event] || ev.event}</span>
                      {ev.description}
                      {ev.amount != null && <span className="text-green-400"> · {formatBRL(ev.amount)}</span>}
                    </p>
                    <p className="font-barlow text-[11px] text-white/30">{formatDateTime(ev.created_at)}{ev.actor && ` · por ${ev.actor}`}</p>
                  </li>
                ))}
                {data.events.length === 0 && <li className="pl-4 font-barlow text-sm text-white/40">Sem eventos.</li>}
              </ol>
            </section>

            <section>
              <h4 className="font-barlow-condensed text-xs uppercase tracking-widest text-[#D4AF37] mb-2">Pagamentos</h4>
              <div className="divide-y divide-white/5 rounded-lg border border-white/5">
                {data.payments.map((p) => (
                  <div key={p.id} className="px-3 py-2 flex items-center gap-3 font-barlow text-sm">
                    <span className="text-white/70 flex-1">{p.kind === 'registration' ? 'Cadastro' : 'Renovação'}</span>
                    <span className="text-white/80">{formatBRL(p.amount)}</span>
                    <span className={p.status === 'paid' ? 'text-green-400' : 'text-[#D4AF37]'}>{p.status === 'paid' ? 'Pago' : p.status === 'pending' ? 'Pendente' : 'Cancelado'}</span>
                    <span className="text-white/30 text-xs w-40 text-right">{formatDateTime(p.paid_at || p.created_at)}</span>
                  </div>
                ))}
                {data.payments.length === 0 && <p className="px-3 py-2 font-barlow text-sm text-white/40">Nenhum pagamento (entidade no 1º ano bônus).</p>}
              </div>
            </section>

            <section>
              <h4 className="font-barlow-condensed text-xs uppercase tracking-widest text-[#D4AF37] mb-2">Cadastros indicados ({data.referrals.length})</h4>
              <div className="divide-y divide-white/5 rounded-lg border border-white/5">
                {data.referrals.map((r) => (
                  <div key={r.id} className="px-3 py-2 flex items-center gap-3 font-barlow text-sm">
                    <span className="text-white/80 flex-1">{r.full_name}</span>
                    <span className="text-white/40">{ROLE_LABELS[r.role] || r.role}</span>
                    <span className="text-white/30 text-xs">{formatDateTime(r.created_at)}</span>
                  </div>
                ))}
                {data.referrals.length === 0 && <p className="px-3 py-2 font-barlow text-sm text-white/40">Nenhum cadastro com este código ainda.</p>}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
