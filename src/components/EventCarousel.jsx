'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';

export default function EventCarousel({ events }) {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(events.length / 3);

  const goNext = useCallback(() => {
    setPage((prev) => (prev >= totalPages - 1 ? 0 : prev + 1));
  }, [totalPages]);

  const goPrev = useCallback(() => {
    setPage((prev) => (prev <= 0 ? totalPages - 1 : prev - 1));
  }, [totalPages]);


  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  if (!events || events.length === 0) return null;

  // Current page events (3 per page)
  const pageEvents = events.slice(page * 3, page * 3 + 3);

  return (
    <section className="px-6 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="font-bebas text-4xl text-theme-text tracking-wider">
          FIQUE POR DENTRO DOS <span className="text-brand-red">EVENTOS</span>
        </h2>
        <div className="flex items-center justify-center gap-3 mt-4">
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                className="w-9 h-9 rounded-full bg-theme-text/5 border border-theme-border/10 flex items-center justify-center text-theme-text/40 hover:text-brand-red hover:border-brand-red/30 transition-all"
                aria-label="Anterior"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button
                onClick={goNext}
                className="w-9 h-9 rounded-full bg-theme-text/5 border border-theme-border/10 flex items-center justify-center text-theme-text/40 hover:text-brand-red hover:border-brand-red/30 transition-all"
                aria-label="Próximo"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          )}
          <Link
            href="/eventos"
            className="font-barlow-condensed uppercase text-sm text-brand-gold tracking-wider hover:text-brand-gold/80 transition-colors"
          >
            Ver Todos
          </Link>
        </div>
      </div>

      {/* Cards grid - 3 per page */}
      <div className={`grid gap-5 ${
        pageEvents.length === 1
          ? 'grid-cols-1 max-w-md mx-auto'
          : pageEvents.length === 2
            ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      }`}>
        {pageEvents.map((event) => (
          <EventCard key={event.id} event={event} formatDate={formatDate} />
        ))}
      </div>

      {/* Dots */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === page ? 'bg-brand-red w-6' : 'bg-theme-text/20 w-2 hover:bg-theme-text/40'
              }`}
              aria-label={`Página ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function EventCard({ event, formatDate }) {
  const mainImage = event.event_images?.[0];

  return (
    <div>
      {/* Card - clickable */}
      <Link href={`/eventos/${event.id}`} className="block">
        <div className="group relative bg-gradient-to-br from-dark-card to-dark-card2 rounded-2xl border border-theme-border/10 overflow-hidden hover:border-brand-red/30 transition-all duration-300 cursor-pointer">
          {/* Image */}
          <div className="aspect-[16/10] overflow-hidden bg-theme-text/5 relative">
            {mainImage ? (
              <img
                src={mainImage.image_url}
                alt={event.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-theme-text/10">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            )}
          </div>

          {/* Date badge */}
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10">
            <span className="font-barlow-condensed text-xs text-brand-gold uppercase tracking-wider font-semibold">
              {formatDate(event.event_date)}
            </span>
          </div>
        </div>
      </Link>

      {/* Links */}
      {(event.payment_link || event.external_link) && (
        <div className="flex gap-2 mt-2 px-1">
          {event.payment_link && (
            <a
              href={event.payment_link}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500/90 rounded-lg px-3 py-1.5 border border-green-400/20 font-barlow-condensed text-xs text-white uppercase tracking-wider font-semibold hover:bg-green-500 transition-colors"
            >
              Inscreva-se
            </a>
          )}
          {event.external_link && (
            <a
              href={event.external_link}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-theme-text/5 rounded-lg px-3 py-1.5 border border-theme-border/10 font-barlow-condensed text-xs text-theme-text/60 uppercase tracking-wider font-semibold hover:bg-theme-text/10 transition-colors"
            >
              Saiba Mais
            </a>
          )}
        </div>
      )}

      {/* Title + Description */}
      <Link href={`/eventos/${event.id}`} className="block mt-3 px-1 group">
        <h3 className="font-bebas text-xl text-theme-text tracking-wider leading-tight group-hover:text-brand-red transition-colors">
          {event.title}
        </h3>
        <p className="font-barlow text-sm text-theme-text/50 mt-1 line-clamp-2">
          {event.description_short}
        </p>
      </Link>
    </div>
  );
}
