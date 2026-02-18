import Link from 'next/link';
import Avatar from './Avatar';

export default function CoachCard({ coach }) {
  const { id, full_name, avatar_url, status } = coach;
  const experiences = coach.coach_experiences || [];
  const displayExperiences = experiences.slice(0, 2);

  return (
    <Link href={`/treinadores/${id}`}>
      <div className="card-hover bg-gradient-to-b from-dark-card to-dark-card2 rounded-xl border border-white/5 p-5 transition-all duration-300 hover:border-brand-red/30 group">
        {/* Header: Avatar + Name + Status */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar name={full_name} size={48} />
          <div className="flex-1 min-w-0">
            <h3 className="font-bebas text-xl text-white tracking-wide truncate group-hover:text-brand-red transition-colors">
              {full_name}
            </h3>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  status === 'active' ? 'bg-green-500' : 'bg-white/30'
                }`}
              />
              <span className="text-xs text-white/40 font-barlow-condensed uppercase tracking-wider">
                {status === 'active' ? 'Ativo' : status || 'Inativo'}
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
                className="border-l-2 border-brand-gold pl-3 py-0.5"
              >
                <p className="text-sm text-white/80 font-barlow font-medium leading-tight">
                  {exp.title}
                </p>
                <p className="text-xs text-white/40 font-barlow-condensed">
                  {exp.organization}
                  {exp.period_start && (
                    <span className="ml-1.5 text-white/25">
                      {exp.period_start}
                      {exp.period_end ? ` - ${exp.period_end}` : ' - Presente'}
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-white/25 font-barlow italic">
            Nenhuma experiência cadastrada
          </p>
        )}
      </div>
    </Link>
  );
}
