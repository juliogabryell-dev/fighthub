import Link from 'next/link';
import NewsCard from '@/components/NewsCard';
import EventCarousel from '@/components/EventCarousel';
import { scrapeNews } from '@/lib/scrapeNews';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 3600;

async function getUpcomingEvents() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data } = await supabase
    .from('events')
    .select('*, event_images(id, image_url, display_order)')
    .eq('is_published', true)
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: false })
    .limit(10);

  return (data || []).map((event) => ({
    ...event,
    event_images: (event.event_images || []).sort((a, b) => a.display_order - b.display_order),
  }));
}

export default async function HomePage() {
  const [allNews, upcomingEvents] = await Promise.all([
    scrapeNews(),
    getUpcomingEvents(),
  ]);
  const latestNews = allNews.slice(0, 3);

  return (
    <main>
      {/* ====== HERO SECTION ====== */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Radial gradient overlays */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 30% 50%, rgba(196,30,58,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, rgba(212,175,55,0.08) 0%, transparent 60%)',
          }}
        />

        {/* Grid pattern overlay */}
        <div className="grid-pattern pointer-events-none absolute inset-0" />

        {/* Content */}
        <div className="relative z-10 text-center px-6">
          {/* Subtitle */}
          <p className="font-barlow-condensed text-sm text-brand-gold tracking-[6px] uppercase font-semibold mb-6">
            O Portal Definitivo de Modalidades
          </p>

          {/* Main Title */}
          <h1
            className="font-bebas leading-none tracking-wider mb-8"
            style={{ fontSize: 'clamp(48px, 10vw, 96px)' }}
          >
            <span className="text-theme-text">CONECTE-SE.</span>
            <br />
            <span className="text-brand-red">TREINE.</span>
            <br />
            <span className="gradient-text">LUTE.</span>
          </h1>

          {/* Description */}
          <p className="font-barlow text-lg text-theme-text/50 max-w-xl mx-auto mb-4">
            O FightLog conecta lutadores, treinadores e entusiastas de modalidades em uma
            plataforma completa. Gerencie seu cartel, encontre oponentes e acompanhe sua evolução.
          </p>

          {/* Tagline */}
          <p className="font-bebas text-2xl text-brand-gold tracking-wider mb-10">
            Se não está no Fight Log, não aconteceu!
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="font-barlow-condensed uppercase tracking-wider text-sm font-semibold px-8 py-3.5 rounded-lg bg-gradient-to-r from-brand-red to-brand-red-dark text-white shadow-lg shadow-brand-red/25 hover:shadow-brand-red/40 transition-all duration-300"
            >
              Cadastre-se Agora
            </Link>
            <Link
              href="/artes-marciais"
              className="font-barlow-condensed uppercase tracking-wider text-sm font-semibold px-8 py-3.5 rounded-lg bg-transparent border border-brand-gold/40 text-brand-gold hover:bg-brand-gold/10 transition-all duration-300"
            >
              Explorar Modalidades
            </Link>
          </div>
        </div>
      </section>

      {/* ====== EVENTS SECTION ====== */}
      {upcomingEvents.length > 0 && (
        <EventCarousel events={upcomingEvents} />
      )}

      {/* ====== PRICING SECTION ====== */}
      <section className="px-6 pb-20 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-bebas text-4xl sm:text-5xl text-theme-text tracking-wider">
            CONHEÇA NOSSOS{' '}
            <span className="text-brand-red">PLANOS</span>
          </h2>
          <p className="font-barlow text-theme-text/50 mt-3 text-lg max-w-2xl mx-auto">
            Escolha o plano ideal para registrar sua história no esporte
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Plano Lutador */}
          <div className="relative bg-gradient-to-br from-dark-card to-dark-card2 rounded-2xl border border-theme-border/10 p-8 flex flex-col hover:border-[#C41E3A]/30 transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-red/15 flex items-center justify-center">
                <span className="text-2xl">🥊</span>
              </div>
              <div>
                <h3 className="font-bebas text-2xl text-theme-text tracking-wider">PLANO LUTADOR</h3>
                <p className="font-barlow text-theme-text/40 text-xs">Para atletas amadores e profissionais</p>
              </div>
            </div>
            <div className="mb-6">
              <span className="font-bebas text-4xl text-[#C41E3A]">R$ 79</span>
              <span className="font-barlow text-theme-text/40 text-sm"> / ano</span>
            </div>
            <p className="font-barlow-condensed text-xs uppercase tracking-widest text-theme-text/30 mb-3">Inclui:</p>
            <ul className="space-y-2.5 flex-1">
              {[
                'Perfil público de lutador',
                'Registro ilimitado de lutas',
                'Confirmação e contestação de resultados',
                'Histórico permanente e público',
                'Exibição clara de lutas verificadas e não verificadas',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-[#C41E3A] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span className="font-barlow text-sm text-theme-text/60">{item}</span>
                </li>
              ))}
            </ul>
            <p className="font-barlow text-xs text-[#D4AF37]/60 italic mt-6 pt-4 border-t border-theme-border/5">
              Seu cartel não é marketing. É histórico.
            </p>
          </div>

          {/* Plano Academia / Clube */}
          <div className="relative bg-gradient-to-br from-dark-card to-dark-card2 rounded-2xl border border-[#D4AF37]/20 p-8 flex flex-col hover:border-[#D4AF37]/40 transition-all duration-300 group ring-1 ring-[#D4AF37]/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-gradient-to-r from-[#D4AF37] to-[#b8962e] text-dark-bg font-barlow-condensed text-[10px] uppercase tracking-widest font-bold px-4 py-1 rounded-full">
                Popular
              </span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center">
                <span className="text-2xl">🏆</span>
              </div>
              <div>
                <h3 className="font-bebas text-2xl text-theme-text tracking-wider">PLANO ACADEMIA / CLUBE</h3>
                <p className="font-barlow text-theme-text/40 text-xs">Para academias, clubes e equipes</p>
              </div>
            </div>
            <div className="mb-6">
              <span className="font-bebas text-4xl text-[#D4AF37]">R$ 399</span>
              <span className="font-barlow text-theme-text/40 text-sm"> / ano</span>
            </div>
            <p className="font-barlow-condensed text-xs uppercase tracking-widest text-theme-text/30 mb-3">Inclui:</p>
            <ul className="space-y-2.5 flex-1">
              {[
                'Página pública da academia ou clube',
                'Associação de atletas vinculados',
                'Confirmação de lutas como equipe',
                'Visibilidade institucional no Fight Log',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-[#D4AF37] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span className="font-barlow text-sm text-theme-text/60">{item}</span>
                </li>
              ))}
            </ul>
            <p className="font-barlow text-xs text-[#D4AF37]/60 italic mt-6 pt-4 border-t border-theme-border/5">
              Academias fortes constroem atletas com histórico real.
            </p>
          </div>

          {/* Plano Entidade Oficial */}
          <div className="relative bg-gradient-to-br from-dark-card to-dark-card2 rounded-2xl border border-theme-border/10 p-8 flex flex-col hover:border-blue-500/30 transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <span className="text-2xl">🏛️</span>
              </div>
              <div>
                <h3 className="font-bebas text-2xl text-theme-text tracking-wider">PLANO ENTIDADE OFICIAL</h3>
                <p className="font-barlow text-theme-text/40 text-xs">Para confederações, federações, associações e ligas</p>
              </div>
            </div>
            <div className="mb-6">
              <span className="font-bebas text-4xl text-blue-400">R$ 499</span>
              <span className="font-barlow text-theme-text/40 text-sm"> / ano</span>
            </div>
            <p className="font-barlow-condensed text-xs uppercase tracking-widest text-theme-text/30 mb-3">Inclui:</p>
            <ul className="space-y-2.5 flex-1">
              {[
                'Página institucional verificada',
                'Registro e confirmação oficial de lutas',
                'Associação de eventos, atletas e clubes',
                'Selo de entidade oficial no Fight Log',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span className="font-barlow text-sm text-theme-text/60">{item}</span>
                </li>
              ))}
            </ul>
            <p className="font-barlow text-xs text-blue-400/60 italic mt-6 pt-4 border-t border-theme-border/5">
              Transparência institucional fortalece o esporte.
            </p>
          </div>
        </div>
      </section>

      {/* ====== LATEST NEWS SECTION ====== */}
      <section className="px-6 pb-24 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="font-bebas text-4xl text-theme-text tracking-wider">
            ÚLTIMAS{' '}
            <span className="text-brand-red">NOTÍCIAS</span>
          </h2>
          <Link
            href="/noticias"
            className="font-barlow-condensed uppercase text-sm text-brand-gold tracking-wider hover:text-brand-gold/80 transition-colors mt-4 inline-block"
          >
            Ver Todas
          </Link>
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {latestNews.map((news) => (
            <NewsCard key={news.id} news={news} />
          ))}
        </div>
      </section>
    </main>
  );
}
