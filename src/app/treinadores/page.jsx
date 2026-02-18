import CoachCard from '@/components/CoachCard';

export const metadata = {
  title: 'Treinadores | FightHub',
};

async function getCoaches() {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    if (!supabase) return [];
    const { data: coaches, error } = await supabase
      .from('profiles')
      .select('*, coach_experiences(*)')
      .eq('role', 'coach')
      .eq('status', 'active');

    if (error || !coaches) {
      return [];
    }
    return coaches;
  } catch {
    return [];
  }
}

export default async function TreinadoresPage() {
  const coaches = await getCoaches();

  return (
    <main className="min-h-screen px-6 py-16 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="font-bebas text-5xl text-white tracking-wider">
          TREINADORES &{' '}
          <span className="text-brand-red">COACHES</span>
        </h1>
        <p className="font-barlow text-white/50 mt-3 text-lg">
          Encontre treinadores experientes para evoluir sua técnica
        </p>
      </div>

      {/* Coaches Grid or Empty State */}
      {coaches.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {coaches.map((coach) => (
            <CoachCard key={coach.id} coach={coach} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/[0.06] p-12 max-w-md mx-auto">
            <p className="font-bebas text-3xl text-white/30 mb-2">🥋</p>
            <p className="font-barlow-condensed text-xl text-white/40 uppercase tracking-wider">
              Nenhum treinador cadastrado ainda
            </p>
            <p className="font-barlow text-sm text-white/25 mt-2">
              Os treinadores aparecerão aqui conforme se cadastrarem na plataforma.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
