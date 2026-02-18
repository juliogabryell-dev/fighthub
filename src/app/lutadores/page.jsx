import { createClient } from '@supabase/supabase-js';
import FighterCard from '@/components/FighterCard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Lutadores | FightHub',
};

async function getFighters() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return [];
    const supabase = createClient(url, key);
    const { data: fighters, error } = await supabase
      .from('profiles')
      .select('*, fighter_martial_arts(*), fight_records!fight_records_fighter_id_fkey(*)')
      .eq('role', 'fighter')
      .eq('status', 'active');

    if (error || !fighters) {
      console.error('Erro ao buscar lutadores:', error);
      return [];
    }
    return fighters;
  } catch (e) {
    console.error('Erro ao buscar lutadores:', e);
    return [];
  }
}

export default async function LutadoresPage() {
  const fighters = await getFighters();

  return (
    <main className="min-h-screen px-6 py-16 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="font-bebas text-5xl text-white tracking-wider">
          LUTADORES{' '}
          <span className="text-brand-red">CADASTRADOS</span>
        </h1>
        <p className="font-barlow text-white/50 mt-3 text-lg">
          Encontre lutadores, veja cartéis e desafie oponentes
        </p>
      </div>

      {/* Fighters Grid or Empty State */}
      {fighters.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {fighters.map((fighter) => (
            <FighterCard key={fighter.id} fighter={fighter} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/[0.06] p-12 max-w-md mx-auto">
            <p className="font-bebas text-3xl text-white/30 mb-2">🥊</p>
            <p className="font-barlow-condensed text-xl text-white/40 uppercase tracking-wider">
              Nenhum lutador cadastrado ainda
            </p>
            <p className="font-barlow text-sm text-white/25 mt-2">
              Os lutadores aparecerão aqui conforme se cadastrarem na plataforma.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
