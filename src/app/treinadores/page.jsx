'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import CoachCard from '@/components/CoachCard';

export default function TreinadoresPage() {
  const supabase = createClient();
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchCoaches() {
      const { data } = await supabase
        .from('profiles')
        .select('*, coach_experiences!coach_experiences_coach_id_fkey(*)')
        .eq('is_coach', true)
        .eq('status', 'active');
      setCoaches(data || []);
      setLoading(false);
    }
    fetchCoaches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const term = search.toLowerCase().trim();
  const filtered = term
    ? coaches.filter(c =>
        (c.full_name || '').toLowerCase().includes(term) ||
        (c.handle || '').toLowerCase().includes(term)
      )
    : coaches;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-[#C41E3A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-6 py-16 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="font-bebas text-5xl text-white tracking-wider">
          TREINADORES &{' '}
          <span className="text-[#C41E3A]">COACHES</span>
        </h1>
        <p className="font-barlow text-white/50 mt-3 text-lg">
          Encontre treinadores experientes para evoluir sua técnica
        </p>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou @handle..."
          className="w-full bg-white/5 border border-white/10 rounded-xl text-white font-barlow text-sm px-4 py-3 focus:border-[#C41E3A]/50 outline-none transition-colors placeholder:text-white/25"
        />
      </div>

      {/* Coaches Grid or Empty State */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((coach) => (
            <CoachCard key={coach.id} coach={coach} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/[0.06] p-12 max-w-md mx-auto">
            <p className="font-bebas text-3xl text-white/30 mb-2">🥋</p>
            <p className="font-barlow-condensed text-xl text-white/40 uppercase tracking-wider">
              {term ? 'Nenhum treinador encontrado' : 'Nenhum treinador cadastrado ainda'}
            </p>
            <p className="font-barlow text-sm text-white/25 mt-2">
              {term ? 'Tente buscar por outro nome ou handle.' : 'Os treinadores aparecerão aqui conforme se cadastrarem na plataforma.'}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
