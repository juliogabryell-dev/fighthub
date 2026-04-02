'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import FightRecordDisplay from '@/components/FightRecordDisplay';

function isPublic(profile, field) {
  const pf = profile?.public_fields;
  if (!pf) return true;
  return pf[field] !== false;
}

export default function LutadoresPage() {
  const supabase = createClient();
  const [fighters, setFighters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFighter, setSelectedFighter] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState('');
  // Slide panel state: null = fighter view, { type, data, loading } = coach/academy view
  const [slidePanel, setSlidePanel] = useState(null);
  const [slideDirection, setSlideDirection] = useState('');
  const modalRef = useRef(null);

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
    setSlidePanel(null);
    setSlideDirection('');
    setDetailLoading(true);
    setSelectedFighter(fighter);

    const { data } = await supabase
      .from('profiles')
      .select('*, fighter_martial_arts(*), fight_records!fight_records_fighter_id_fkey(*), fighter_coaches!fighter_coaches_fighter_id_fkey(*, coach:coach_id(id, full_name, avatar_url, handle), martial_art:martial_art_id(id, art_name)), fighter_academies!fighter_academies_fighter_id_fkey(*, academy:academy_id(id, full_name, avatar_url, handle), martial_art:martial_art_id(id, art_name)), fighter_videos(*)')
      .eq('id', fighter.id)
      .single();

    if (data) setSelectedFighter(data);
    setDetailLoading(false);
  }

  function closeModal() {
    setSelectedFighter(null);
    setSlidePanel(null);
    setSlideDirection('');
  }

  async function openCoachPanel(coachId) {
    if (modalRef.current) modalRef.current.scrollTop = 0;
    setSlidePanel({ type: 'coach', data: null, loading: true });
    setSlideDirection('slide-left');

    const { data } = await supabase
      .from('profiles')
      .select('*, coach_experiences!coach_experiences_coach_id_fkey(*)')
      .eq('id', coachId)
      .single();

    setSlidePanel({ type: 'coach', data, loading: false });
  }

  async function openAcademyPanel(academyId) {
    if (modalRef.current) modalRef.current.scrollTop = 0;
    setSlidePanel({ type: 'academy', data: null, loading: true });
    setSlideDirection('slide-left');

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', academyId)
      .single();

    setSlidePanel({ type: 'academy', data, loading: false });
  }

  function goBackToFighter() {
    setSlideDirection('slide-right');
    setTimeout(() => {
      setSlidePanel(null);
      setSlideDirection('');
    }, 300);
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

  // Render coach/academy panel content
  function renderSlidePanel() {
    if (!slidePanel) return null;
    const { type, data, loading: panelLoading } = slidePanel;

    if (panelLoading) {
      return (
        <div className="p-10 flex justify-center">
          <svg className="animate-spin h-8 w-8 text-[#C41E3A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      );
    }

    if (!data) {
      return (
        <div className="p-8 text-center">
          <p className="font-barlow text-theme-text/40">Perfil não encontrado.</p>
        </div>
      );
    }

    const accentColor = type === 'coach' ? '#D4AF37' : '#3b82f6';
    const label = type === 'coach' ? 'TREINADOR' : 'ACADEMIA';

    return (
      <>
        {/* Header */}
        <div className="relative p-8" style={{ background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}05)` }}>
          <button onClick={goBackToFighter} className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-theme-text/10 border border-theme-border/10 text-theme-text/60 hover:text-theme-text hover:border-theme-border/20 transition-all text-sm font-barlow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            Voltar
          </button>
          <button onClick={closeModal} className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-theme-text/10 border border-theme-border/10 flex items-center justify-center text-theme-text/40 hover:text-theme-text hover:border-theme-border/20 transition-all">
            ✕
          </button>
          <div className="flex flex-col sm:flex-row items-center gap-5 mt-6">
            <div className="w-20 h-20 rounded-full border-2 flex items-center justify-center overflow-hidden flex-shrink-0" style={{ backgroundColor: `${accentColor}20`, borderColor: `${accentColor}40` }}>
              {data.avatar_url ? (
                <img src={data.avatar_url} alt={data.full_name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-bebas text-3xl" style={{ color: accentColor }}>{data.full_name?.charAt(0) || '?'}</span>
              )}
            </div>
            <div className="text-center sm:text-left">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-barlow-condensed uppercase tracking-widest mb-1 border" style={{ color: accentColor, borderColor: `${accentColor}40`, backgroundColor: `${accentColor}15` }}>
                {label}
              </span>
              <h2 className="font-bebas text-3xl text-theme-text tracking-wider">{data.full_name}</h2>
              {data.handle && (
                <p className="font-barlow text-sm text-theme-text/50">@{data.handle}</p>
              )}
              <div className="flex items-center gap-3 mt-1 justify-center sm:justify-start">
                {data.city && (
                  <span className="flex items-center gap-1 text-theme-text/40 text-sm font-barlow">
                    <Icon name="map-pin" size={14} />
                    {[data.city, data.state].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-8">
          {data.bio && isPublic(data, 'bio') && (
            <p className="font-barlow text-sm text-theme-text/60 leading-relaxed mb-6">{data.bio}</p>
          )}

          {/* Physical info */}
          {((data.height_cm && isPublic(data, 'height_cm')) || (data.weight_kg && isPublic(data, 'weight_kg')) || (data.blood_type && isPublic(data, 'blood_type'))) && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {data.height_cm && isPublic(data, 'height_cm') && (
                <span className="px-3 py-1 rounded-lg bg-theme-text/5 border border-theme-border/10 font-barlow text-sm text-theme-text/60">
                  {data.height_cm} cm
                </span>
              )}
              {data.weight_kg && isPublic(data, 'weight_kg') && (
                <span className="px-3 py-1 rounded-lg bg-theme-text/5 border border-theme-border/10 font-barlow text-sm text-theme-text/60">
                  {data.weight_kg} kg
                </span>
              )}
              {data.blood_type && isPublic(data, 'blood_type') && (
                <span className="px-3 py-1 rounded-lg bg-brand-red/10 border border-brand-red/20 font-barlow text-sm text-brand-red/70">
                  {data.blood_type}
                </span>
              )}
            </div>
          )}

          {/* Coach Experiences */}
          {type === 'coach' && data.coach_experiences && data.coach_experiences.length > 0 && (
            <div className="mb-6">
              <h3 className="font-barlow-condensed text-[#D4AF37] uppercase tracking-widest text-sm font-semibold mb-4">EXPERIÊNCIA</h3>
              <div className="space-y-3">
                {data.coach_experiences.map((exp, i) => (
                  <div key={i} className="border-l-2 border-[#D4AF37] pl-4 py-1">
                    <p className="text-sm text-theme-text/80 font-barlow font-medium">{exp.title}</p>
                    <p className="text-xs text-theme-text/40 font-barlow-condensed">
                      {exp.organization}
                      {exp.period_start && (
                        <span className="ml-1.5 text-theme-text/25">
                          {exp.period_start}{exp.period_end ? ` - ${exp.period_end}` : ' - Presente'}
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Info */}
          {((data.phone && isPublic(data, 'phone')) || (data.whatsapp && isPublic(data, 'whatsapp'))) && (
            <div className="flex flex-wrap items-center gap-4 mb-4">
              {data.phone && isPublic(data, 'phone') && (
                <span className="flex items-center gap-2 text-sm text-theme-text/50 font-barlow">
                  <Icon name="phone" size={14} /> {data.phone}
                </span>
              )}
              {data.whatsapp && isPublic(data, 'whatsapp') && (
                <a href={`https://wa.me/${data.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-green-400/70 hover:text-green-400 transition-colors font-barlow">
                  <Icon name="phone" size={14} /> WhatsApp
                </a>
              )}
            </div>
          )}

          {/* Social Links */}
          {((data.instagram && isPublic(data, 'instagram')) || (data.facebook && isPublic(data, 'facebook')) || (data.youtube && isPublic(data, 'youtube')) || (data.tiktok && isPublic(data, 'tiktok'))) && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-theme-border/[0.06]">
              {data.instagram && isPublic(data, 'instagram') && (() => {
                const h = data.instagram.replace(/^@/, '');
                return (
                  <a href={`https://instagram.com/${h}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-text/[0.04] border border-theme-border/[0.08] text-theme-text/50 hover:text-pink-400 hover:border-pink-400/30 transition-all">
                    <Icon name="instagram" size={14} /><span className="font-barlow text-xs">@{h}</span>
                  </a>
                );
              })()}
              {data.facebook && isPublic(data, 'facebook') && (() => {
                const isUrl = data.facebook.startsWith('http');
                return (
                  <a href={isUrl ? data.facebook : `https://facebook.com/${data.facebook}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-text/[0.04] border border-theme-border/[0.08] text-theme-text/50 hover:text-blue-400 hover:border-blue-400/30 transition-all">
                    <Icon name="facebook" size={14} /><span className="font-barlow text-xs">{isUrl ? 'Facebook' : data.facebook}</span>
                  </a>
                );
              })()}
              {data.youtube && isPublic(data, 'youtube') && (() => {
                const isUrl = data.youtube.startsWith('http');
                const h = data.youtube.replace(/^@/, '');
                return (
                  <a href={isUrl ? data.youtube : `https://youtube.com/@${h}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-text/[0.04] border border-theme-border/[0.08] text-theme-text/50 hover:text-red-400 hover:border-red-400/30 transition-all">
                    <Icon name="youtube" size={14} /><span className="font-barlow text-xs">{isUrl ? 'YouTube' : `@${h}`}</span>
                  </a>
                );
              })()}
              {data.tiktok && isPublic(data, 'tiktok') && (() => {
                const h = data.tiktok.replace(/^@/, '');
                return (
                  <a href={`https://tiktok.com/@${h}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-text/[0.04] border border-theme-border/[0.08] text-theme-text/50 hover:text-theme-text hover:border-theme-border/30 transition-all">
                    <Icon name="tiktok" size={14} /><span className="font-barlow text-xs">@{h}</span>
                  </a>
                );
              })()}
            </div>
          )}
        </div>
      </>
    );
  }

  // Render fighter panel content
  function renderFighterPanel() {
    return (
      <>
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#C41E3A]/20 to-[#C41E3A]/5 p-8">
          <button onClick={closeModal} className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-theme-text/10 border border-theme-border/10 flex items-center justify-center text-theme-text/40 hover:text-theme-text hover:border-theme-border/20 transition-all">
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
              <h2 className="font-bebas text-3xl text-theme-text tracking-wider">{selectedFighter.full_name}</h2>
              {selectedFighter.handle && (
                <p className="font-barlow text-sm text-theme-text/50">@{selectedFighter.handle}</p>
              )}
              <div className="flex items-center gap-3 mt-1 justify-center sm:justify-start">
                {(selectedFighter.city && isPublic(selectedFighter, 'city') || selectedFighter.state && isPublic(selectedFighter, 'state')) && (
                  <span className="flex items-center gap-1 text-theme-text/40 text-sm font-barlow">
                    <Icon name="map-pin" size={14} />
                    {[selectedFighter.city && isPublic(selectedFighter, 'city') ? selectedFighter.city : null, selectedFighter.state && isPublic(selectedFighter, 'state') ? selectedFighter.state : null].filter(Boolean).join(', ')}
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-barlow-condensed uppercase tracking-wider border ${selectedFighter.status === 'active' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-theme-text/5 border-theme-border/10 text-theme-text/40'}`}>
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
            {selectedFighter.bio && isPublic(selectedFighter, 'bio') && (
              <p className="font-barlow text-sm text-theme-text/60 leading-relaxed mb-6">{selectedFighter.bio}</p>
            )}

            {/* Profile Details */}
            {(() => {
              const f = selectedFighter;
              const details = [
                f.birth_date && isPublic(f, 'birth_date') && { label: 'Nascimento', value: new Date(f.birth_date).toLocaleDateString('pt-BR'), icon: 'calendar' },
                f.height_cm && isPublic(f, 'height_cm') && { label: 'Altura', value: `${f.height_cm} cm`, icon: 'user' },
                f.weight_kg && isPublic(f, 'weight_kg') && { label: 'Peso', value: `${f.weight_kg} kg`, icon: 'user' },
                f.blood_type && isPublic(f, 'blood_type') && { label: 'Tipo Sanguíneo', value: f.blood_type, icon: 'shield', accent: true },
                (f.city && isPublic(f, 'city') || f.state && isPublic(f, 'state')) && { label: 'Local', value: [f.city && isPublic(f, 'city') ? f.city : null, f.state && isPublic(f, 'state') ? f.state : null].filter(Boolean).join(', '), icon: 'map-pin' },
                f.phone && isPublic(f, 'phone') && { label: 'Telefone', value: f.phone, icon: 'phone' },
                f.whatsapp && isPublic(f, 'whatsapp') && { label: 'WhatsApp', value: f.whatsapp, icon: 'phone', href: `https://wa.me/${f.whatsapp.replace(/\D/g, '')}`, green: true },
              ].filter(Boolean);

              return details.length > 0 ? (
                <div className="mb-6">
                  <h3 className="font-barlow-condensed text-[#D4AF37] uppercase tracking-widest text-sm font-semibold mb-4">DETALHES DO PERFIL</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {details.map((d, i) => {
                      const content = (
                        <div key={i} className={`flex items-center gap-3 p-3 rounded-lg bg-theme-text/[0.02] border border-theme-border/[0.06] ${d.href ? 'hover:bg-theme-text/[0.05] transition-colors' : ''}`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${d.accent ? 'bg-brand-red/10' : d.green ? 'bg-green-500/10' : 'bg-theme-text/5'}`}>
                            <Icon name={d.icon} size={14} className={d.accent ? 'text-brand-red/60' : d.green ? 'text-green-400/60' : 'text-theme-text/30'} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-barlow-condensed text-[10px] uppercase tracking-widest text-theme-text/30">{d.label}</p>
                            <p className={`font-barlow text-sm truncate ${d.accent ? 'text-brand-red/70' : d.green ? 'text-green-400/70' : 'text-theme-text/60'}`}>{d.value}</p>
                          </div>
                        </div>
                      );
                      return d.href ? <a key={i} href={d.href} target="_blank" rel="noopener noreferrer">{content}</a> : content;
                    })}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Record */}
            <div className="mb-8">
              <FightRecordDisplay records={selectedFighter.fight_records || []} size="md" />
            </div>

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
                      <div key={index} className="p-4 bg-theme-text/[0.02] rounded-lg border-l-2 border-[#C41E3A]">
                        <div>
                          <p className="font-barlow-condensed text-lg text-theme-text">{fma.art_name}</p>
                          <div className="flex gap-3 mt-1">
                            {fma.level && (
                              <span className="font-barlow text-sm text-theme-text/50">
                                Nível: <span className="text-[#D4AF37]">{fma.level}</span>
                              </span>
                            )}
                            {fma.started_at && (() => {
                              const years = Math.floor((Date.now() - new Date(fma.started_at).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                              return years > 0 ? (
                                <span className="font-barlow text-sm text-theme-text/50">{years} {years === 1 ? 'ano' : 'anos'} praticando</span>
                              ) : (
                                <span className="font-barlow text-sm text-theme-text/50">Menos de 1 ano</span>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Coaches - clickable to slide */}
                        {activeCoaches.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-theme-border/[0.06]">
                            <p className="font-barlow-condensed text-xs uppercase tracking-widest text-[#D4AF37]/60 mb-2">Treinadores</p>
                            <div className="flex flex-wrap gap-2">
                              {activeCoaches.map((fc, i) => (
                                <button
                                  key={i}
                                  onClick={() => openCoachPanel(fc.coach?.id || fc.coach_id)}
                                  className="inline-flex items-center gap-2.5 px-3 py-2 rounded-lg bg-theme-text/[0.04] border border-theme-border/[0.08] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-all cursor-pointer"
                                >
                                  <Avatar name={fc.coach?.full_name} url={fc.coach?.avatar_url} size={28} />
                                  <div className="min-w-0 text-left">
                                    <p className="font-barlow-condensed text-sm text-theme-text leading-tight">{fc.coach?.full_name || 'Treinador'}</p>
                                    {fc.coach?.handle && <p className="font-barlow text-[10px] text-theme-text/30 leading-tight">@{fc.coach.handle}</p>}
                                  </div>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-theme-text/20 ml-1 flex-shrink-0"><path d="M9 18l6-6-6-6"/></svg>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Academies - clickable to slide */}
                        {activeAcademies.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-theme-border/[0.06]">
                            <p className="font-barlow-condensed text-xs uppercase tracking-widest text-blue-400/60 mb-2">Academias</p>
                            <div className="flex flex-wrap gap-2">
                              {activeAcademies.map((fa, i) => (
                                <button
                                  key={i}
                                  onClick={() => openAcademyPanel(fa.academy?.id || fa.academy_id)}
                                  className="inline-flex items-center gap-2.5 px-3 py-2 rounded-lg bg-theme-text/[0.04] border border-theme-border/[0.08] hover:bg-blue-500/10 hover:border-blue-500/30 transition-all cursor-pointer"
                                >
                                  <Avatar name={fa.academy?.full_name} url={fa.academy?.avatar_url} size={28} />
                                  <div className="min-w-0 text-left">
                                    <p className="font-barlow-condensed text-sm text-theme-text leading-tight">{fa.academy?.full_name || 'Academia'}</p>
                                    {fa.academy?.handle && <p className="font-barlow text-[10px] text-theme-text/30 leading-tight">@{fa.academy.handle}</p>}
                                  </div>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-theme-text/20 ml-1 flex-shrink-0"><path d="M9 18l6-6-6-6"/></svg>
                                </button>
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
                    <a key={i} href={video.youtube_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-theme-text/[0.02] rounded-lg border border-theme-border/[0.06] hover:bg-theme-text/[0.04] transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-[#C41E3A]/15 flex items-center justify-center flex-shrink-0 group-hover:bg-[#C41E3A]/25 transition-colors">
                        <Icon name="play" size={14} className="text-[#C41E3A]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-barlow-condensed text-theme-text text-sm truncate">{video.title || 'Vídeo'}</p>
                        {video.modality && <p className="font-barlow text-xs text-theme-text/30 truncate">{video.modality}</p>}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Social Links */}
            {((selectedFighter.instagram && isPublic(selectedFighter, 'instagram')) || (selectedFighter.facebook && isPublic(selectedFighter, 'facebook')) || (selectedFighter.youtube && isPublic(selectedFighter, 'youtube')) || (selectedFighter.tiktok && isPublic(selectedFighter, 'tiktok'))) && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-theme-border/[0.06]">
                {selectedFighter.instagram && isPublic(selectedFighter, 'instagram') && (() => {
                  const handle = selectedFighter.instagram.replace(/^@/, '');
                  return (
                    <a href={`https://instagram.com/${handle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-text/[0.04] border border-theme-border/[0.08] text-theme-text/50 hover:text-pink-400 hover:border-pink-400/30 transition-all">
                      <Icon name="instagram" size={14} /><span className="font-barlow text-xs">@{handle}</span>
                    </a>
                  );
                })()}
                {selectedFighter.facebook && isPublic(selectedFighter, 'facebook') && (() => {
                  const isUrl = selectedFighter.facebook.startsWith('http');
                  return (
                    <a href={isUrl ? selectedFighter.facebook : `https://facebook.com/${selectedFighter.facebook}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-text/[0.04] border border-theme-border/[0.08] text-theme-text/50 hover:text-blue-400 hover:border-blue-400/30 transition-all">
                      <Icon name="facebook" size={14} /><span className="font-barlow text-xs">{isUrl ? 'Facebook' : selectedFighter.facebook}</span>
                    </a>
                  );
                })()}
                {selectedFighter.youtube && isPublic(selectedFighter, 'youtube') && (() => {
                  const isUrl = selectedFighter.youtube.startsWith('http');
                  const handle = selectedFighter.youtube.replace(/^@/, '');
                  return (
                    <a href={isUrl ? selectedFighter.youtube : `https://youtube.com/@${handle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-text/[0.04] border border-theme-border/[0.08] text-theme-text/50 hover:text-red-400 hover:border-red-400/30 transition-all">
                      <Icon name="youtube" size={14} /><span className="font-barlow text-xs">{isUrl ? 'YouTube' : `@${handle}`}</span>
                    </a>
                  );
                })()}
                {selectedFighter.tiktok && isPublic(selectedFighter, 'tiktok') && (() => {
                  const handle = selectedFighter.tiktok.replace(/^@/, '');
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
      </>
    );
  }

  return (
    <main className="min-h-screen px-6 py-16 max-w-7xl mx-auto">
      {/* Slide animation styles */}
      <style jsx>{`
        @keyframes slideInLeft {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
        @keyframes slideInRight {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .slide-left {
          animation: slideInLeft 0.3s ease-out forwards;
        }
        .slide-right {
          animation: slideOutRight 0.3s ease-out forwards;
        }
        .slide-back {
          animation: slideInRight 0.3s ease-out forwards;
        }
      `}</style>

      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="font-bebas text-5xl text-theme-text tracking-wider">
          LUTADORES <span className="text-[#C41E3A]">CADASTRADOS</span>
        </h1>
        <p className="font-barlow text-theme-text/50 mt-3 text-lg">
          Encontre lutadores, veja cartéis e desafie oponentes
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

      {/* Fighters Grid */}
      {(() => {
        const term = search.toLowerCase().trim();
        const filtered = term
          ? fighters.filter(f =>
              (f.full_name || '').toLowerCase().includes(term) ||
              (f.handle || '').toLowerCase().includes(term)
            )
          : fighters;
        return filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((fighter) => {
            const martialArts = fighter.fighter_martial_arts || [];
            const fightRecords = fighter.fight_records || [];

            return (
              <div
                key={fighter.id}
                className="card-hover bg-gradient-to-b from-dark-card to-dark-card2 rounded-xl border border-theme-border/5 transition-all duration-300 hover:border-[#C41E3A]/30 group overflow-hidden"
              >
                {/* Top - clickable to open modal */}
                <div
                  onClick={() => openFighterModal(fighter)}
                  className="cursor-pointer p-5 pb-3"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar name={fighter.full_name} url={fighter.avatar_url} size={48} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bebas text-xl text-theme-text tracking-wide truncate group-hover:text-[#C41E3A] transition-colors">
                        {fighter.full_name}
                      </h3>
                      {fighter.handle && (
                        <p className="text-xs text-theme-text/40 font-barlow truncate -mt-0.5 mb-0.5">@{fighter.handle}</p>
                      )}
                      {fighter.city && (
                        <p className="text-xs text-theme-text/35 font-barlow truncate -mt-0.5 mb-0.5">{fighter.city}</p>
                      )}
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${fighter.status === 'active' ? 'bg-green-500' : 'bg-theme-text/30'}`} />
                        <span className="text-xs text-theme-text/40 font-barlow-condensed uppercase tracking-wider">
                          {fighter.status === 'active' ? 'Ativo' : fighter.status || 'Inativo'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Martial Arts Tags */}
                  {martialArts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {martialArts.map((art, i) => (
                        <span key={i} className="text-xs bg-theme-text/5 border border-theme-border/10 rounded-full px-2.5 py-0.5 text-theme-text/60 font-barlow-condensed">
                          {art.art_name}
                          {art.level && <span className="text-[#D4AF37] ml-1">{art.level}</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom - fight record (independent clicks) */}
                <div className="px-5 pb-5 pt-3 border-t border-theme-border/5">
                  <FightRecordDisplay records={fightRecords} size="sm" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="bg-gradient-to-br from-dark-card to-dark-card2 rounded-2xl border border-theme-border/[0.06] p-12 max-w-md mx-auto">
            <p className="font-bebas text-3xl text-theme-text/30 mb-2">🥊</p>
            <p className="font-barlow-condensed text-xl text-theme-text/40 uppercase tracking-wider">
              {term ? 'Nenhum lutador encontrado' : 'Nenhum lutador cadastrado ainda'}
            </p>
            <p className="font-barlow text-sm text-theme-text/25 mt-2">
              {term ? 'Tente buscar por outro nome ou handle.' : 'Os lutadores aparecerão aqui conforme se cadastrarem na plataforma.'}
            </p>
          </div>
        </div>
      );
      })()}

      {/* Fighter Detail Modal */}
      {selectedFighter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={closeModal}>
          <div
            ref={modalRef}
            className="bg-gradient-to-br from-dark-card to-dark-card2 rounded-2xl border border-theme-border/10 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-y-auto max-h-[90vh]">
              {/* Fighter content - hidden when slide panel is open */}
              {!slidePanel && (
                <div className={slideDirection === 'slide-right' ? '' : ''}>
                  {renderFighterPanel()}
                </div>
              )}

              {/* Slide panel for coach/academy */}
              {slidePanel && (
                <div className={slideDirection}>
                  {renderSlidePanel()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
