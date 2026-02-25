import { createClient } from '@supabase/supabase-js';
import AcademyCard from '@/components/AcademyCard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Academias | FightLog',
};

async function getAcademies() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return [];
    const supabase = createClient(url, key);
    const { data: academies, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'academy')
      .eq('status', 'active');

    if (error || !academies) {
      console.error('Erro ao buscar academias:', error);
      return [];
    }
    return academies;
  } catch (e) {
    console.error('Erro ao buscar academias:', e);
    return [];
  }
}

export default async function AcademiasPage() {
  const academies = await getAcademies();

  return (
    <main className="min-h-screen px-6 py-16 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="font-bebas text-5xl text-white tracking-wider">
          ACADEMIAS{' '}
          <span className="text-brand-red">CADASTRADAS</span>
        </h1>
        <p className="font-barlow text-white/50 mt-3 text-lg">
          Encontre academias e centros de treinamento
        </p>
      </div>

      {/* Academies Grid or Empty State */}
      {academies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {academies.map((academy) => (
            <AcademyCard key={academy.id} academy={academy} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/[0.06] p-12 max-w-md mx-auto">
            <p className="font-bebas text-3xl text-white/30 mb-2">🏢</p>
            <p className="font-barlow-condensed text-xl text-white/40 uppercase tracking-wider">
              Nenhuma academia cadastrada ainda
            </p>
            <p className="font-barlow text-sm text-white/25 mt-2">
              As academias aparecerão aqui conforme se cadastrarem na plataforma.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
