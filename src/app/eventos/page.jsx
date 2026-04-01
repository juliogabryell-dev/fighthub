import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

export const revalidate = 3600;

export const metadata = {
  title: 'Eventos - FightLog',
  description: 'Confira todos os próximos eventos de luta',
};

async function getEvents() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { upcoming: [], past: [] };

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const now = new Date().toISOString();

  const [{ data: upcoming }, { data: past }] = await Promise.all([
    supabase
      .from('events')
      .select('*, event_images(id, image_url, display_order)')
      .eq('is_published', true)
      .gte('event_date', now)
      .order('event_date', { ascending: true }),
    supabase
      .from('events')
      .select('*, event_images(id, image_url, display_order)')
      .eq('is_published', true)
      .lt('event_date', now)
      .order('event_date', { ascending: false })
      .limit(12),
  ]);

  const sortImages = (events) =>
    (events || []).map((e) => ({
      ...e,
      event_images: (e.event_images || []).sort((a, b) => a.display_order - b.display_order),
    }));

  return { upcoming: sortImages(upcoming), past: sortImages(past) };
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default async function EventosPage() {
  const { upcoming, past } = await getEvents();

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-bebas text-4xl sm:text-5xl text-theme-text tracking-wider">
            EVEN<span className="text-brand-red">TOS</span>
          </h1>
          <p className="font-barlow text-theme-text/50 mt-3 text-lg max-w-2xl mx-auto">
            Todos os eventos de luta cadastrados no FightLog
          </p>
        </div>

        {/* Upcoming Events */}
        {upcoming.length > 0 && (
          <section className="mb-16">
            <h2 className="font-bebas text-2xl text-theme-text tracking-wider mb-6">
              PRÓXIMOS <span className="text-brand-gold">EVENTOS</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* Past Events */}
        {past.length > 0 && (
          <section>
            <h2 className="font-bebas text-2xl text-theme-text tracking-wider mb-6">
              EVENTOS <span className="text-theme-text/40">PASSADOS</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 opacity-70">
              {past.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {upcoming.length === 0 && past.length === 0 && (
          <div className="text-center py-20">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-theme-text/15 mx-auto mb-4">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <p className="font-barlow text-theme-text/40 text-lg">Nenhum evento cadastrado ainda.</p>
          </div>
        )}
      </div>
    </main>
  );
}

function EventCard({ event }) {
  const mainImage = event.event_images?.[0];

  return (
    <div>
      <Link href={`/eventos/${event.id}`} className="block">
        <div className="group relative bg-gradient-to-br from-dark-card to-dark-card2 rounded-2xl border border-theme-border/10 overflow-hidden hover:border-brand-red/30 transition-all duration-300">
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
      </Link>

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
