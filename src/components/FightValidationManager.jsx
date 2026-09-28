'use client';

import { useState, useEffect, useCallback } from 'react';
import Avatar from '@/components/Avatar';
import FightExperienceCard from '@/components/FightExperienceCard';

const FILTERS = [
  { key: 'pending', label: 'Aguardando', color: '#D4AF37' },
  { key: 'validated', label: 'Validadas', color: '#1D9BF0' },
  { key: 'rejected', label: 'Não validadas', color: '#ef4444' },
  { key: 'all', label: 'Todas' },
];

export default function FightValidationManager({ onPendingCount }) {
  const [status, setStatus] = useState('pending');
  const [fights, setFights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [rejecting, setRejecting] = useState(null); // fight id
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/fulladmin/fight-validation?status=${status}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setFights(data.fights || []);
        onPendingCount?.(data.pending_count || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [status, onPendingCount]);

  useEffect(() => { load(); }, [load]);

  async function act(id, action, reason) {
    setBusyId(id);
    try {
      const res = await fetch('/api/fulladmin/fight-validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, note: reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert('Erro: ' + (data.error || 'Erro desconhecido'));
        return;
      }
      setRejecting(null);
      setNote('');
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatus(f.key)}
            className={`px-3 py-2 rounded-lg font-barlow-condensed text-[10px] uppercase tracking-wider border transition-all ${
              status === f.key ? '' : 'text-white/30 border-white/5 hover:text-white/50'
            }`}
            style={status === f.key ? { backgroundColor: `${f.color || '#ffffff'}20`, borderColor: `${f.color || '#ffffff'}50`, color: f.color || '#fff' } : {}}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="font-barlow text-sm text-white/40 py-8 text-center">Carregando...</p>
      ) : fights.length === 0 ? (
        <p className="font-barlow text-sm text-white/40 py-8 text-center">Nenhuma luta nesta lista.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {fights.map((fight) => (
            <div key={fight.id} className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl border border-white/10 p-3 space-y-3">
              <a href={`/lutadores/${fight.fighter?.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                <Avatar name={fight.fighter?.full_name} url={fight.fighter?.avatar_url} size={28} />
                <span className="font-barlow-condensed text-sm text-white">{fight.fighter?.full_name || 'Lutador'}</span>
                {fight.fighter?.handle && <span className="font-barlow text-xs text-white/30">@{fight.fighter.handle}</span>}
              </a>

              <FightExperienceCard fight={fight} />

              {rejecting === fight.id ? (
                <div className="space-y-2">
                  <textarea
                    autoFocus
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Motivo da não validação (visível para o lutador)"
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-lg text-white font-barlow text-sm px-3 py-2 outline-none focus:border-red-500/50"
                  />
                  <div className="flex gap-2">
                    <button
                      disabled={busyId === fight.id || !note.trim()}
                      onClick={() => act(fight.id, 'reject', note)}
                      className="flex-1 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 font-barlow-condensed text-xs uppercase tracking-wider disabled:opacity-40"
                    >
                      Confirmar não validação
                    </button>
                    <button
                      onClick={() => { setRejecting(null); setNote(''); }}
                      className="px-4 py-2 rounded-lg border border-white/10 text-white/50 font-barlow-condensed text-xs uppercase tracking-wider"
                    >
                      Voltar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  {fight.validation_status !== 'validated' && (
                    <button
                      disabled={busyId === fight.id}
                      onClick={() => act(fight.id, 'validate')}
                      className="flex-1 py-2 rounded-lg bg-[#1D9BF0]/10 border border-[#1D9BF0]/30 text-[#1D9BF0] hover:bg-[#1D9BF0]/20 font-barlow-condensed text-xs uppercase tracking-wider disabled:opacity-40"
                    >
                      Validar
                    </button>
                  )}
                  {fight.validation_status !== 'rejected' && (
                    <button
                      disabled={busyId === fight.id}
                      onClick={() => { setRejecting(fight.id); setNote(''); }}
                      className="flex-1 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 font-barlow-condensed text-xs uppercase tracking-wider disabled:opacity-40"
                    >
                      Não validar
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
