import { notFound } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { createClient } from '@supabase/supabase-js';
import ChallengeButton from './ChallengeButton';
import FightRecordDisplay from '@/components/FightRecordDisplay';
import FightRecordByModality from '@/components/FightRecordByModality';
import VerifiedBadge from '@/components/VerifiedBadge';
import BackButton from '@/components/BackButton';

export const dynamic = 'force-dynamic';

function isPublic(fighter, field) {
  const pf = fighter.public_fields;
  if (!pf) return true; // if no settings, show everything (backwards compat)
  return pf[field] !== false;
}

async function getFighter(id) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    const supabase = createClient(url, key);
    const { data: fighter, error } = await supabase
      .from('profiles')
      .select('*, fighter_martial_arts(*), fight_records!fight_records_fighter_id_fkey(*), fighter_coaches!fighter_coaches_fighter_id_fkey(*, coach:coach_id(id, full_name, avatar_url), martial_art:martial_art_id(id, art_name)), fighter_academies!fighter_academies_fighter_id_fkey(*, academy:academy_id(id, full_name, avatar_url), martial_art:martial_art_id(id, art_name)), fighter_videos(*)')
      .eq('id', id)
      .single();

    if (error || !fighter) {
      console.error('Erro ao buscar lutador:', error);
      return null;
    }
    return fighter;
  } catch (e) {
    console.error('Erro ao buscar lutador:', e);
    return null;
  }
}

export default async function FighterProfile({ params }) {
  const { id } = await params;
  const fighter = await getFighter(id);

  if (!fighter) {
    return (
      <main className="min-h-screen px-6 py-12 max-w-4xl mx-auto">
        <BackButton fallbackHref="/lutadores" />

        <div className="text-center py-20">
          <div className="bg-gradient-to-br from-dark-card to-dark-card2 rounded-2xl border border-theme-border/[0.06] p-12 max-w-md mx-auto">
            <p className="font-bebas text-3xl text-theme-text/30 mb-3">👤</p>
            <p className="font-barlow-condensed text-xl text-theme-text/40 uppercase tracking-wider">
              Perfil não encontrado
            </p>
            <p className="font-barlow text-sm text-theme-text/25 mt-2">
              O lutador pode ter sido removido ou o banco de dados não está configurado.
            </p>
            <Link
              href="/lutadores"
              className="inline-block mt-6 font-barlow-condensed uppercase tracking-wider text-sm font-semibold px-6 py-2.5 rounded-lg bg-gradient-to-r from-brand-red to-brand-red-dark text-white hover:shadow-brand-red/25 transition-all"
            >
              Ver Lutadores
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const records = fighter.fight_records || [];

  return (
    <main className="min-h-screen px-6 py-12 max-w-4xl mx-auto">
      {/* Back Button */}
      <BackButton fallbackHref="/lutadores" />

      {/* Profile Card */}
      <div className="bg-gradient-to-br from-dark-card to-dark-card2 rounded-2xl border border-theme-border/[0.06] overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-brand-red/20 to-brand-red/5 p-10">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-brand-red/20 border-2 border-brand-red/40 flex items-center justify-center overflow-hidden flex-shrink-0">
              {fighter.avatar_url ? (
                <img
                  src={fighter.avatar_url}
                  alt={fighter.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-bebas text-3xl text-brand-red">
                  {fighter.full_name?.charAt(0) || '?'}
                </span>
              )}
            </div>

            <div className="text-center sm:text-left">
              <h1 className="font-bebas text-4xl text-theme-text tracking-wider flex items-center gap-2">
                {fighter.full_name}
                {(fighter.fighter_verified || fighter.coach_verified || fighter.verified) && <VerifiedBadge size={22} />}
              </h1>
              {fighter.handle && (
                <p className="font-barlow text-sm text-theme-text/50 mt-0.5">
                  @{fighter.handle}
                </p>
              )}
              {fighter.birth_date && isPublic(fighter, 'birth_date') && (
                <p className="font-barlow text-sm text-theme-text/40 mt-1">
                  Nascimento: {new Date(fighter.birth_date).toLocaleDateString('pt-BR')}
                </p>
              )}
              <span
                className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-barlow-condensed uppercase tracking-wider ${
                  fighter.status === 'active'
                    ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                    : 'bg-theme-text/10 text-theme-text/40 border border-theme-border/10'
                }`}
              >
                {fighter.status === 'active' ? 'Ativo' : fighter.status}
              </span>
            </div>
          </div>
        </div>

        {/* Social Info */}
        {(fighter.bio || fighter.city || fighter.state || fighter.phone || fighter.whatsapp || fighter.height_cm || fighter.weight_kg || fighter.blood_type || fighter.instagram || fighter.facebook || fighter.youtube || fighter.tiktok) && (
          <div className="px-10 pt-6 pb-2 border-t border-theme-border/[0.06]">
            {fighter.bio && isPublic(fighter, 'bio') && (
              <p className="font-barlow text-sm text-theme-text/60 leading-relaxed mb-4">
                {fighter.bio}
              </p>
            )}

            {/* Physical info */}
            {((fighter.height_cm && isPublic(fighter, 'height_cm')) || (fighter.weight_kg && isPublic(fighter, 'weight_kg')) || (fighter.blood_type && isPublic(fighter, 'blood_type'))) && (
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {fighter.height_cm && isPublic(fighter, 'height_cm') && (
                  <span className="px-3 py-1 rounded-lg bg-theme-text/5 border border-theme-border/10 font-barlow text-sm text-theme-text/60">
                    {fighter.height_cm} cm
                  </span>
                )}
                {fighter.weight_kg && isPublic(fighter, 'weight_kg') && (
                  <span className="px-3 py-1 rounded-lg bg-theme-text/5 border border-theme-border/10 font-barlow text-sm text-theme-text/60">
                    {fighter.weight_kg} kg
                  </span>
                )}
                {fighter.blood_type && isPublic(fighter, 'blood_type') && (
                  <span className="px-3 py-1 rounded-lg bg-brand-red/10 border border-brand-red/20 font-barlow text-sm text-brand-red/70">
                    {fighter.blood_type}
                  </span>
                )}
              </div>
            )}

            {/* Parent names */}
            {((fighter.father_name && isPublic(fighter, 'father_name')) || (fighter.mother_name && isPublic(fighter, 'mother_name'))) && (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4">
                {fighter.father_name && isPublic(fighter, 'father_name') && (
                  <div className="flex items-center gap-2 text-theme-text/50">
                    <Icon name="user" size={14} />
                    <span className="font-barlow text-sm">Pai: {fighter.father_name}</span>
                  </div>
                )}
                {fighter.mother_name && isPublic(fighter, 'mother_name') && (
                  <div className="flex items-center gap-2 text-theme-text/50">
                    <Icon name="user" size={14} />
                    <span className="font-barlow text-sm">Mãe: {fighter.mother_name}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              {(fighter.city && isPublic(fighter, 'city') || fighter.state && isPublic(fighter, 'state')) && (
                <div className="flex items-center gap-2 text-theme-text/50">
                  <Icon name="map-pin" size={16} />
                  <span className="font-barlow text-sm">
                    {[fighter.city && isPublic(fighter, 'city') ? fighter.city : null, fighter.state && isPublic(fighter, 'state') ? fighter.state : null].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}

              {fighter.phone && isPublic(fighter, 'phone') && (
                <div className="flex items-center gap-2 text-theme-text/50">
                  <Icon name="phone" size={16} />
                  <span className="font-barlow text-sm">{fighter.phone}</span>
                </div>
              )}

              {fighter.whatsapp && isPublic(fighter, 'whatsapp') && (
                <a href={`https://wa.me/${fighter.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-green-400/70 hover:text-green-400 transition-colors">
                  <Icon name="phone" size={16} />
                  <span className="font-barlow text-sm">WhatsApp</span>
                </a>
              )}
            </div>

            {((fighter.instagram && isPublic(fighter, 'instagram')) || (fighter.facebook && isPublic(fighter, 'facebook')) || (fighter.youtube && isPublic(fighter, 'youtube')) || (fighter.tiktok && isPublic(fighter, 'tiktok'))) && (
              <div className="flex flex-wrap items-center gap-3 mt-4">
                {fighter.instagram && isPublic(fighter, 'instagram') && (() => {
                  const handle = fighter.instagram.replace(/^@/, '');
                  return (
                    <a
                      href={`https://instagram.com/${handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-text/[0.04] border border-theme-border/[0.08] text-theme-text/50 hover:text-pink-400 hover:border-pink-400/30 hover:bg-pink-400/10 transition-all"
                    >
                      <Icon name="instagram" size={16} />
                      <span className="font-barlow text-xs">@{handle}</span>
                    </a>
                  );
                })()}

                {fighter.facebook && isPublic(fighter, 'facebook') && (() => {
                  const isUrl = fighter.facebook.startsWith('http');
                  const href = isUrl ? fighter.facebook : `https://facebook.com/${fighter.facebook}`;
                  const displayName = isUrl ? 'Facebook' : fighter.facebook;
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-text/[0.04] border border-theme-border/[0.08] text-theme-text/50 hover:text-blue-400 hover:border-blue-400/30 hover:bg-blue-400/10 transition-all"
                    >
                      <Icon name="facebook" size={16} />
                      <span className="font-barlow text-xs">{displayName}</span>
                    </a>
                  );
                })()}

                {fighter.youtube && isPublic(fighter, 'youtube') && (() => {
                  const isUrl = fighter.youtube.startsWith('http');
                  const handle = fighter.youtube.replace(/^@/, '');
                  const href = isUrl ? fighter.youtube : `https://youtube.com/@${handle}`;
                  const displayName = isUrl ? 'YouTube' : `@${handle}`;
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-text/[0.04] border border-theme-border/[0.08] text-theme-text/50 hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/10 transition-all"
                    >
                      <Icon name="youtube" size={16} />
                      <span className="font-barlow text-xs">{displayName}</span>
                    </a>
                  );
                })()}

                {fighter.tiktok && isPublic(fighter, 'tiktok') && (() => {
                  const handle = fighter.tiktok.replace(/^@/, '');
                  return (
                    <a
                      href={`https://tiktok.com/@${handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-text/[0.04] border border-theme-border/[0.08] text-theme-text/50 hover:text-theme-text hover:border-theme-border/30 hover:bg-theme-text/10 transition-all"
                    >
                      <Icon name="tiktok" size={16} />
                      <span className="font-barlow text-xs">@{handle}</span>
                    </a>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-10">
          {/* Record Display - Total */}
          <div className="mb-6">
            <h3 className="font-barlow-condensed text-brand-gold uppercase tracking-widest text-sm font-semibold mb-3">CARTEL GERAL</h3>
            <FightRecordDisplay records={records} size="lg" />
          </div>

          {/* Record Display - By Modality */}
          {records.length > 0 && (
            <div className="mb-10">
              <h3 className="font-barlow-condensed text-brand-gold uppercase tracking-widest text-sm font-semibold mb-3">CARTEL POR MODALIDADE</h3>
              <FightRecordByModality records={records} modalities={fighter.fighter_martial_arts || []} />
            </div>
          )}

          {/* Martial Arts Section with Coaches/Academies per modality */}
          {fighter.fighter_martial_arts && fighter.fighter_martial_arts.length > 0 && (
            <div className="mb-10">
              <h2 className="font-barlow-condensed text-brand-gold uppercase tracking-widest text-sm font-semibold mb-4">
                MODALIDADES & EXPERIÊNCIA
              </h2>
              <div className="space-y-4">
                {fighter.fighter_martial_arts.map((fma, index) => {
                  const activeCoaches = (fighter.fighter_coaches || []).filter(fc => fc.martial_art_id === fma.id && fc.status === 'active');
                  const activeAcademies = (fighter.fighter_academies || []).filter(fa => fa.martial_art_id === fma.id && fa.status === 'active');
                  return (
                    <div
                      key={index}
                      className="p-4 bg-theme-text/[0.02] rounded-lg border-l-2 border-brand-red"
                    >
                      <div>
                        <p className="font-barlow-condensed text-lg text-theme-text">
                          {fma.art_name || `Arte Marcial #${fma.martial_art_id}`}
                        </p>
                        <div className="flex gap-3 mt-1">
                          {fma.level && (
                            <span className="font-barlow text-sm text-theme-text/50">
                              Nível: <span className="text-brand-gold">{fma.level}</span>
                            </span>
                          )}
                          {fma.started_at && (() => {
                            const years = Math.floor((Date.now() - new Date(fma.started_at).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                            return years > 0 ? (
                              <span className="font-barlow text-sm text-theme-text/50">
                                {years} {years === 1 ? 'ano' : 'anos'} praticando
                              </span>
                            ) : (
                              <span className="font-barlow text-sm text-theme-text/50">
                                Menos de 1 ano praticando
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Coaches for this modality */}
                      {activeCoaches.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-theme-border/[0.06]">
                          <p className="font-barlow-condensed text-xs uppercase tracking-widest text-brand-gold/60 mb-2">
                            Treinadores
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {activeCoaches.map((fc, i) => (
                              <Link
                                key={i}
                                href={`/treinadores/${fc.coach?.id || fc.coach_id}`}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-text/[0.04] border border-theme-border/[0.08] hover:bg-theme-text/[0.08] transition-colors"
                              >
                                <div className="w-6 h-6 rounded-full bg-brand-gold/15 flex items-center justify-center flex-shrink-0">
                                  <Icon name="award" size={12} className="text-brand-gold" />
                                </div>
                                <span className="font-barlow-condensed text-sm text-theme-text">
                                  {fc.coach?.full_name || 'Treinador'}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Academies for this modality */}
                      {activeAcademies.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-theme-border/[0.06]">
                          <p className="font-barlow-condensed text-xs uppercase tracking-widest text-blue-400/60 mb-2">
                            Academias
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {activeAcademies.map((fa, i) => (
                              <Link
                                key={i}
                                href={`/academias/${fa.academy?.id || fa.academy_id}`}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-text/[0.04] border border-theme-border/[0.08] hover:bg-theme-text/[0.08] transition-colors"
                              >
                                <div className="w-6 h-6 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                                  <Icon name="home" size={12} className="text-blue-400" />
                                </div>
                                <span className="font-barlow-condensed text-sm text-theme-text">
                                  {fa.academy?.full_name || 'Academia'}
                                </span>
                              </Link>
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

          {/* Videos Section */}
          {fighter.fighter_videos && fighter.fighter_videos.length > 0 && (
            <div>
              <h2 className="font-barlow-condensed text-brand-gold uppercase tracking-widest text-sm font-semibold mb-4">
                VÍDEOS
              </h2>
              <div className="space-y-3">
                {fighter.fighter_videos.map((video, index) => (
                  <a
                    key={index}
                    href={video.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-theme-text/[0.02] rounded-lg border border-theme-border/[0.06] hover:bg-theme-text/[0.04] transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-red/15 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-red/25 transition-colors">
                      <Icon name="play" size={18} className="text-brand-red" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-barlow-condensed text-theme-text truncate">
                        {video.title || 'Vídeo'}
                      </p>
                      {video.modality && (
                        <p className="font-barlow text-sm text-theme-text/30 truncate">
                          {video.modality}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Challenge Button */}
          <div className="mt-10 pt-8 border-t border-theme-border/[0.06] flex justify-center">
            <ChallengeButton fighterId={id} />
          </div>
        </div>
      </div>
    </main>
  );
}
