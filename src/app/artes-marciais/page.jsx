import MartialArtCard from '@/components/MartialArtCard';
import { MARTIAL_ARTS_DATA } from '@/lib/constants';

export const metadata = {
  title: 'Artes Marciais | FightHub',
};

export default function ArtesMarciais() {
  return (
    <main className="min-h-screen px-6 py-16 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="font-bebas text-5xl text-white tracking-wider">
          ARTES{' '}
          <span className="text-brand-red">MARCIAIS</span>
        </h1>
        <p className="font-barlow text-white/50 mt-3 text-lg">
          As 20 artes marciais mais praticadas no mundo
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {MARTIAL_ARTS_DATA.map((art, index) => (
          <MartialArtCard key={art.id} art={art} index={index} />
        ))}
      </div>
    </main>
  );
}
