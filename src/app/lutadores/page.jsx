'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';

export default function LutadoresPage() {
  const supabase = createClient();
  const [fighters, setFighters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFighter, setSelectedFighter] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    async function fetchFighters() {
      const { data } = await supabase
        .from('profiles')
        .select('*, fighter_martial_arts(*), fight_records!fight_records_fighter_id_fkey(*)')
        .eq('is_fighter', true)
        .eq('status', 'active');
      setFighters(data || []);
      setLoading(false);
    }
    fetchFighters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openFighterModal(fighter) {
    setDetailLoading(true);
    setSelectedFighter(fighter);

    // Fetch full details with bindings
    const { data } = await supabase
      .from('profiles')
      .select('*, fighter_martial_arts(*), fight_records!fight_records_fighter_id_fkey(*), fighter_coaches!fighter_coaches_fighter_id_fkey(*, coach:coach_id(id, full_name, avatar_url, handle), martial_art:martial_art_id(id, art_name)), fighter_academies!fighter_academies_fighter_id_fkey(*, academy:academy_id(id, full_name, avatar_url, handle), martial_art:martial_art_id(id, art_name)), fighter_videos(*)')
      .eq('id', fighter.id)
      .single();

    if (data) setSelectedFighter(data);
    setDetailLoading(false);
  }

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
          LUTADORES <span className="text-[#C41E3A]">CADASTRADOS</span>
        </h1>
        <p className="font-barlow text-white/50 mt-3 text-lg">
          Encontre lutadores, veja cartéis e desafie oponentes
        </p>
      </div>

      {/* Fighters Grid */}
      {fighters.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {fighters.map((fighter) => {
            const martialArts = fighter.fighter_martial_arts || [];
            const fightRecords = fighter.fight_records || [];
            const wins = fightRecords.reduce((sum, r) => sum + (r.wins || 0), 0);
            const losses = fightRecords.reduce((sum, r) => sum + (r.losses || 0), 0);
            const draws = fightRecords.reduce((sum, r) => sum + (r.draws || 0), 0);

            return (
              <div
                key={fighter.id}
                onClick={() => openFighterModal(fighter)}
                className="cursor-pointer card-hover bg-gradient-to-b from-[#1a1a2e] to-[#16213e] rounded-xl border border-white/5 p-5 transition-all duration-300 hover:border-[#C41E3A]/30 group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Avatar name={fighter.full_name} url={fighter.avatar_url} size={48} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bebas text-xl text-white tracking-wide truncate group-hover:text-[#C41E3A] transition-colors">
                      {fighter.full_name}
                    </h3>
                    {fighter.handle && (
                      <p className="text-xs text-white/40 font-barlow truncate -mt-0.5 mb-0.5">@{fighter.handle}</p>
                    )}
                    {fighter.city && (
                      <p className="text-xs text-white/35 font-barlow truncate -mt-0.5 mb-0.5">{fighter.city}</p>
                    )}
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${fighter.status === 'active' ? 'bg-green-500' : 'bg-white/30'}`} />
                      <span className="text-xs text-white/40 font-barlow-condensed uppercase tracking-wider">
                        {fighter.status === 'active' ? 'Ativo' : fighter.status || 'Inativo'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Martial Arts Tags */}
                {martialArts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {martialArts.map((art, i) => (
                      <span key={i} className="text-xs bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5 text-white/60 font-barlow-condensed">
                        {art.art_name}
                        {art.level && <span className="text-[#D4AF37] ml-1">{art.level}</span>}
                      </span>
                    ))}
                  </div>
                )}

                {/* Record Stats */}
                <div className="flex items-center gap-4 pt-3 border-t border-white/5">
                  <div className="text-center flex-1">
                    <span className="block font-bebas text-xl text-green-500">{wins}</span>
                    <span className="text-[10px] uppercase tracking-wider text-white/30 font-barlow-condensed">Vitórias</span>
                  </div>
                  <div className="text-center flex-1">
                    <span className="block font-bebas text-xl text-[#C41E3A]">{losses}</span>
                    <span className="text-[10px] uppercase tracking-wider text-white/30 font-barlow-condensed">Derrotas</span>
                  </div>
                  <div className="text-center flex-1">
                    <span className="block font-bebas text-xl text-white/50">{draws}</span>
                    <span className="text-[10px] uppercase tracking-wider text-white/30 font-barlow-condensed">Empates</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/[0.06] p-12 max-w-md mx-auto">
            <p className="font-bebas text-3xl text-white/30 mb-2">🥊</p>
            <p className="font-barlow-condensed text-xl text-white/40 uppercase tracking-wider">
              Nenhum lutador cadastrado ainda
            </p>
            <p className="font-barlow text-sm text-white/25 mt-2">
              Os lutadores aparecerão aqui conforme se cadastrarem na plataforma.
            </p>
          </div>
        </div>
      )}

      {/* Fighter Detail Modal */}
      {selectedFighter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={() => setSelectedFighter(null)}>
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/10 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="relative bg-gradient-to-br from-[#C41E3A]/20 to-[#C41E3A]/5 p-8">
              <button onClick={() => setSelectedFighter(null)} className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all">
                ✕
              </button>
              <div className="flex flex-col sm:flex-row items-center gap-5">
                <div className="w-20 h-20 rounded-full bg-[#C41E3A]/20 border-2 border-[#C41E3A]/40 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {selectedFighter.avatar_url ? (
                    <img src={selectedFighter.avatar_url} alt={selectedFighter.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bebas text-3xl text-[#C41E3A]">{selectedFighter.full_name?.charAt(0) || '?'}</span>
                  )}
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="font-bebas text-3xl text-white tracking-wider">{selectedFighter.full_name}</h2>
                  {selectedFighter.handle && (
                    <p className="font-barlow text-sm text-white/50">@{selectedFighter.handle}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 justify-center sm:justify-start">
                    {selectedFighter.city && (
                      <span className="flex items-center gap-1 text-white/40 text-sm font-barlow">
                        <Icon name="map-pin" size={14} />
                        {[selectedFighter.city, selectedFighter.state].filter(Boolean).join(', ')}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-barlow-condensed uppercase tracking-wider border ${selectedFighter.status === 'active' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-white/5 border-white/10 text-white/40'}`}>
                      {selectedFighter.status === 'active' ? 'Ativo' : selectedFighter.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {detailLoading ? (
              <div className="p-10 flex justify-center">
                <svg className="animate-spin h-8 w-8 text-[#C41E3A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : (
              <div className="p-8">
                {/* Bio */}
                {selectedFighter.bio && (
                  <p className="font-barlow text-sm text-white/60 leading-relaxed mb-6">{selectedFighter.bio}</p>
                )}

                {/* Record */}
                {(() => {
                  const records = selectedFighter.fight_records || [];
                  const wins = records.reduce((sum, r) => sum + (r.wins || 0), 0);
                  const losses = records.reduce((sum, r) => sum + (r.losses || 0), 0);
                  const draws = records.reduce((sum, r) => sum + (r.draws || 0), 0);
                  return (
                    <div className="grid grid-cols-3 gap-3 mb-8">
                      <div className="text-center p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                        <p className="font-bebas text-3xl text-green-500">{wins}</p>
                        <p className="font-barlow-condensed text-xs text-white/40 uppercase tracking-widest mt-1">Vitórias</p>
                      </div>
                      <div className="text-center p-4 bg-[#C41E3A]/10 rounded-xl border border-[#C41E3A]/20">
                        <p className="font-bebas text-3xl text-[#C41E3A]">{losses}</p>
                        <p className="font-barlow-condensed text-xs text-white/40 uppercase tracking-widest mt-1">Derrotas</p>
                      </div>
                      <div className="text-center p-4 bg-[#D4AF37]/10 rounded-xl border border-[#D4AF37]/20">
                        <p className="font-bebas text-3xl text-[#D4AF37]">{draws}</p>
                        <p className="font-barlow-condensed text-xs text-white/40 uppercase tracking-widest mt-1">Empates</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Martial Arts with Coaches/Academies */}
                {selectedFighter.fighter_martial_arts && selectedFighter.fighter_martial_arts.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-barlow-condensed text-[#D4AF37] uppercase tracking-widest text-sm font-semibold mb-4">
                      MODALIDADES & VÍNCULOS
                    </h3>
                    <div className="space-y-3">
                      {selectedFighter.fighter_martial_arts.map((fma, index) => {
                        const activeCoaches = (selectedFighter.fighter_coaches || []).filter(fc => fc.martial_art_id === fma.id && fc.status === 'active');
                        const activeAcademies = (selectedFighter.fighter_academies || []).filter(fa => fa.martial_art_id === fma.id && fa.status === 'active');
                        return (
                          <div key={index} className="p-4 bg-white/[0.02] rounded-lg border-l-2 border-[#C41E3A]">
                            <div>
                              <p className="font-barlow-condensed text-lg text-white">{fma.art_name}</p>
                              <div className="flex gap-3 mt-1">
                                {fma.level && (
                                  <span className="font-barlow text-sm text-white/50">
                                    Nível: <span className="text-[#D4AF37]">{fma.level}</span>
                                  </span>
                                )}
                                {fma.started_at && (() => {
                                  const years = Math.floor((Date.now() - new Date(fma.started_at).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                                  return years > 0 ? (
                                    <span className="font-barlow text-sm text-white/50">{years} {years === 1 ? 'ano' : 'anos'} praticando</span>
                                  ) : (
                                    <span className="font-barlow text-sm text-white/50">Menos de 1 ano</span>
                                  );
                                })()}
                              </div>
                            </div>

                            {/* Coaches */}
                            {activeCoaches.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-white/[0.06]">
                                <p className="font-barlow-condensed text-xs uppercase tracking-widest text-[#D4AF37]/60 mb-2">Treinadores</p>
                                <div className="flex flex-wrap gap-2">
                                  {activeCoaches.map((fc, i) => (
                                    <div key={i} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                                      <div className="w-6 h-6 rounded-full bg-[#D4AF37]/15 flex items-center justify-center flex-shrink-0">
                                        <Icon name="award" size={12} className="text-[#D4AF37]" />
                                      </div>
                                      <span className="font-barlow-condensed text-sm text-white">{fc.coach?.full_name || 'Treinador'}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Academies */}
                            {activeAcademies.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-white/[0.06]">
                                <p className="font-barlow-condensed text-xs uppercase tracking-widest text-blue-400/60 mb-2">Academias</p>
                                <div className="flex flex-wrap gap-2">
                                  {activeAcademies.map((fa, i) => (
                                    <div key={i} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                                      <div className="w-6 h-6 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                                        <Icon name="building" size={12} className="text-blue-400" />
                                      </div>
                                      <span className="font-barlow-condensed text-sm text-white">{fa.academy?.full_name || 'Academia'}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Videos */}
                {selectedFighter.fighter_videos && selectedFighter.fighter_videos.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-barlow-condensed text-[#D4AF37] uppercase tracking-widest text-sm font-semibold mb-4">VÍDEOS</h3>
                    <div className="space-y-2">
                      {selectedFighter.fighter_videos.map((video, i) => (
                        <a key={i} href={video.youtube_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/[0.06] hover:bg-white/[0.04] transition-colors group">
                          <div className="w-8 h-8 rounded-full bg-[#C41E3A]/15 flex items-center justify-center flex-shrink-0 group-hover:bg-[#C41E3A]/25 transition-colors">
                            <Icon name="play" size={14} className="text-[#C41E3A]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-barlow-condensed text-white text-sm truncate">{video.title || 'Vídeo'}</p>
                            {video.modality && <p className="font-barlow text-xs text-white/30 truncate">{video.modality}</p>}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Links */}
                {(selectedFighter.instagram || selectedFighter.facebook || selectedFighter.youtube || selectedFighter.tiktok) && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-white/[0.06]">
                    {selectedFighter.instagram && (() => {
                      const handle = selectedFighter.instagram.replace(/^@/, '');
                      return (
                        <a href={`https://instagram.com/${handle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-pink-400 hover:border-pink-400/30 transition-all">
                          <Icon name="instagram" size={14} /><span className="font-barlow text-xs">@{handle}</span>
                        </a>
                      );
                    })()}
                    {selectedFighter.facebook && (() => {
                      const isUrl = selectedFighter.facebook.startsWith('http');
                      return (
                        <a href={isUrl ? selectedFighter.facebook : `https://facebook.com/${selectedFighter.facebook}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-blue-400 hover:border-blue-400/30 transition-all">
                          <Icon name="facebook" size={14} /><span className="font-barlow text-xs">{isUrl ? 'Facebook' : selectedFighter.facebook}</span>
                        </a>
                      );
                    })()}
                    {selectedFighter.youtube && (() => {
                      const isUrl = selectedFighter.youtube.startsWith('http');
                      const handle = selectedFighter.youtube.replace(/^@/, '');
                      return (
                        <a href={isUrl ? selectedFighter.youtube : `https://youtube.com/@${handle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-red-400 hover:border-red-400/30 transition-all">
                          <Icon name="youtube" size={14} /><span className="font-barlow text-xs">{isUrl ? 'YouTube' : `@${handle}`}</span>
                        </a>
                      );
                    })()}
                    {selectedFighter.tiktok && (() => {
                      const handle = selectedFighter.tiktok.replace(/^@/, '');
                      return (
                        <a href={`https://tiktok.com/@${handle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white hover:border-white/30 transition-all">
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
      )}
    </main>
  );
}
