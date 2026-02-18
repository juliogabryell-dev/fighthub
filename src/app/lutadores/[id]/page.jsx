import { notFound } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { createPublicClient } from '@/lib/supabase/public';

export const dynamic = 'force-dynamic';

async function getFighter(id) {
  try {
    const supabase = createPublicClient();
    if (!supabase) return null;
    const { data: fighter, error } = await supabase
      .from('profiles')
      .select('*, fighter_martial_arts(*), fight_records!fight_records_fighter_id_fkey(*), fighter_coaches!fighter_coaches_fighter_id_fkey(*, coach:coach_id(id, full_name, avatar_url)), fighter_videos(*)')
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
        <Link
          href="/lutadores"
          className="inline-flex items-center gap-2 text-brand-red font-barlow-condensed uppercase tracking-wider text-sm mb-8 hover:text-brand-red/80 transition-colors"
        >
          <Icon name="chevronLeft" size={16} />
          Voltar
        </Link>

        <div className="text-center py-20">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/[0.06] p-12 max-w-md mx-auto">
            <p className="font-bebas text-3xl text-white/30 mb-3">👤</p>
            <p className="font-barlow-condensed text-xl text-white/40 uppercase tracking-wider">
              Perfil não encontrado
            </p>
            <p className="font-barlow text-sm text-white/25 mt-2">
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
  const wins = records.reduce((sum, r) => sum + (r.wins || 0), 0);
  const losses = records.reduce((sum, r) => sum + (r.losses || 0), 0);
  const draws = records.reduce((sum, r) => sum + (r.draws || 0), 0);

  return (
    <main className="min-h-screen px-6 py-12 max-w-4xl mx-auto">
      {/* Back Button */}
      <Link
        href="/lutadores"
        className="inline-flex items-center gap-2 text-brand-red font-barlow-condensed uppercase tracking-wider text-sm mb-8 hover:text-brand-red/80 transition-colors"
      >
        <Icon name="chevronLeft" size={16} />
        Voltar
      </Link>

      {/* Profile Card */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/[0.06] overflow-hidden">
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
              <h1 className="font-bebas text-4xl text-white tracking-wider">
                {fighter.full_name}
              </h1>
              {fighter.birth_date && (
                <p className="font-barlow text-sm text-white/40 mt-1">
                  Nascimento: {new Date(fighter.birth_date).toLocaleDateString('pt-BR')}
                </p>
              )}
              <span
                className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-barlow-condensed uppercase tracking-wider ${
                  fighter.status === 'active'
                    ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                    : 'bg-white/10 text-white/40 border border-white/10'
                }`}
              >
                {fighter.status === 'active' ? 'Ativo' : fighter.status}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-10">
          {/* Record Display */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="text-center p-6 bg-[#22c55e]/10 rounded-xl border border-[#22c55e]/20">
              <p className="font-bebas text-4xl text-[#22c55e]">{wins}</p>
              <p className="font-barlow-condensed text-sm text-white/40 uppercase tracking-widest mt-1">
                Vitórias
              </p>
            </div>
            <div className="text-center p-6 bg-brand-red/10 rounded-xl border border-brand-red/20">
              <p className="font-bebas text-4xl text-brand-red">{losses}</p>
              <p className="font-barlow-condensed text-sm text-white/40 uppercase tracking-widest mt-1">
                Derrotas
              </p>
            </div>
            <div className="text-center p-6 bg-brand-gold/10 rounded-xl border border-brand-gold/20">
              <p className="font-bebas text-4xl text-brand-gold">{draws}</p>
              <p className="font-barlow-condensed text-sm text-white/40 uppercase tracking-widest mt-1">
                Empates
              </p>
            </div>
          </div>

          {/* Martial Arts Section */}
          {fighter.fighter_martial_arts && fighter.fighter_martial_arts.length > 0 && (
            <div className="mb-10">
              <h2 className="font-barlow-condensed text-brand-gold uppercase tracking-widest text-sm font-semibold mb-4">
                ARTES MARCIAIS & EXPERIÊNCIA
              </h2>
              <div className="space-y-3">
                {fighter.fighter_martial_arts.map((fma, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-lg border-l-2 border-brand-red"
                  >
                    <div>
                      <p className="font-barlow-condensed text-lg text-white">
                        {fma.art_name || `Arte Marcial #${fma.martial_art_id}`}
                      </p>
                      <div className="flex gap-3 mt-1">
                        {fma.level && (
                          <span className="font-barlow text-sm text-white/50">
                            Nível: <span className="text-brand-gold">{fma.level}</span>
                          </span>
                        )}
                        {fma.started_at && (() => {
                          const years = Math.floor((Date.now() - new Date(fma.started_at).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                          return years > 0 ? (
                            <span className="font-barlow text-sm text-white/50">
                              {years} {years === 1 ? 'ano' : 'anos'} praticando
                            </span>
                          ) : (
                            <span className="font-barlow text-sm text-white/50">
                              Menos de 1 ano praticando
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coaches Section */}
          {fighter.fighter_coaches && fighter.fighter_coaches.length > 0 && (
            <div className="mb-10">
              <h2 className="font-barlow-condensed text-brand-gold uppercase tracking-widest text-sm font-semibold mb-4">
                TREINADORES
              </h2>
              <div className="space-y-3">
                {fighter.fighter_coaches.map((fc, index) => (
                  <Link
                    key={index}
                    href={`/treinadores/${fc.coach?.id || fc.coach_id}`}
                    className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-lg border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-gold/15 flex items-center justify-center flex-shrink-0">
                      <Icon name="award" size={18} className="text-brand-gold" />
                    </div>
                    <p className="font-barlow-condensed text-white">
                      {fc.coach?.full_name || 'Treinador'}
                    </p>
                  </Link>
                ))}
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
                    className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-lg border border-white/[0.06] hover:bg-white/[0.04] transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-red/15 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-red/25 transition-colors">
                      <Icon name="play" size={18} className="text-brand-red" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-barlow-condensed text-white truncate">
                        {video.title || 'Vídeo'}
                      </p>
                      {video.modality && (
                        <p className="font-barlow text-sm text-white/30 truncate">
                          {video.modality}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
