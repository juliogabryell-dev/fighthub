'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Modal from '@/components/Modal';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import { KIND_LABELS, REQUEST_RULES, entityHref } from '@/lib/bindings';

const PLURAL = {
  fighter: 'Lutadores', coach: 'Treinadores', academy: 'Academias', team: 'Equipes', federation: 'Federações', match_maker: 'Match Makers',
};

// Request buttons shown on the panel. Fighter coach/academy requests stay in the per-modality UI.
const PANEL_REQUESTS = {
  fighter: ['team'],
  coach: ['fighter', 'academy', 'federation', 'team', 'match_maker'],
  team: ['fighter', 'coach'],
};

export async function bindingAction(body) {
  const res = await fetch('/api/bindings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro inesperado.');
  return data;
}

export default function BindingsPanel({ refreshKey = 0, onChange }) {
  const [bindings, setBindings] = useState([]);
  const [myKinds, setMyKinds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [requestModal, setRequestModal] = useState(null); // { myKind, targetKind }

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/bindings', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setBindings(data.bindings || []);
        setMyKinds(data.my_kinds || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  async function act(b, action) {
    if (action === 'remove' && !confirm(b.status === 'pending' ? 'Cancelar esta solicitação?' : 'Tem certeza que deseja remover este vínculo?')) return;
    setBusyId(b.id);
    try {
      await bindingAction({ action, type: b.type, id: b.id });
      onChange ? onChange() : await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return null;

  const incoming = bindings.filter((b) => b.direction === 'incoming');
  const outgoing = bindings.filter((b) => b.direction === 'outgoing');
  const active = bindings.filter((b) => b.status === 'active');
  const requestButtons = myKinds.flatMap((myKind) =>
    (PANEL_REQUESTS[myKind] || []).map((targetKind) => ({ myKind, targetKind }))
  );
  const multiKind = new Set(requestButtons.map((r) => r.myKind)).size > 1;

  if (!incoming.length && !outgoing.length && !active.length && !requestButtons.length) return null;

  return (
    <div className="mb-8">
      <h3 className="font-bebas text-xl tracking-wider text-theme-text/80 mb-4">VÍNCULOS</h3>

      {requestButtons.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {requestButtons.map(({ myKind, targetKind }) => (
            <button
              key={`${myKind}-${targetKind}`}
              onClick={() => setRequestModal({ myKind, targetKind })}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#C41E3A]/30 text-[#C41E3A] hover:bg-[#C41E3A]/10 font-barlow-condensed text-xs uppercase tracking-wider transition-all"
            >
              <Icon name="plus" size={12} />
              {KIND_LABELS[targetKind]}
              {multiKind && <span className="text-theme-text/30 normal-case">(como {KIND_LABELS[myKind].toLowerCase()})</span>}
            </button>
          ))}
        </div>
      )}

      {incoming.length > 0 && (
        <Group title="Solicitações recebidas" count={incoming.length} highlight>
          {incoming.map((b) => (
            <Row key={b.type + b.id} b={b} subtitle="quer se vincular a você">
              <button disabled={busyId === b.id} onClick={() => act(b, 'accept')} className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 font-barlow-condensed text-xs uppercase tracking-wider disabled:opacity-50">Aceitar</button>
              <button disabled={busyId === b.id} onClick={() => act(b, 'reject')} className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 font-barlow-condensed text-xs uppercase tracking-wider disabled:opacity-50">Recusar</button>
            </Row>
          ))}
        </Group>
      )}

      {outgoing.length > 0 && (
        <Group title="Solicitações enviadas" count={outgoing.length}>
          {outgoing.map((b) => (
            <Row key={b.type + b.id} b={b} subtitle="aguardando resposta">
              <button disabled={busyId === b.id} onClick={() => act(b, 'remove')} className="px-3 py-1.5 rounded-lg border border-theme-border/20 text-theme-text/50 hover:text-red-400 hover:border-red-500/30 font-barlow-condensed text-xs uppercase tracking-wider disabled:opacity-50">Cancelar</button>
            </Row>
          ))}
        </Group>
      )}

      {active.length > 0 && (
        <Group title="Vínculos ativos" count={active.length}>
          {active.map((b) => (
            <Row key={b.type + b.id} b={b}>
              <button disabled={busyId === b.id} onClick={() => act(b, 'remove')} title="Remover vínculo" className="p-1.5 rounded-lg text-theme-text/30 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50">
                <Icon name="x" size={14} />
              </button>
            </Row>
          ))}
        </Group>
      )}

      {requestModal && (
        <RequestModal
          {...requestModal}
          existing={bindings}
          onClose={() => setRequestModal(null)}
          onDone={() => { setRequestModal(null); onChange ? onChange() : load(); }}
        />
      )}
    </div>
  );
}

function Group({ title, count, highlight = false, children }) {
  return (
    <div className={`mb-4 rounded-xl border overflow-hidden ${highlight ? 'border-[#D4AF37]/30 bg-[#D4AF37]/5' : 'border-theme-border/10 bg-gradient-to-br from-dark-card to-dark-card2'}`}>
      <p className={`px-4 py-2.5 font-barlow-condensed text-xs uppercase tracking-widest font-semibold ${highlight ? 'text-[#D4AF37]' : 'text-theme-text/50'}`}>
        {title} <span className="opacity-60">({count})</span>
      </p>
      <div className="divide-y divide-theme-border/5 border-t border-theme-border/5">{children}</div>
    </div>
  );
}

function Row({ b, subtitle, children }) {
  const href = entityHref(b.other.kind, b.other.id);
  const name = (
    <span className="font-barlow-condensed text-theme-text font-semibold truncate">{b.other.name}</span>
  );
  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <Avatar url={b.other.avatar_url} name={b.other.name} size={36} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          {href ? <Link href={`${href}?from=/perfil`} className="hover:underline truncate">{name}</Link> : name}
          <span className="px-2 py-0.5 rounded-full text-[9px] font-barlow-condensed uppercase tracking-wider border border-theme-border/20 text-theme-text/40 shrink-0">
            {KIND_LABELS[b.other.kind]}
          </span>
        </div>
        <p className="font-barlow text-xs text-theme-text/35 truncate">
          {[b.other.handle && `@${b.other.handle}`, b.martial_art?.art_name, subtitle].filter(Boolean).join(' · ')}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">{children}</div>
    </div>
  );
}

function RequestModal({ myKind, targetKind, existing, onClose, onDone }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [arts, setArts] = useState(null);
  const [artId, setArtId] = useState('');
  const [sending, setSending] = useState(false);
  const timer = useRef(null);
  const rule = (REQUEST_RULES[myKind] || []).find((r) => r.targetKind === targetKind);
  const needsModality = rule?.type === 'fighter_coaches' || rule?.type === 'fighter_academies';

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/bindings?search=${targetKind}&q=${encodeURIComponent(q)}`, { cache: 'no-store' });
        const data = await res.json();
        setResults(data.results || []);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer.current);
  }, [q, targetKind]);

  async function choose(item) {
    setSelected(item);
    if (needsModality) {
      // Coach requesting a fighter: pick one of the fighter's modalities
      const { data } = await createClient().from('fighter_martial_arts').select('id, art_name').eq('fighter_id', item.id);
      setArts(data || []);
      setArtId(data?.[0]?.id || '');
    }
  }

  async function send() {
    setSending(true);
    try {
      await bindingAction({ action: 'request', my_kind: myKind, target_kind: targetKind, target_id: selected.id, martial_art_id: artId || undefined });
      alert('Solicitação enviada! O vínculo ficará ativo quando a outra parte aceitar.');
      onDone();
    } catch (e) {
      alert(e.message);
    } finally {
      setSending(false);
    }
  }

  const already = (item) => existing.some((b) => b.type === rule?.type && b.other.id === item.id && !needsModality);

  return (
    <Modal onClose={onClose} title={`Solicitar vínculo — ${KIND_LABELS[targetKind]}`}>
      {!selected ? (
        <div className="space-y-3">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Buscar ${PLURAL[targetKind].toLowerCase()} por nome ou @handle`}
            className="w-full bg-theme-text/5 border border-theme-border/10 rounded-lg text-theme-text font-barlow text-sm px-3.5 py-2.5 focus:border-brand-red/50 outline-none placeholder:text-theme-text/25"
          />
          <div className="max-h-80 overflow-y-auto divide-y divide-theme-border/5">
            {searching && results.length === 0 && <p className="py-4 text-center font-barlow text-sm text-theme-text/40">Buscando...</p>}
            {!searching && results.length === 0 && <p className="py-4 text-center font-barlow text-sm text-theme-text/40">Nenhum resultado.</p>}
            {results.map((item) => {
              const isLinked = already(item);
              return (
                <button
                  key={item.id}
                  disabled={isLinked}
                  onClick={() => choose(item)}
                  className="w-full flex items-center gap-3 py-2.5 px-1 text-left hover:bg-theme-text/5 rounded-lg disabled:opacity-40"
                >
                  <Avatar url={item.avatar_url} name={item.name} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="font-barlow-condensed text-theme-text font-semibold truncate">{item.name}</p>
                    {item.handle && <p className="font-barlow text-xs text-theme-text/35">@{item.handle}</p>}
                  </div>
                  <span className="font-barlow-condensed text-xs uppercase tracking-wider text-theme-text/40">{isLinked ? 'Já vinculado' : 'Selecionar'}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-theme-text/5">
            <Avatar url={selected.avatar_url} name={selected.name} size={36} />
            <p className="flex-1 font-barlow-condensed text-theme-text font-semibold">{selected.name}</p>
            <button onClick={() => { setSelected(null); setArts(null); }} className="font-barlow text-xs text-theme-text/40 hover:underline">Trocar</button>
          </div>
          {needsModality && arts && (
            arts.length === 0 ? (
              <p className="font-barlow text-sm text-theme-text/50">Este lutador ainda não cadastrou modalidades.</p>
            ) : (
              <div>
                <label className="block uppercase text-xs tracking-wider text-theme-text/50 font-barlow-condensed font-semibold mb-1.5">Modalidade</label>
                <select
                  value={artId}
                  onChange={(e) => setArtId(e.target.value)}
                  className="w-full bg-dark-card border border-theme-border/10 rounded-lg px-4 py-3 text-theme-text font-barlow text-sm focus:outline-none focus:border-[#C41E3A]/50"
                >
                  {arts.map((a) => <option key={a.id} value={a.id} className="bg-dark-card text-theme-text">{a.art_name}</option>)}
                </select>
              </div>
            )
          )}
          <p className="font-barlow text-xs text-theme-text/40">
            {selected.name} receberá sua solicitação e precisará aceitá-la para o vínculo ficar ativo.
          </p>
          <button
            onClick={send}
            disabled={sending || (needsModality && !artId)}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-[#C41E3A] to-[#a01830] text-white font-barlow-condensed uppercase tracking-widest text-sm font-semibold disabled:opacity-50"
          >
            {sending ? 'ENVIANDO...' : 'ENVIAR SOLICITAÇÃO'}
          </button>
        </div>
      )}
    </Modal>
  );
}
