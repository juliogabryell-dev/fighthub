'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import Link from 'next/link';

export default function MatchMakersPage() {
  const supabase = createClient();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from('match_makers')
        .select('*, owner:owner_id(full_name, handle, avatar_url, city, state)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      setItems(data || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const term = search.toLowerCase().trim();
  const filtered = term
    ? items.filter((m) =>
        m.owner?.full_name?.toLowerCase().includes(term) ||
        m.owner?.city?.toLowerCase().includes(term))
    : items;

  const SPEC_LABELS = { amador: 'Amador', profissional: 'Profissional', internacional: 'Internacional' };

  return (
    <main className="min-h-screen px-6 py-16 max-w-7xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="font-bebas text-4xl sm:text-5xl text-theme-text tracking-wider">
          MATCH <span className="text-brand-red">MAKERS</span>
        </h1>
        <p className="font-barlow text-theme-text/50 mt-2">Profissionais que conectam e organizam lutas</p>
      </div>

      <div className="max-w-md mx-auto mb-10 relative">
        <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text/30" />
        <input
          type="text" placeholder="Buscar match maker..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-theme-text/5 border border-theme-border/10 rounded-lg text-theme-text font-barlow text-sm pl-10 pr-4 py-3 focus:border-brand-red/50 outline-none transition-colors placeholder:text-theme-text/25"
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
            <Link key={item.id} href={`/match-makers/${item.id}`}>
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
                {item.specialty && (
                  <span className="text-[10px] bg-brand-gold/10 border border-brand-gold/20 rounded-full px-2 py-0.5 text-brand-gold font-barlow-condensed uppercase tracking-wider">
                    {SPEC_LABELS[item.specialty]}
                  </span>
                )}
                {item.organizations && item.organizations.length > 0 && (
                  <p className="text-xs text-theme-text/35 font-barlow mt-2 truncate">
                    {item.organizations.map((o) => o.name).join(', ')}
                  </p>
                )}
                {item.owner?.city && (
                  <p className="text-xs text-theme-text/30 font-barlow flex items-center gap-1 mt-2">
                    <Icon name="map-pin" size={12} /> {[item.owner.city, item.owner.state].filter(Boolean).join(', ')}
                  </p>
                )}
                <div className="flex gap-2 mt-3">
                  {item.instagram && <Icon name="instagram" size={14} className="text-theme-text/25" />}
                  {item.facebook && <Icon name="facebook" size={14} className="text-theme-text/25" />}
                  {item.tiktok && <Icon name="tiktok" size={14} className="text-theme-text/25" />}
                  {item.whatsapp && <Icon name="phone" size={14} className="text-green-400/40" />}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="font-barlow text-theme-text/40">Nenhum match maker encontrado.</p>
        </div>
      )}
    </main>
  );
}
