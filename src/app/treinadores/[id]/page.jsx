import { notFound } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

async function getCoach(id) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    const supabase = createClient(url, key);
    const { data: coach, error } = await supabase
      .from('profiles')
      .select('*, coach_experiences(*)')
      .eq('id', id)
      .single();

    if (error || !coach) {
      console.error('Erro ao buscar treinador:', error);
      return null;
    }
    return coach;
  } catch (e) {
    console.error('Erro ao buscar treinador:', e);
    return null;
  }
}

export default async function CoachProfile({ params }) {
  const { id } = await params;
  const coach = await getCoach(id);

  if (!coach) {
    return (
      <main className="min-h-screen px-6 py-12 max-w-4xl mx-auto">
        <Link
          href="/treinadores"
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
              O treinador pode ter sido removido ou o banco de dados não está configurado.
            </p>
            <Link
              href="/treinadores"
              className="inline-block mt-6 font-barlow-condensed uppercase tracking-wider text-sm font-semibold px-6 py-2.5 rounded-lg bg-gradient-to-r from-brand-gold to-yellow-600 text-black hover:shadow-brand-gold/25 transition-all"
            >
              Ver Treinadores
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const experiences = coach.coach_experiences || [];
  const sortedExperiences = [...experiences].sort((a, b) => {
    if (a.period_start && b.period_start) return b.period_start.localeCompare(a.period_start);
    return 0;
  });

  return (
    <main className="min-h-screen px-6 py-12 max-w-4xl mx-auto">
      {/* Back Button */}
      <Link
        href="/treinadores"
        className="inline-flex items-center gap-2 text-brand-red font-barlow-condensed uppercase tracking-wider text-sm mb-8 hover:text-brand-red/80 transition-colors"
      >
        <Icon name="chevronLeft" size={16} />
        Voltar
      </Link>

      {/* Profile Card */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/[0.06] overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 p-10">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-brand-gold/20 border-2 border-brand-gold/40 flex items-center justify-center overflow-hidden flex-shrink-0">
              {coach.avatar_url ? (
                <img
                  src={coach.avatar_url}
                  alt={coach.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-bebas text-3xl text-brand-gold">
                  {coach.full_name?.charAt(0) || '?'}
                </span>
              )}
            </div>

            <div className="text-center sm:text-left">
              <h1 className="font-bebas text-4xl text-white tracking-wider">
                {coach.full_name}
              </h1>
              {coach.birth_date && (
                <p className="font-barlow text-sm text-white/40 mt-1">
                  Nascimento: {new Date(coach.birth_date).toLocaleDateString('pt-BR')}
                </p>
              )}
              <span
                className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-barlow-condensed uppercase tracking-wider ${
                  coach.status === 'active'
                    ? 'bg-brand-gold/15 text-brand-gold border border-brand-gold/30'
                    : 'bg-white/10 text-white/40 border border-white/10'
                }`}
              >
                {coach.status === 'active' ? 'Ativo' : coach.status}
              </span>
            </div>
          </div>
        </div>

        {/* Content - Experiences Timeline */}
        <div className="p-10">
          {sortedExperiences.length > 0 ? (
            <div>
              <h2 className="font-barlow-condensed text-brand-gold uppercase tracking-widest text-sm font-semibold mb-6">
                EXPERIÊNCIA PROFISSIONAL
              </h2>

              <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-brand-red/30" />

                {/* Experience Items */}
                <div className="space-y-6">
                  {sortedExperiences.map((exp, index) => (
                    <div key={index} className="relative pl-10">
                      {/* Dot */}
                      <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-brand-red/20 border-2 border-brand-red flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-brand-red" />
                      </div>

                      {/* Experience Card */}
                      <div className="p-5 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                        <h3 className="font-barlow-condensed text-lg text-white">
                          {exp.title || 'Experiência'}
                        </h3>
                        {exp.organization && (
                          <p className="font-barlow-condensed text-sm text-brand-gold mt-1">
                            {exp.organization}
                          </p>
                        )}
                        {(exp.period_start || exp.period_end) && (
                          <p className="font-barlow text-xs text-white/30 mt-1">
                            {exp.period_start}
                            {exp.period_end ? ` - ${exp.period_end}` : ' - Presente'}
                          </p>
                        )}
                        {exp.description && (
                          <p className="font-barlow text-sm text-white/50 mt-3 leading-relaxed">
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
            <div className="text-center py-8">
              <p className="font-barlow-condensed text-white/30 uppercase tracking-wider text-sm">
                Nenhuma experiência cadastrada
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
