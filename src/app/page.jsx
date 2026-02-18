import Link from 'next/link';
import NewsCard from '@/components/NewsCard';
import Icon from '@/components/Icon';
import { scrapeNews } from '@/lib/scrapeNews';

const stats = [
  { icon: 'globe', value: '20+', label: 'Artes Marciais' },
  { icon: 'swords', value: '500+', label: 'Lutadores Ativos' },
  { icon: 'award', value: '100+', label: 'Treinadores' },
  { icon: 'star', value: '1K+', label: 'Lutas Registradas' },
];

export default async function HomePage() {
  const allNews = await scrapeNews();
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
            O Portal Definitivo de Artes Marciais
          </p>

          {/* Main Title */}
          <h1
            className="font-bebas leading-none tracking-wider mb-8"
            style={{ fontSize: 'clamp(48px, 10vw, 96px)' }}
          >
            <span className="text-white">CONECTE-SE.</span>
            <br />
            <span className="text-brand-red">TREINE.</span>
            <br />
            <span className="gradient-text">LUTE.</span>
          </h1>

          {/* Description */}
          <p className="font-barlow text-lg text-white/50 max-w-xl mx-auto mb-10">
            O FightHub conecta lutadores, treinadores e entusiastas de artes marciais em uma
            plataforma completa. Gerencie seu cartel, encontre oponentes e acompanhe sua evolução.
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
              Explorar Artes Marciais
            </Link>
          </div>
        </div>
      </section>

      {/* ====== STATS SECTION ====== */}
      <section className="max-w-7xl mx-auto py-16 px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="text-center p-8 bg-white/[0.02] rounded-xl border border-white/[0.06]"
            >
              <div className="flex justify-center mb-4">
                <Icon name={stat.icon} size={28} className="text-brand-red" />
              </div>
              <p className="font-bebas text-4xl text-brand-gold">{stat.value}</p>
              <p className="font-barlow-condensed text-sm text-white/40 uppercase tracking-widest mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ====== LATEST NEWS SECTION ====== */}
      <section className="px-6 pb-20 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-bebas text-4xl text-white">
            ÚLTIMAS{' '}
            <span className="text-brand-red">NOTÍCIAS</span>
          </h2>
          <Link
            href="/noticias"
            className="font-barlow-condensed uppercase text-sm text-brand-gold tracking-wider hover:text-brand-gold/80 transition-colors"
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
