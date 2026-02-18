import Link from 'next/link';
import Avatar from './Avatar';

export default function FighterCard({ fighter }) {
  const { id, full_name, status } = fighter;
  const martial_arts = fighter.fighter_martial_arts || [];
  const fight_records = fighter.fight_records || [];

  // Somar wins/losses/draws de todos os registros de cartel
  const wins = fight_records.reduce((sum, r) => sum + (r.wins || 0), 0);
  const losses = fight_records.reduce((sum, r) => sum + (r.losses || 0), 0);
  const draws = fight_records.reduce((sum, r) => sum + (r.draws || 0), 0);

  return (
    <Link href={`/lutadores/${id}`}>
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

        {/* Martial Arts Tags */}
        {martial_arts.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {martial_arts.map((art, i) => (
              <span
                key={i}
                className="text-xs bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5 text-white/60 font-barlow-condensed"
              >
                {art.art_name}
                {art.level && (
                  <span className="text-brand-gold ml-1">
                    {art.level}
                  </span>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Record Stats */}
        <div className="flex items-center gap-4 pt-3 border-t border-white/5">
          <div className="text-center flex-1">
            <span className="block font-bebas text-xl text-green-500">{wins}</span>
            <span className="text-[10px] uppercase tracking-wider text-white/30 font-barlow-condensed">
              Vitórias
            </span>
          </div>
          <div className="text-center flex-1">
            <span className="block font-bebas text-xl text-brand-red">{losses}</span>
            <span className="text-[10px] uppercase tracking-wider text-white/30 font-barlow-condensed">
              Derrotas
            </span>
          </div>
          <div className="text-center flex-1">
            <span className="block font-bebas text-xl text-white/50">{draws}</span>
            <span className="text-[10px] uppercase tracking-wider text-white/30 font-barlow-condensed">
              Empates
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
