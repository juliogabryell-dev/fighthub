'use client';

import { useState, useEffect, useRef } from 'react';

export default function EventCarousel({ events }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const intervalRef = useRef(null);

  const maxIndex = Math.max(0, events.length - 3);

  useEffect(() => {
    if (!isAutoPlaying || events.length <= 3) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, [isAutoPlaying, maxIndex, events.length]);

  function goTo(direction) {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => {
      if (direction === 'prev') return prev <= 0 ? maxIndex : prev - 1;
      return prev >= maxIndex ? 0 : prev + 1;
    });
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  if (!events || events.length === 0) return null;

  return (
    <section className="px-6 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="font-bebas text-4xl sm:text-5xl text-theme-text tracking-wider">
          SE{' '}
          <span className="text-brand-red">LIGA</span>
        </h2>
        <p className="font-barlow text-theme-text/50 mt-3 text-lg max-w-2xl mx-auto">
          Confira os próximos eventos
        </p>
      </div>
      {events.length > 3 && (
        <div className="flex items-center justify-end gap-2 mb-4">
          <button
            onClick={() => goTo('prev')}
            className="w-10 h-10 rounded-full bg-theme-text/5 border border-theme-border/10 flex items-center justify-center text-theme-text/40 hover:text-brand-red hover:border-brand-red/30 transition-all"
            aria-label="Anterior"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button
            onClick={() => goTo('next')}
            className="w-10 h-10 rounded-full bg-theme-text/5 border border-theme-border/10 flex items-center justify-center text-theme-text/40 hover:text-brand-red hover:border-brand-red/30 transition-all"
            aria-label="Próximo"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      )}

      {/* Carousel */}
      <div className="overflow-hidden">
        <div
          className="flex gap-5 transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / Math.min(events.length, 3) + (events.length >= 3 ? 1.67 : 0))}%)`,
          }}
        >
          {events.map((event) => {
            const mainImage = event.event_images?.[0];
            return (
              <div
                key={event.id}
                className="flex-shrink-0 w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]"
              >
                {/* Card */}
                <div className="group relative bg-gradient-to-br from-dark-card to-dark-card2 rounded-2xl border border-theme-border/10 overflow-hidden hover:border-brand-red/30 transition-all duration-300">
                  {/* Image */}
                  <div className="aspect-[16/10] overflow-hidden bg-theme-text/5">
                    {mainImage ? (
                      <img
                        src={mainImage.image_url}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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

                  {/* Links */}
                  {(event.payment_link || event.external_link) && (
                    <div className="absolute top-3 left-3 flex gap-2">
                      {event.payment_link && (
                        <a
                          href={event.payment_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-green-500/90 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-green-400/20 font-barlow-condensed text-xs text-white uppercase tracking-wider font-semibold hover:bg-green-500 transition-colors"
                        >
                          Inscreva-se
                        </a>
                      )}
                      {event.external_link && (
                        <a
                          href={event.external_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10 font-barlow-condensed text-xs text-white/80 uppercase tracking-wider font-semibold hover:bg-white/20 transition-colors"
                        >
                          Saiba Mais
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Title + Description below card */}
                <div className="mt-3 px-1">
                  <h3 className="font-bebas text-xl text-theme-text tracking-wider leading-tight">
                    {event.title}
                  </h3>
                  <p className="font-barlow text-sm text-theme-text/50 mt-1 line-clamp-2">
                    {event.description_short}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dots indicator */}
      {events.length > 3 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: maxIndex + 1 }, (_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentIndex(i); setIsAutoPlaying(false); }}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex ? 'bg-brand-red w-6' : 'bg-theme-text/20 hover:bg-theme-text/40'
              }`}
              aria-label={`Ir para slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
