'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';

const BINDING_TYPES = [
  { key: 'fighter_coaches', label: 'Lutador → Treinador', color: '#D4AF37', table: 'fighter_coaches', fromField: 'fighter_id', toField: 'coach_id', fromLabel: 'Lutador', toLabel: 'Treinador', fromRole: 'is_fighter', toRole: 'is_coach', hasMA: true },
  { key: 'fighter_academies', label: 'Lutador → Academia', color: '#3b82f6', table: 'fighter_academies', fromField: 'fighter_id', toField: 'academy_id', fromLabel: 'Lutador', toLabel: 'Academia', fromRole: 'is_fighter', toRole: null, toRoleField: 'academy', hasMA: true },
  { key: 'team_fighters', label: 'Equipe → Lutador', color: '#06b6d4', table: 'team_fighters', fromField: 'team_id', toField: 'fighter_id', fromLabel: 'Equipe', toLabel: 'Lutador', fromTable: 'teams', fromNameField: 'name' },
  { key: 'federation_referees', label: 'Federação → Árbitro', color: '#10b981', table: 'federation_referees', fromField: 'federation_id', toField: 'referee_id', fromLabel: 'Federação', toLabel: 'Árbitro', fromTable: 'federations', fromNameField: 'official_name', toTable: 'referees' },
  { key: 'federation_teams', label: 'Federação → Equipe', color: '#10b981', table: 'federation_teams', fromField: 'federation_id', toField: 'team_id', fromLabel: 'Federação', toLabel: 'Equipe', fromTable: 'federations', fromNameField: 'official_name', toTable: 'teams', toNameField: 'name' },
  { key: 'match_maker_athletes', label: 'Match Maker → Lutador', color: '#f59e0b', table: 'match_maker_athletes', fromField: 'match_maker_id', toField: 'fighter_id', fromLabel: 'Match Maker', toLabel: 'Lutador', fromTable: 'match_makers', toTable: null },
  { key: 'match_maker_teams', label: 'Match Maker → Equipe', color: '#f59e0b', table: 'match_maker_teams', fromField: 'match_maker_id', toField: 'team_id', fromLabel: 'Match Maker', toLabel: 'Equipe', fromTable: 'match_makers', toTable: 'teams', toNameField: 'name' },
  { key: 'match_maker_federations', label: 'Match Maker → Federação', color: '#f59e0b', table: 'match_maker_federations', fromField: 'match_maker_id', toField: 'federation_id', fromLabel: 'Match Maker', toLabel: 'Federação', fromTable: 'match_makers', toTable: 'federations', toNameField: 'official_name' },
];

export default function BindingsManager() {
  const supabase = createClient();
  const [activeType, setActiveType] = useState('fighter_coaches');
  const [bindings, setBindings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchBindings = useCallback(async () => {
    setLoading(true);
    const bt = BINDING_TYPES.find((b) => b.key === activeType);
    if (!bt) return;

    let query;

    if (bt.key === 'fighter_coaches') {
      query = supabase.from(bt.table)
        .select('*, fighter:fighter_id(id, full_name, handle, avatar_url), coach:coach_id(id, full_name, handle, avatar_url), martial_art:martial_art_id(id, art_name)')
        .order('created_at', { ascending: false });
    } else if (bt.key === 'fighter_academies') {
      query = supabase.from(bt.table)
        .select('*, fighter:fighter_id(id, full_name, handle, avatar_url), academy:academy_id(id, full_name, handle, avatar_url), martial_art:martial_art_id(id, art_name)')
        .order('created_at', { ascending: false });
    } else if (bt.key === 'team_fighters') {
      query = supabase.from(bt.table)
        .select('*, team:team_id(id, name, owner:owner_id(full_name, avatar_url)), fighter:fighter_id(id, full_name, handle, avatar_url)')
        .order('created_at', { ascending: false });
    } else if (bt.key === 'federation_referees') {
      query = supabase.from(bt.table)
        .select('*, federation:federation_id(id, official_name), referee:referee_id(id, owner:owner_id(full_name, avatar_url))')
        .order('created_at', { ascending: false });
    } else if (bt.key === 'federation_teams') {
      query = supabase.from(bt.table)
        .select('*, federation:federation_id(id, official_name), team:team_id(id, name)')
        .order('created_at', { ascending: false });
    } else if (bt.key === 'match_maker_athletes') {
      query = supabase.from(bt.table)
        .select('*, match_maker:match_maker_id(id, owner:owner_id(full_name, avatar_url)), fighter:fighter_id(id, full_name, handle, avatar_url)')
        .order('created_at', { ascending: false });
    } else if (bt.key === 'match_maker_teams') {
      query = supabase.from(bt.table)
        .select('*, match_maker:match_maker_id(id, owner:owner_id(full_name, avatar_url)), team:team_id(id, name)')
        .order('created_at', { ascending: false });
    } else if (bt.key === 'match_maker_federations') {
      query = supabase.from(bt.table)
        .select('*, match_maker:match_maker_id(id, owner:owner_id(full_name, avatar_url)), federation:federation_id(id, official_name)')
        .order('created_at', { ascending: false });
    }

    const { data } = await query;
    setBindings(data || []);
    setLoading(false);
  }, [supabase, activeType]);

  useEffect(() => {
    fetchBindings();
  }, [fetchBindings]);

  async function handleStatusChange(bindingId, newStatus) {
    setActionLoading(bindingId);
    const bt = BINDING_TYPES.find((b) => b.key === activeType);
    try {
      const res = await fetch('/api/fulladmin/update-binding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: bt.table, binding_id: bindingId, new_status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert('Erro: ' + (data.error || 'Erro desconhecido'));
      }
    } catch {
      alert('Erro ao atualizar vínculo.');
    }
    await fetchBindings();
    setActionLoading(null);
  }

  async function handleDelete(bindingId) {
    if (!confirm('Excluir este vínculo permanentemente?')) return;
    setActionLoading(bindingId);
    const bt = BINDING_TYPES.find((b) => b.key === activeType);
    try {
      const res = await fetch('/api/fulladmin/update-binding', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: bt.table, binding_id: bindingId }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert('Erro: ' + (data.error || 'Erro desconhecido'));
      }
    } catch {
      alert('Erro ao excluir vínculo.');
    }
    await fetchBindings();
    setActionLoading(null);
  }

  function getBindingNames(b) {
    const bt = BINDING_TYPES.find((t) => t.key === activeType);
    let fromName = '', toName = '', fromAvatar = null, toAvatar = null;

    if (activeType === 'fighter_coaches') {
      fromName = b.fighter?.full_name || 'Lutador'; toName = b.coach?.full_name || 'Treinador';
      fromAvatar = b.fighter?.avatar_url; toAvatar = b.coach?.avatar_url;
    } else if (activeType === 'fighter_academies') {
      fromName = b.fighter?.full_name || 'Lutador'; toName = b.academy?.full_name || 'Academia';
      fromAvatar = b.fighter?.avatar_url; toAvatar = b.academy?.avatar_url;
    } else if (activeType === 'team_fighters') {
      fromName = b.team?.name || 'Equipe'; toName = b.fighter?.full_name || 'Lutador';
      fromAvatar = b.team?.owner?.avatar_url; toAvatar = b.fighter?.avatar_url;
    } else if (activeType === 'federation_referees') {
      fromName = b.federation?.official_name || 'Federação'; toName = b.referee?.owner?.full_name || 'Árbitro';
      toAvatar = b.referee?.owner?.avatar_url;
    } else if (activeType === 'federation_teams') {
      fromName = b.federation?.official_name || 'Federação'; toName = b.team?.name || 'Equipe';
    } else if (activeType === 'match_maker_athletes') {
      fromName = b.match_maker?.owner?.full_name || 'Match Maker'; toName = b.fighter?.full_name || 'Lutador';
      fromAvatar = b.match_maker?.owner?.avatar_url; toAvatar = b.fighter?.avatar_url;
    } else if (activeType === 'match_maker_teams') {
      fromName = b.match_maker?.owner?.full_name || 'Match Maker'; toName = b.team?.name || 'Equipe';
      fromAvatar = b.match_maker?.owner?.avatar_url;
    } else if (activeType === 'match_maker_federations') {
      fromName = b.match_maker?.owner?.full_name || 'Match Maker'; toName = b.federation?.official_name || 'Federação';
      fromAvatar = b.match_maker?.owner?.avatar_url;
    }

    const extra = b.martial_art?.art_name || null;
    return { fromName, toName, fromAvatar, toAvatar, extra, fromLabel: bt.fromLabel, toLabel: bt.toLabel };
  }

  const STATUS_STYLES = {
    active: 'bg-green-500/10 border-green-500/30 text-green-400',
    pending: 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]',
    rejected: 'bg-red-500/10 border-red-500/30 text-red-400',
  };

  const bt = BINDING_TYPES.find((b) => b.key === activeType);

  return (
    <div className="space-y-4">
      {/* Type selector */}
      <div className="flex flex-wrap gap-1.5">
        {BINDING_TYPES.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveType(t.key)}
            className={`px-3 py-1.5 rounded-lg font-barlow-condensed text-[10px] uppercase tracking-wider border transition-all ${
              activeType === t.key
                ? 'text-white border-white/30'
                : 'text-white/30 border-white/5 hover:text-white/50'
            }`}
            style={activeType === t.key ? { backgroundColor: `${t.color}20`, borderColor: `${t.color}50`, color: t.color } : {}}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Bindings list */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center gap-3">
          <h2 className="font-bebas text-xl tracking-wider text-white">{bt?.label}</h2>
          <span className="px-2 py-0.5 rounded-full font-barlow-condensed text-xs font-semibold border" style={{ backgroundColor: `${bt?.color}20`, borderColor: `${bt?.color}40`, color: bt?.color }}>
            {bindings.length}
          </span>
        </div>

        {loading ? (
          <div className="p-10 flex justify-center">
            <svg className="animate-spin h-8 w-8 text-[#C41E3A]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : bindings.length > 0 ? (
          <div className="divide-y divide-white/5">
            {bindings.map((b) => {
              const { fromName, toName, fromAvatar, toAvatar, extra, fromLabel, toLabel } = getBindingNames(b);
              return (
                <div key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Avatar name={fromName} url={fromAvatar} size={30} />
                      <div className="min-w-0">
                        <p className="font-barlow-condensed text-white font-semibold text-sm truncate">{fromName}</p>
                        <p className="font-barlow text-white/25 text-[10px]">{fromLabel}</p>
                      </div>
                    </div>
                    <span className="text-white/20 text-xs">→</span>
                    <div className="flex items-center gap-2">
                      <Avatar name={toName} url={toAvatar} size={30} />
                      <div className="min-w-0">
                        <p className="font-barlow-condensed text-white font-semibold text-sm truncate">{toName}</p>
                        <p className="font-barlow text-white/25 text-[10px]">{toLabel}</p>
                      </div>
                    </div>
                    {extra && (
                      <span className="px-2 py-0.5 rounded-full bg-[#C41E3A]/10 text-[#C41E3A] font-barlow-condensed text-[10px] border border-[#C41E3A]/20">
                        {extra}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-barlow-condensed uppercase tracking-wider border ${STATUS_STYLES[b.status] || STATUS_STYLES.pending}`}>
                      {b.status === 'active' ? 'Ativo' : b.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {b.status !== 'active' && (
                      <button onClick={() => handleStatusChange(b.id, 'active')} disabled={actionLoading === b.id}
                        className="px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-all font-barlow-condensed text-[10px] uppercase tracking-wider disabled:opacity-50">
                        {actionLoading === b.id ? '...' : 'Ativar'}
                      </button>
                    )}
                    {b.status !== 'rejected' && b.status !== 'active' && (
                      <button onClick={() => handleStatusChange(b.id, 'rejected')} disabled={actionLoading === b.id}
                        className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all font-barlow-condensed text-[10px] uppercase tracking-wider disabled:opacity-50">
                        {actionLoading === b.id ? '...' : 'Rejeitar'}
                      </button>
                    )}
                    {b.status === 'active' && (
                      <button onClick={() => handleStatusChange(b.id, 'pending')} disabled={actionLoading === b.id}
                        className="px-2.5 py-1 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all font-barlow-condensed text-[10px] uppercase tracking-wider disabled:opacity-50">
                        {actionLoading === b.id ? '...' : 'Suspender'}
                      </button>
                    )}
                    <button onClick={() => handleDelete(b.id)} disabled={actionLoading === b.id}
                      className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-red-400 hover:border-red-400/30 transition-all font-barlow-condensed text-[10px] uppercase tracking-wider disabled:opacity-50">
                      <Icon name="x" size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-10 text-center">
            <p className="font-barlow text-white/40 text-sm">Nenhum vínculo encontrado para este tipo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
