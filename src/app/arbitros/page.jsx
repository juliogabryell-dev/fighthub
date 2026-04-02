'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import Link from 'next/link';

export default function ArbitrosPage() {
  const supabase = createClient();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from('referees')
        .select('*, owner:owner_id(full_name, handle, avatar_url), federation:federation_id(official_name, abbreviation)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      setItems(data || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const term = search.toLowerCase().trim();
  const filtered = term
    ? items.filter((r) =>
        r.owner?.full_name?.toLowerCase().includes(term) ||
        r.license_number?.toLowerCase().includes(term) ||
        r.city?.toLowerCase().includes(term) ||
        r.owner?.handle?.toLowerCase().includes(term.replace(/^@/, '')))
    : items;

  const LEVEL_LABELS = { regional: 'Regional', nacional: 'Nacional', internacional: 'Internacional' };
  const LEVEL_COLORS = {
    regional: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    nacional: 'bg-brand-gold/10 border-brand-gold/20 text-brand-gold',
    internacional: 'bg-green-500/10 border-green-500/20 text-green-400',
  };

  return (
    <main className="min-h-screen px-6 py-16 max-w-7xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="font-bebas text-4xl sm:text-5xl text-theme-text tracking-wider">
          ÁRBI<span className="text-brand-red">TROS</span>
        </h1>
        <p className="font-barlow text-theme-text/50 mt-2">Árbitros e juízes cadastrados na plataforma</p>
      </div>

      <div className="max-w-md mx-auto mb-10">
        <input
          type="text" placeholder="Buscar por nome, registro ou @handle..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-theme-text/5 border border-theme-border/10 rounded-lg text-theme-text font-barlow text-sm px-4 py-3 focus:border-brand-red/50 outline-none transition-colors placeholder:text-theme-text/25"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <svg className="animate-spin h-10 w-10 text-brand-red" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <Link key={item.id} href={`/arbitros/${item.id}`}>
              <div className="card-hover bg-gradient-to-b from-dark-card to-dark-card2 rounded-xl border border-theme-border/5 p-5 transition-all duration-300 hover:border-brand-red/30 group">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={item.owner?.full_name} url={item.logo_url || item.owner?.avatar_url} size={48} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bebas text-xl text-theme-text tracking-wide truncate group-hover:text-brand-red transition-colors">
                      {item.owner?.full_name}
                    </h3>
                    {item.owner?.handle && <p className="text-xs text-theme-text/40 font-barlow truncate">@{item.owner.handle}</p>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {item.level && (
                    <span className={`text-[10px] border rounded-full px-2 py-0.5 font-barlow-condensed uppercase tracking-wider ${LEVEL_COLORS[item.level] || ''}`}>
                      {LEVEL_LABELS[item.level]}
                    </span>
                  )}
                  {item.license_number && (
                    <span className="text-[10px] bg-theme-text/5 border border-theme-border/10 rounded-full px-2 py-0.5 text-theme-text/50 font-barlow">
                      Reg: {item.license_number}
                    </span>
                  )}
                </div>
                {item.federation && (
                  <p className="text-xs text-theme-text/35 font-barlow mb-2">
                    {item.federation.abbreviation || item.federation.official_name}
                  </p>
                )}
                {item.city && (
                  <p className="text-xs text-theme-text/30 font-barlow flex items-center gap-1">
                    <Icon name="map-pin" size={12} /> {[item.city, item.state].filter(Boolean).join(', ')}
                  </p>
                )}
                {item.specialties && item.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.specialties.map((s, i) => (
                      <span key={i} className="text-[10px] bg-theme-text/5 border border-theme-border/10 rounded-full px-2 py-0.5 text-theme-text/50 font-barlow-condensed">
                        {s.modality}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="font-barlow text-theme-text/40">Nenhum árbitro encontrado.</p>
        </div>
      )}
    </main>
  );
}
