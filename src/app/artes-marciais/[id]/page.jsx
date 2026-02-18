import { notFound } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { MARTIAL_ARTS_DATA } from '@/lib/constants';

export async function generateStaticParams() {
  return MARTIAL_ARTS_DATA.map((art) => ({
    id: String(art.id),
  }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const art = MARTIAL_ARTS_DATA.find((a) => a.id === parseInt(id));
  if (!art) return { title: 'Não encontrado | FightHub' };
  return { title: `${art.name} | FightHub` };
}

export default async function MartialArtDetail({ params }) {
  const { id } = await params;
  const art = MARTIAL_ARTS_DATA.find((a) => a.id === parseInt(id));

  if (!art) {
    notFound();
  }

  return (
    <main className="min-h-screen px-6 py-12 max-w-4xl mx-auto">
      {/* Back Button */}
      <Link
        href="/artes-marciais"
        className="inline-flex items-center gap-2 text-brand-red font-barlow-condensed uppercase tracking-wider text-sm mb-8 hover:text-brand-red/80 transition-colors"
      >
        <Icon name="chevronLeft" size={16} />
        Voltar
      </Link>

      {/* Card Container */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/[0.06] overflow-hidden">
        {/* Header Area */}
        <div className="relative h-48 bg-gradient-to-br from-brand-red/30 to-brand-gold/15 flex items-center justify-center">
          <span className="text-[72px]">{art.icon}</span>
        </div>

        {/* Content Area */}
        <div className="p-10">
          {/* Title */}
          <h1 className="font-bebas text-5xl text-white tracking-wider mb-4">
            {art.name}
          </h1>

          {/* Tags */}
          <div className="flex flex-wrap gap-3 mb-8">
            {art.origin && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-gold/15 text-brand-gold rounded-full text-sm font-barlow-condensed">
                📍 {art.origin}
              </span>
            )}
            {art.popularRegion && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-red/15 text-brand-red rounded-full text-sm font-barlow-condensed">
                🌍 {art.popularRegion}
              </span>
            )}
          </div>

          {/* History Section */}
          {art.history && (
            <div className="mb-8">
              <h2 className="font-barlow-condensed text-brand-gold uppercase tracking-widest text-sm font-semibold mb-3">
                HISTÓRIA
              </h2>
              <p className="font-barlow text-base text-white/70 leading-relaxed">
                {art.history}
              </p>
            </div>
          )}

          {/* Ranking Section */}
          {art.ranking && (
            <div>
              <h2 className="font-barlow-condensed text-brand-red uppercase tracking-widest text-sm font-semibold mb-3">
                SISTEMA DE GRADUAÇÃO
              </h2>
              <div className="bg-brand-red/[0.08] rounded-xl border border-brand-red/15 p-6">
                <p className="font-barlow text-base text-white/70 leading-relaxed">
                  {art.ranking}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
