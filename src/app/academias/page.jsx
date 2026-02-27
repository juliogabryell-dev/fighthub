'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';

export default function AcademiasPage() {
  const supabase = createClient();
  const [academies, setAcademies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAcademy, setSelectedAcademy] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    async function fetchAcademies() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'academy')
        .eq('status', 'active');
      setAcademies(data || []);
      setLoading(false);
    }
    fetchAcademies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openAcademyModal(academy) {
    setDetailLoading(true);
    setSelectedAcademy(academy);

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', academy.id)
      .single();

    if (data) setSelectedAcademy(data);
    setDetailLoading(false);
  }

  function closeModal() {
    setSelectedAcademy(null);
  }

  const term = search.toLowerCase().trim();
  const filtered = term
    ? academies.filter(a =>
        (a.full_name || '').toLowerCase().includes(term) ||
        (a.handle || '').toLowerCase().includes(term)
      )
    : academies;

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
        <h1 className="font-bebas text-5xl text-theme-text tracking-wider">
          ACADEMIAS{' '}
          <span className="text-[#C41E3A]">CADASTRADAS</span>
        </h1>
        <p className="font-barlow text-theme-text/50 mt-3 text-lg">
          Encontre academias e centros de treinamento
        </p>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou @handle..."
          className="w-full bg-theme-text/5 border border-theme-border/10 rounded-xl text-theme-text font-barlow text-sm px-4 py-3 focus:border-[#C41E3A]/50 outline-none transition-colors placeholder:text-theme-text/25"
        />
      </div>

      {/* Academies Grid or Empty State */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((academy) => {
            const hasSocials = academy.instagram || academy.facebook || academy.youtube || academy.tiktok;

            return (
              <div
                key={academy.id}
                onClick={() => openAcademyModal(academy)}
                className="cursor-pointer card-hover bg-gradient-to-b from-dark-card to-dark-card2 rounded-xl border border-theme-border/5 p-5 transition-all duration-300 hover:border-blue-500/30 group"
              >
                {/* Header: Avatar + Name + Status */}
                <div className="flex items-center gap-3 mb-4">
                  <Avatar name={academy.full_name} url={academy.avatar_url} size={48} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bebas text-xl text-theme-text tracking-wide truncate group-hover:text-blue-400 transition-colors">
                      {academy.full_name}
                    </h3>
                    {academy.handle && (
                      <p className="text-xs text-theme-text/40 font-barlow truncate -mt-0.5 mb-0.5">
                        @{academy.handle}
                      </p>
                    )}
                    {academy.city && (
                      <p className="text-xs text-theme-text/35 font-barlow truncate -mt-0.5 mb-0.5">
                        {academy.city}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          academy.status === 'active' ? 'bg-green-500' : 'bg-theme-text/30'
                        }`}
                      />
                      <span className="text-xs text-theme-text/40 font-barlow-condensed uppercase tracking-wider">
                        {academy.status === 'active' ? 'Ativa' : academy.status || 'Inativa'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bio Preview */}
                {academy.bio ? (
                  <p className="text-sm text-theme-text/50 font-barlow leading-relaxed mb-4 line-clamp-3">
                    {academy.bio}
                  </p>
                ) : (
                  <p className="text-xs text-theme-text/25 font-barlow italic mb-4">
                    Nenhuma descricao cadastrada
                  </p>
                )}

                {/* Contact & Social */}
                {(academy.phone || hasSocials) && (
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-theme-border/5">
                    {academy.phone && (
                      <span className="flex items-center gap-1 text-[10px] text-theme-text/35 font-barlow">
                        <Icon name="phone" size={11} />
                        {academy.phone}
                      </span>
                    )}
                    {academy.instagram && (
                      <span className="flex items-center gap-1 text-[10px] text-theme-text/35 font-barlow">
                        <Icon name="instagram" size={11} />
                        {academy.instagram}
                      </span>
                    )}
                    {academy.facebook && (
                      <span className="flex items-center gap-1 text-[10px] text-theme-text/35 font-barlow">
                        <Icon name="facebook" size={11} />
                        {academy.facebook.startsWith('http') ? 'Facebook' : academy.facebook}
                      </span>
                    )}
                    {academy.youtube && (
                      <span className="flex items-center gap-1 text-[10px] text-theme-text/35 font-barlow">
                        <Icon name="youtube" size={11} />
                        {academy.youtube.startsWith('http') ? 'YouTube' : academy.youtube}
                      </span>
                    )}
                    {academy.tiktok && (
                      <span className="flex items-center gap-1 text-[10px] text-theme-text/35 font-barlow">
                        <Icon name="tiktok" size={11} />
                        {academy.tiktok}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="bg-gradient-to-br from-dark-card to-dark-card2 rounded-2xl border border-theme-border/[0.06] p-12 max-w-md mx-auto">
            <p className="font-bebas text-3xl text-theme-text/30 mb-2">🏢</p>
            <p className="font-barlow-condensed text-xl text-theme-text/40 uppercase tracking-wider">
              {term ? 'Nenhuma academia encontrada' : 'Nenhuma academia cadastrada ainda'}
            </p>
            <p className="font-barlow text-sm text-theme-text/25 mt-2">
              {term ? 'Tente buscar por outro nome ou handle.' : 'As academias aparecerão aqui conforme se cadastrarem na plataforma.'}
            </p>
          </div>
        </div>
      )}

      {/* Academy Detail Modal */}
      {selectedAcademy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={closeModal}>
          <div
            className="bg-gradient-to-br from-dark-card to-dark-card2 rounded-2xl border border-theme-border/10 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-y-auto max-h-[90vh]">
              {/* Header */}
              <div className="relative bg-gradient-to-br from-blue-500/20 to-blue-500/5 p-8">
                <button onClick={closeModal} className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-theme-text/10 border border-theme-border/10 flex items-center justify-center text-theme-text/40 hover:text-theme-text hover:border-theme-border/20 transition-all">
                  ✕
                </button>
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="w-20 h-20 rounded-full bg-blue-500/20 border-2 border-blue-500/40 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {selectedAcademy.avatar_url ? (
                      <img src={selectedAcademy.avatar_url} alt={selectedAcademy.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bebas text-3xl text-blue-400">{selectedAcademy.full_name?.charAt(0) || '?'}</span>
                    )}
                  </div>
                  <div className="text-center sm:text-left">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-barlow-condensed uppercase tracking-widest mb-1 border text-blue-400 border-blue-500/40 bg-blue-500/15">
                      ACADEMIA
                    </span>
                    <h2 className="font-bebas text-3xl text-theme-text tracking-wider">{selectedAcademy.full_name}</h2>
                    {selectedAcademy.handle && (
                      <p className="font-barlow text-sm text-theme-text/50">@{selectedAcademy.handle}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 justify-center sm:justify-start">
                      {selectedAcademy.city && (
                        <span className="flex items-center gap-1 text-theme-text/40 text-sm font-barlow">
                          <Icon name="map-pin" size={14} />
                          {[selectedAcademy.city, selectedAcademy.state].filter(Boolean).join(', ')}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-barlow-condensed uppercase tracking-wider border ${selectedAcademy.status === 'active' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-theme-text/5 border-theme-border/10 text-theme-text/40'}`}>
                        {selectedAcademy.status === 'active' ? 'Ativa' : selectedAcademy.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {detailLoading ? (
                <div className="p-10 flex justify-center">
                  <svg className="animate-spin h-8 w-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              ) : (
                <div className="p-8">
                  {/* Bio */}
                  {selectedAcademy.bio && (
                    <p className="font-barlow text-sm text-theme-text/60 leading-relaxed mb-6">{selectedAcademy.bio}</p>
                  )}

                  {/* Location & Phone */}
                  {(selectedAcademy.city || selectedAcademy.phone) && (
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6">
                      {selectedAcademy.city && (
                        <div className="flex items-center gap-2 text-theme-text/50">
                          <Icon name="map-pin" size={16} />
                          <span className="font-barlow text-sm">
                            {[selectedAcademy.city, selectedAcademy.state].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                      {selectedAcademy.phone && (
                        <div className="flex items-center gap-2 text-theme-text/50">
                          <Icon name="phone" size={16} />
                          <span className="font-barlow text-sm">{selectedAcademy.phone}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* No info message */}
                  {!selectedAcademy.bio && !selectedAcademy.city && !selectedAcademy.phone && !selectedAcademy.instagram && !selectedAcademy.facebook && !selectedAcademy.youtube && !selectedAcademy.tiktok && (
                    <div className="text-center py-6">
                      <p className="font-barlow-condensed text-theme-text/30 uppercase tracking-wider text-sm">
                        Nenhuma informacao adicional cadastrada
                      </p>
                    </div>
                  )}

                  {/* Social Links */}
                  {(selectedAcademy.instagram || selectedAcademy.facebook || selectedAcademy.youtube || selectedAcademy.tiktok) && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-theme-border/[0.06]">
                      {selectedAcademy.instagram && (() => {
                        const handle = selectedAcademy.instagram.replace(/^@/, '');
                        return (
                          <a href={`https://instagram.com/${handle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-text/[0.04] border border-theme-border/[0.08] text-theme-text/50 hover:text-pink-400 hover:border-pink-400/30 transition-all">
                            <Icon name="instagram" size={14} /><span className="font-barlow text-xs">@{handle}</span>
                          </a>
                        );
                      })()}
                      {selectedAcademy.facebook && (() => {
                        const isUrl = selectedAcademy.facebook.startsWith('http');
                        return (
                          <a href={isUrl ? selectedAcademy.facebook : `https://facebook.com/${selectedAcademy.facebook}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-text/[0.04] border border-theme-border/[0.08] text-theme-text/50 hover:text-blue-400 hover:border-blue-400/30 transition-all">
                            <Icon name="facebook" size={14} /><span className="font-barlow text-xs">{isUrl ? 'Facebook' : selectedAcademy.facebook}</span>
                          </a>
                        );
                      })()}
                      {selectedAcademy.youtube && (() => {
                        const isUrl = selectedAcademy.youtube.startsWith('http');
                        const handle = selectedAcademy.youtube.replace(/^@/, '');
                        return (
                          <a href={isUrl ? selectedAcademy.youtube : `https://youtube.com/@${handle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-text/[0.04] border border-theme-border/[0.08] text-theme-text/50 hover:text-red-400 hover:border-red-400/30 transition-all">
                            <Icon name="youtube" size={14} /><span className="font-barlow text-xs">{isUrl ? 'YouTube' : `@${handle}`}</span>
                          </a>
                        );
                      })()}
                      {selectedAcademy.tiktok && (() => {
                        const handle = selectedAcademy.tiktok.replace(/^@/, '');
                        return (
                          <a href={`https://tiktok.com/@${handle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-text/[0.04] border border-theme-border/[0.08] text-theme-text/50 hover:text-theme-text hover:border-theme-border/30 transition-all">
                            <Icon name="tiktok" size={14} /><span className="font-barlow text-xs">@{handle}</span>
                          </a>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
