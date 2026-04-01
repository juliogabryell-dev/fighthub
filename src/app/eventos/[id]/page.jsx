import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import EventDetailClient from './EventDetailClient';

export const revalidate = 3600;

async function getEvent(id) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data } = await supabase
    .from('events')
    .select('*, event_images(id, image_url, display_order)')
    .eq('id', id)
    .eq('is_published', true)
    .single();

  if (!data) return null;

  return {
    ...data,
    event_images: (data.event_images || []).sort((a, b) => a.display_order - b.display_order),
  };
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) return { title: 'Evento não encontrado' };
  return {
    title: `${event.title} - FightLog`,
    description: event.description_short,
  };
}

export default async function EventPage({ params }) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const eventDate = new Date(event.event_date);
  const formattedDate = eventDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = eventDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <main className="min-h-screen">
      {/* Back link */}
      <div className="max-w-5xl mx-auto px-6 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-barlow-condensed text-sm text-theme-text/40 uppercase tracking-wider hover:text-brand-red transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Voltar
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Image Gallery */}
        {event.event_images.length > 0 && (
          <EventDetailClient images={event.event_images} title={event.title} />
        )}

        {/* Event Info */}
        <div className="mt-8">
          {/* Date & Venue badges */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2 bg-brand-gold/10 border border-brand-gold/20 rounded-lg px-4 py-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-gold">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="font-barlow-condensed text-sm text-brand-gold uppercase tracking-wider font-semibold">
                {formattedDate} - {formattedTime}
              </span>
            </div>
            {(event.venue_name || event.venue_city) && (
              <div className="flex items-center gap-2 bg-theme-text/5 border border-theme-border/10 rounded-lg px-4 py-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-theme-text/50">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                <span className="font-barlow text-sm text-theme-text/60">
                  {[event.venue_name, event.venue_city].filter(Boolean).join(' - ')}
                </span>
              </div>
            )}
          </div>

          {/* Venue address */}
          {event.venue_address && (
            <p className="font-barlow text-sm text-theme-text/40 mb-4 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-theme-text/30 flex-shrink-0">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              {event.venue_address}
            </p>
          )}

          {/* Title */}
          <h1 className="font-bebas text-4xl sm:text-5xl text-theme-text tracking-wider leading-tight">
            {event.title}
          </h1>

          {/* Short description */}
          <p className="font-barlow text-lg text-theme-text/60 mt-3">
            {event.description_short}
          </p>

          {/* Action buttons */}
          {(event.payment_link || event.external_link) && (
            <div className="flex flex-wrap gap-3 mt-6">
              {event.payment_link && (
                <a
                  href={event.payment_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-barlow-condensed uppercase tracking-wider text-sm font-semibold px-6 py-3 rounded-lg bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-600/25 hover:shadow-green-600/40 transition-all duration-300"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Inscreva-se
                </a>
              )}
              {event.external_link && (
                <a
                  href={event.external_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-barlow-condensed uppercase tracking-wider text-sm font-semibold px-6 py-3 rounded-lg bg-transparent border border-brand-gold/40 text-brand-gold hover:bg-brand-gold/10 transition-all duration-300"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                  Site do Evento
                </a>
              )}
            </div>
          )}

          {/* Full description */}
          {event.description_full && (
            <div className="mt-10 pt-8 border-t border-theme-border/10">
              <h2 className="font-bebas text-2xl text-theme-text tracking-wider mb-4">
                SOBRE O <span className="text-brand-red">EVENTO</span>
              </h2>
              <div className="font-barlow text-theme-text/60 leading-relaxed whitespace-pre-line">
                {event.description_full}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
