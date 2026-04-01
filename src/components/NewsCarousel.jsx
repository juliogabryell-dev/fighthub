'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import NewsCard from '@/components/NewsCard';

export default function NewsCarousel({ news }) {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(news.length / 3);

  const goNext = useCallback(() => {
    setPage((prev) => (prev >= totalPages - 1 ? 0 : prev + 1));
  }, [totalPages]);

  const goPrev = useCallback(() => {
    setPage((prev) => (prev <= 0 ? totalPages - 1 : prev - 1));
  }, [totalPages]);

  if (!news || news.length === 0) return null;

  const pageNews = news.slice(page * 3, page * 3 + 3);

  return (
    <section className="px-6 pb-24 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="font-bebas text-4xl text-theme-text tracking-wider">
          ÚLTIMAS{' '}
          <span className="text-brand-red">NOTÍCIAS</span>
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
            href="/noticias"
            className="font-barlow-condensed uppercase text-sm text-brand-gold tracking-wider hover:text-brand-gold/80 transition-colors"
          >
            Ver Todas
          </Link>
        </div>
      </div>

      {/* Cards grid - 3 per page */}
      <div className={`grid gap-5 ${
        pageNews.length === 1
          ? 'grid-cols-1 max-w-md mx-auto'
          : pageNews.length === 2
            ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      }`}>
        {pageNews.map((item) => (
          <NewsCard key={item.id} news={item} />
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
