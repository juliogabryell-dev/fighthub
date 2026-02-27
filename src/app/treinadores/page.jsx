'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';

export default function TreinadoresPage() {
  const supabase = createClient();
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  async function openCoachModal(coach) {
    setDetailLoading(true);
    setSelectedCoach(coach);

    const { data } = await supabase
      .from('profiles')
      .select('*, coach_experiences!coach_experiences_coach_id_fkey(*)')
      .eq('id', coach.id)
      .single();

    if (data) setSelectedCoach(data);
    setDetailLoading(false);
  }

  function closeModal() {
    setSelectedCoach(null);
  }

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

  // Sort experiences by period_start descending
  function getSortedExperiences(coach) {
    const experiences = coach.coach_experiences || [];
    return [...experiences].sort((a, b) => {
      if (a.period_start && b.period_start) return b.period_start.localeCompare(a.period_start);
      return 0;
    });
  }

  return (
    <main className="min-h-screen px-6 py-16 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="font-bebas text-5xl text-theme-text tracking-wider">
          TREINADORES &{' '}
          <span className="text-[#C41E3A]">COACHES</span>
        </h1>
        <p className="font-barlow text-theme-text/50 mt-3 text-lg">
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
          className="w-full bg-theme-text/5 border border-theme-border/10 rounded-xl text-theme-text font-barlow text-sm px-4 py-3 focus:border-[#C41E3A]/50 outline-none transition-colors placeholder:text-theme-text/25"
        />
      </div>

      {/* Coaches Grid or Empty State */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((coach) => {
            const experiences = coach.coach_experiences || [];
            const displayExperiences = experiences.slice(0, 2);

            return (
              <div
                key={coach.id}
                onClick={() => openCoachModal(coach)}
                className="cursor-pointer card-hover bg-gradient-to-b from-dark-card to-dark-card2 rounded-xl border border-theme-border/5 p-5 transition-all duration-300 hover:border-[#D4AF37]/30 group"
              >
                {/* Header: Avatar + Name + Status */}
                <div className="flex items-center gap-3 mb-4">
                  <Avatar name={coach.full_name} url={coach.avatar_url} size={48} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bebas text-xl text-theme-text tracking-wide truncate group-hover:text-[#D4AF37] transition-colors">
                      {coach.full_name}
                    </h3>
                    {coach.handle && (
                      <p className="text-xs text-theme-text/40 font-barlow truncate -mt-0.5 mb-0.5">
                        @{coach.handle}
                      </p>
                    )}
                    {coach.city && (
                      <p className="text-xs text-theme-text/35 font-barlow truncate -mt-0.5 mb-0.5">
                        {coach.city}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          coach.status === 'active' ? 'bg-green-500' : 'bg-theme-text/30'
                        }`}
                      />
                      <span className="text-xs text-theme-text/40 font-barlow-condensed uppercase tracking-wider">
                        {coach.status === 'active' ? 'Ativo' : coach.status || 'Inativo'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Experiences */}
                {displayExperiences.length > 0 ? (
                  <div className="space-y-2.5">
                    {displayExperiences.map((exp, i) => (
                      <div
                        key={i}
                        className="border-l-2 border-[#D4AF37] pl-3 py-0.5"
                      >
                        <p className="text-sm text-theme-text/80 font-barlow font-medium leading-tight">
                          {exp.title}
                        </p>
                        <p className="text-xs text-theme-text/40 font-barlow-condensed">
                          {exp.organization}
                          {exp.period_start && (
                            <span className="ml-1.5 text-theme-text/25">
                              {exp.period_start}
                              {exp.period_end ? ` - ${exp.period_end}` : ' - Presente'}
                            </span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-theme-text/25 font-barlow italic">
                    Nenhuma experiência cadastrada
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="bg-gradient-to-br from-dark-card to-dark-card2 rounded-2xl border border-theme-border/[0.06] p-12 max-w-md mx-auto">
            <p className="font-bebas text-3xl text-theme-text/30 mb-2">🥋</p>
            <p className="font-barlow-condensed text-xl text-theme-text/40 uppercase tracking-wider">
              {term ? 'Nenhum treinador encontrado' : 'Nenhum treinador cadastrado ainda'}
            </p>
            <p className="font-barlow text-sm text-theme-text/25 mt-2">
              {term ? 'Tente buscar por outro nome ou handle.' : 'Os treinadores aparecerão aqui conforme se cadastrarem na plataforma.'}
            </p>
          </div>
        </div>
      )}

      {/* Coach Detail Modal */}
      {selectedCoach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={closeModal}>
          <div
            className="bg-gradient-to-br from-dark-card to-dark-card2 rounded-2xl border border-theme-border/10 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-y-auto max-h-[90vh]">
              {/* Header */}
              <div className="relative bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 p-8">
                <button onClick={closeModal} className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-theme-text/10 border border-theme-border/10 flex items-center justify-center text-theme-text/40 hover:text-theme-text hover:border-theme-border/20 transition-all">
                  ✕
                </button>
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="w-20 h-20 rounded-full bg-[#D4AF37]/20 border-2 border-[#D4AF37]/40 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {selectedCoach.avatar_url ? (
                      <img src={selectedCoach.avatar_url} alt={selectedCoach.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bebas text-3xl text-[#D4AF37]">{selectedCoach.full_name?.charAt(0) || '?'}</span>
                    )}
                  </div>
                  <div className="text-center sm:text-left">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-barlow-condensed uppercase tracking-widest mb-1 border text-[#D4AF37] border-[#D4AF37]/40 bg-[#D4AF37]/15">
                      TREINADOR
                    </span>
                    <h2 className="font-bebas text-3xl text-theme-text tracking-wider">{selectedCoach.full_name}</h2>
                    {selectedCoach.handle && (
                      <p className="font-barlow text-sm text-theme-text/50">@{selectedCoach.handle}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 justify-center sm:justify-start">
                      {selectedCoach.city && (
                        <span className="flex items-center gap-1 text-theme-text/40 text-sm font-barlow">
                          <Icon name="map-pin" size={14} />
                          {[selectedCoach.city, selectedCoach.state].filter(Boolean).join(', ')}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-barlow-condensed uppercase tracking-wider border ${selectedCoach.status === 'active' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-theme-text/5 border-theme-border/10 text-theme-text/40'}`}>
                        {selectedCoach.status === 'active' ? 'Ativo' : selectedCoach.status}
                      </span>
                    </div>
                    {selectedCoach.birth_date && (
                      <p className="font-barlow text-xs text-theme-text/30 mt-1">
                        Nascimento: {new Date(selectedCoach.birth_date).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {detailLoading ? (
                <div className="p-10 flex justify-center">
                  <svg className="animate-spin h-8 w-8 text-[#D4AF37]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              ) : (
                <div className="p-8">
                  {/* Bio */}
                  {selectedCoach.bio && (
                    <p className="font-barlow text-sm text-theme-text/60 leading-relaxed mb-6">{selectedCoach.bio}</p>
                  )}

                  {/* Phone */}
                  {selectedCoach.phone && (
                    <div className="mb-6 flex items-center gap-2 text-theme-text/50">
                      <Icon name="phone" size={16} />
                      <span className="font-barlow text-sm">{selectedCoach.phone}</span>
                    </div>
                  )}

                  {/* Experiences Timeline */}
                  {(() => {
                    const sortedExperiences = getSortedExperiences(selectedCoach);
                    return sortedExperiences.length > 0 ? (
                      <div className="mb-6">
                        <h3 className="font-barlow-condensed text-[#D4AF37] uppercase tracking-widest text-sm font-semibold mb-6">
                          EXPERIÊNCIA PROFISSIONAL
                        </h3>
                        <div className="relative">
                          {/* Vertical Line */}
                          <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-[#C41E3A]/30" />

                          {/* Experience Items */}
                          <div className="space-y-6">
                            {sortedExperiences.map((exp, index) => (
                              <div key={index} className="relative pl-10">
                                {/* Dot */}
                                <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-[#C41E3A]/20 border-2 border-[#C41E3A] flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-full bg-[#C41E3A]" />
                                </div>

                                {/* Experience Card */}
                                <div className="p-4 bg-theme-text/[0.02] rounded-xl border border-theme-border/[0.06]">
                                  <h4 className="font-barlow-condensed text-lg text-theme-text">
                                    {exp.title || 'Experiência'}
                                  </h4>
                                  {exp.organization && (
                                    <p className="font-barlow-condensed text-sm text-[#D4AF37] mt-1">
                                      {exp.organization}
                                    </p>
                                  )}
                                  {(exp.period_start || exp.period_end) && (
                                    <p className="font-barlow text-xs text-theme-text/30 mt-1">
                                      {exp.period_start}
                                      {exp.period_end ? ` - ${exp.period_end}` : ' - Presente'}
                                    </p>
                                  )}
                                  {exp.description && (
                                    <p className="font-barlow text-sm text-theme-text/50 mt-3 leading-relaxed">
                                      {exp.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-6 text-center py-4">
                        <p className="font-barlow-condensed text-theme-text/30 uppercase tracking-wider text-sm">
                          Nenhuma experiência cadastrada
                        </p>
                      </div>
                    );
                  })()}

                  {/* Social Links */}
                  {(selectedCoach.instagram || selectedCoach.facebook || selectedCoach.youtube || selectedCoach.tiktok) && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-theme-border/[0.06]">
                      {selectedCoach.instagram && (() => {
                        const handle = selectedCoach.instagram.replace(/^@/, '');
                        return (
                          <a href={`https://instagram.com/${handle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-text/[0.04] border border-theme-border/[0.08] text-theme-text/50 hover:text-pink-400 hover:border-pink-400/30 transition-all">
                            <Icon name="instagram" size={14} /><span className="font-barlow text-xs">@{handle}</span>
                          </a>
                        );
                      })()}
                      {selectedCoach.facebook && (() => {
                        const isUrl = selectedCoach.facebook.startsWith('http');
                        return (
                          <a href={isUrl ? selectedCoach.facebook : `https://facebook.com/${selectedCoach.facebook}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-text/[0.04] border border-theme-border/[0.08] text-theme-text/50 hover:text-blue-400 hover:border-blue-400/30 transition-all">
                            <Icon name="facebook" size={14} /><span className="font-barlow text-xs">{isUrl ? 'Facebook' : selectedCoach.facebook}</span>
                          </a>
                        );
                      })()}
                      {selectedCoach.youtube && (() => {
                        const isUrl = selectedCoach.youtube.startsWith('http');
                        const handle = selectedCoach.youtube.replace(/^@/, '');
                        return (
                          <a href={isUrl ? selectedCoach.youtube : `https://youtube.com/@${handle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-text/[0.04] border border-theme-border/[0.08] text-theme-text/50 hover:text-red-400 hover:border-red-400/30 transition-all">
                            <Icon name="youtube" size={14} /><span className="font-barlow text-xs">{isUrl ? 'YouTube' : `@${handle}`}</span>
                          </a>
                        );
                      })()}
                      {selectedCoach.tiktok && (() => {
                        const handle = selectedCoach.tiktok.replace(/^@/, '');
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
