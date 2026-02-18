const CATEGORY_EMOJIS = {
  noticia: '📰',
  evento: '🏆',
  entrevista: '🎤',
  analise: '📊',
  resultado: '🥇',
  default: '📋',
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr; // Return as-is if not a valid date
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function NewsCard({ news }) {
  const { title, summary, category, image_url, published_at, url } = news;
  const emoji =
    CATEGORY_EMOJIS[category?.toLowerCase()] || CATEGORY_EMOJIS.default;

  const card = (
    <div className="card-hover bg-gradient-to-b from-dark-card to-dark-card2 rounded-xl border border-white/5 overflow-hidden transition-all duration-300 hover:border-brand-red/30 group h-full">
      {/* Image Area */}
      <div className="relative h-44 overflow-hidden">
        {image_url ? (
          <img
            src={image_url}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-dark-card2 to-dark-bg flex items-center justify-center">
            <span className="text-5xl opacity-30">{emoji}</span>
          </div>
        )}
        {/* Category Tag */}
        {category && (
          <span className="absolute top-3 left-3 bg-brand-red/90 text-white text-[10px] font-barlow-condensed uppercase tracking-wider px-2.5 py-1 rounded-full font-semibold backdrop-blur-sm">
            {category}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Date */}
        {published_at && (
          <p className="text-[11px] text-white/30 font-barlow-condensed uppercase tracking-wider mb-1.5">
            {formatDate(published_at)}
          </p>
        )}

        {/* Title */}
        <h3 className="font-bebas text-lg text-white tracking-wide leading-tight mb-2 group-hover:text-brand-red transition-colors line-clamp-2">
          {title}
        </h3>

        {/* Summary */}
        {summary && (
          <p className="text-xs text-white/40 font-barlow leading-relaxed line-clamp-3">
            {summary}
          </p>
        )}
      </div>
    </div>
  );

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block no-underline"
      >
        {card}
      </a>
    );
  }

  return card;
}
