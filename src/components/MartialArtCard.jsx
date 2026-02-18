import Link from 'next/link';
import Icon from './Icon';

export default function MartialArtCard({ art, index }) {
  const { id, name, origin, icon } = art;
  const number = String(index + 1).padStart(2, '0');

  return (
    <Link href={`/artes-marciais/${id}`}>
      <div className="card-hover bg-gradient-to-b from-dark-card to-dark-card2 rounded-xl border border-white/5 p-5 transition-all duration-300 hover:border-brand-red/30 group relative overflow-hidden">
        {/* Background Number */}
        <span className="absolute -top-2 -right-1 font-bebas text-[80px] leading-none text-white/[0.03] select-none pointer-events-none">
          #{number}
        </span>

        {/* Icon */}
        <div className="text-4xl mb-3">{icon || '🥋'}</div>

        {/* Name */}
        <h3 className="font-bebas text-2xl text-white tracking-wide mb-1 group-hover:text-brand-red transition-colors">
          {name}
        </h3>

        {/* Origin */}
        {origin && (
          <p className="text-xs text-white/40 font-barlow-condensed flex items-center gap-1 mb-4">
            <span>📍</span>
            {origin}
          </p>
        )}

        {/* Saiba mais link */}
        <div className="flex items-center gap-1 text-brand-red text-xs font-barlow-condensed uppercase tracking-wider font-semibold group-hover:gap-2 transition-all">
          Saiba mais
          <Icon name="chevronRight" size={14} />
        </div>
      </div>
    </Link>
  );
}
