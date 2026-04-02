'use client';

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Avatar from '@/components/Avatar';

export default function EventCarousel({ events }) {
  const [page, setPage] = useState(0);
  const [modalIndex, setModalIndex] = useState(null);

  const totalPages = Math.ceil(events.length / 3);

  const goNext = useCallback(() => {
    setPage((prev) => (prev >= totalPages - 1 ? 0 : prev + 1));
  }, [totalPages]);

  const goPrev = useCallback(() => {
    setPage((prev) => (prev <= 0 ? totalPages - 1 : prev - 1));
  }, [totalPages]);

  // Close modal on Escape, navigate with arrows
  useEffect(() => {
    if (modalIndex === null) return;
    function handleKey(e) {
      if (e.key === 'Escape') setModalIndex(null);
      if (e.key === 'ArrowRight') setModalIndex((prev) => (prev >= events.length - 1 ? 0 : prev + 1));
      if (e.key === 'ArrowLeft') setModalIndex((prev) => (prev <= 0 ? events.length - 1 : prev - 1));
    }
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [modalIndex, events.length]);

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  function formatDateFull(dateString) {
    const d = new Date(dateString);
    return d.toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    }) + ' - ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function openModal(eventId) {
    const idx = events.findIndex((e) => e.id === eventId);
    if (idx !== -1) setModalIndex(idx);
  }

  if (!events || events.length === 0) return null;

  const pageEvents = events.slice(page * 3, page * 3 + 3);
  const modalEvent = modalIndex !== null ? events[modalIndex] : null;

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

      {/* Cards grid */}
      <div className={`grid gap-5 ${
        pageEvents.length === 1
          ? 'grid-cols-1 max-w-md mx-auto'
          : pageEvents.length === 2
            ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      }`}>
        {pageEvents.map((event) => (
          <EventCard key={event.id} event={event} formatDate={formatDate} onOpen={openModal} />
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

      {/* Modal via portal */}
      {modalEvent && typeof document !== 'undefined' && createPortal(
        <EventModal
          event={modalEvent}
          eventIndex={modalIndex}
          totalEvents={events.length}
          formatDateFull={formatDateFull}
          onClose={() => setModalIndex(null)}
          onPrev={() => setModalIndex((prev) => (prev <= 0 ? events.length - 1 : prev - 1))}
          onNext={() => setModalIndex((prev) => (prev >= events.length - 1 ? 0 : prev + 1))}
        />,
        document.body
      )}
    </section>
  );
}

function EventCard({ event, formatDate, onOpen }) {
  const mainImage = event.event_images?.[0];

  return (
    <div>
      {/* Card - clickable to open modal */}
      <button onClick={() => onOpen(event.id)} className="block w-full text-left">
        <div className="group relative bg-gradient-to-br from-dark-card to-dark-card2 rounded-2xl border border-theme-border/10 overflow-hidden hover:border-brand-red/30 transition-all duration-300 cursor-pointer">
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
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10">
            <span className="font-barlow-condensed text-xs text-brand-gold uppercase tracking-wider font-semibold">
              {formatDate(event.event_date)}
            </span>
          </div>
        </div>
      </button>

      {/* Links */}
      {(event.payment_link || event.external_link) && (
        <div className="flex gap-2 mt-2 px-1">
          {event.payment_link && (
            <a href={event.payment_link} target="_blank" rel="noopener noreferrer" className="bg-green-500/90 rounded-lg px-3 py-1.5 border border-green-400/20 font-barlow-condensed text-xs text-white uppercase tracking-wider font-semibold hover:bg-green-500 transition-colors">
              Inscreva-se
            </a>
          )}
          {event.external_link && (
            <a href={event.external_link} target="_blank" rel="noopener noreferrer" className="bg-theme-text/5 rounded-lg px-3 py-1.5 border border-theme-border/10 font-barlow-condensed text-xs text-theme-text/60 uppercase tracking-wider font-semibold hover:bg-theme-text/10 transition-colors">
              Saiba Mais
            </a>
          )}
        </div>
      )}

      {/* Title + Venue + Description */}
      <button onClick={() => onOpen(event.id)} className="block mt-3 px-1 text-left group w-full">
        <h3 className="font-bebas text-xl text-theme-text tracking-wider leading-tight group-hover:text-brand-red transition-colors">
          {event.title}
        </h3>
        {(event.venue_name || event.venue_city) && (
          <p className="font-barlow text-xs text-theme-text/40 mt-1 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-theme-text/30 flex-shrink-0">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            {[event.venue_name, event.venue_city].filter(Boolean).join(' - ')}
          </p>
        )}
        <p className="font-barlow text-sm text-theme-text/50 mt-1 line-clamp-2">
          {event.description_short}
        </p>
      </button>
    </div>
  );
}

function EventModal({ event, eventIndex, totalEvents, formatDateFull, onClose, onPrev, onNext }) {
  const [imageIndex, setImageIndex] = useState(0);
  const images = event.event_images || [];
  const safeIndex = imageIndex < images.length ? imageIndex : 0;
  const currentImage = images[safeIndex];

  // Reset image index when event changes
  useEffect(() => {
    setImageIndex(0);
  }, [event.id]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-4" onClick={onClose}>
      <div
        className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/10 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        {images.length > 0 && currentImage && (
          <div className="relative aspect-[16/9] bg-black/40">
            <img
              src={currentImage.image_url}
              alt={event.title}
              className="w-full h-full object-contain"
            />
            {/* Image nav */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImageIndex((prev) => (prev <= 0 ? images.length - 1 : prev - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button
                  onClick={() => setImageIndex((prev) => (prev >= images.length - 1 ? 0 : prev + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
                <div className="absolute bottom-2 right-2 bg-black/60 rounded-lg px-2 py-0.5 border border-white/10">
                  <span className="font-barlow-condensed text-[10px] text-white/60">{imageIndex + 1}/{images.length}</span>
                </div>
              </>
            )}
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Date & venue */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <div className="flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-lg px-3 py-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#D4AF37]">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="font-barlow-condensed text-xs text-[#D4AF37] uppercase tracking-wider font-semibold">
                {formatDateFull(event.event_date)}
              </span>
            </div>
            {(event.venue_name || event.venue_city) && (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                <span className="font-barlow text-xs text-white/50">
                  {[event.venue_name, event.venue_city].filter(Boolean).join(' - ')}
                </span>
              </div>
            )}
          </div>

          {event.venue_address && (
            <p className="font-barlow text-xs text-white/30 mb-3 flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20 flex-shrink-0">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              {event.venue_address}
            </p>
          )}

          {/* Title */}
          <h2 className="font-bebas text-3xl text-white tracking-wider leading-tight">
            {event.title}
          </h2>

          {/* Short description */}
          <p className="font-barlow text-white/60 mt-2">
            {event.description_short}
          </p>

          {/* Action buttons */}
          {(event.payment_link || event.external_link) && (
            <div className="flex flex-wrap gap-3 mt-4">
              {event.payment_link && (
                <a href={event.payment_link} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-barlow-condensed uppercase tracking-wider text-xs font-semibold px-5 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-500 hover:to-green-600 transition-all">
                  Inscreva-se
                </a>
              )}
              {event.external_link && (
                <a href={event.external_link} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-barlow-condensed uppercase tracking-wider text-xs font-semibold px-5 py-2.5 rounded-lg border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all">
                  Site do Evento
                </a>
              )}
            </div>
          )}

          {/* Full description */}
          {event.description_full && (
            <div className="mt-5 pt-5 border-t border-white/10">
              <h3 className="font-bebas text-lg text-white tracking-wider mb-2">
                SOBRE O <span className="text-[#C41E3A]">EVENTO</span>
              </h3>
              <div className="font-barlow text-sm text-white/50 leading-relaxed whitespace-pre-line">
                {event.description_full}
              </div>
            </div>
          )}

          {/* Fighters */}
          {event.event_fighters && event.event_fighters.length > 0 && (
            <div className="mt-5 pt-5 border-t border-white/10">
              <h3 className="font-bebas text-lg text-white tracking-wider mb-3">
                LUTADORES <span className="text-[#C41E3A]">CONFIRMADOS</span>
                <span className="font-barlow text-xs text-white/30 ml-2 normal-case tracking-normal">({event.event_fighters.length})</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {event.event_fighters.map((ef) => (
                  <Link
                    key={ef.id}
                    href={`/lutadores/${ef.fighter?.id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-[#C41E3A]/10 hover:border-[#C41E3A]/30 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#C41E3A]/10 border border-[#C41E3A]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {ef.fighter?.avatar_url ? (
                        <img src={ef.fighter.avatar_url} alt={ef.fighter.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bebas text-lg text-[#C41E3A]">{ef.fighter?.full_name?.charAt(0) || '?'}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-barlow-condensed text-sm text-white truncate group-hover:text-[#C41E3A] transition-colors">{ef.fighter?.full_name}</p>
                      {ef.fighter?.handle && <p className="font-barlow text-[10px] text-white/30 truncate">@{ef.fighter.handle}</p>}
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/15 group-hover:text-[#C41E3A]/50 ml-auto flex-shrink-0 transition-colors"><path d="M9 18l6-6-6-6"/></svg>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Prev/Next navigation */}
          {totalEvents > 1 && (
            <div className="flex items-center justify-between mt-6 pt-5 border-t border-white/10">
              <button
                onClick={onPrev}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all font-barlow-condensed text-xs uppercase tracking-wider"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                Anterior
              </button>
              <span className="font-barlow-condensed text-xs text-white/30 uppercase tracking-wider">
                {eventIndex + 1} / {totalEvents}
              </span>
              <button
                onClick={onNext}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all font-barlow-condensed text-xs uppercase tracking-wider"
              >
                Próximo
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
