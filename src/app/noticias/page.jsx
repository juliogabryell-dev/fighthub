import { createClient } from '@supabase/supabase-js';
import NewsCard from '@/components/NewsCard';
import { SAMPLE_NEWS } from '@/lib/constants';
import { scrapeNews } from '@/lib/scrapeNews';

export const revalidate = 3600;

export const metadata = {
  title: 'Notícias | FightHub',
};

async function getNews() {
  // 1. Try scraping AgFight
  try {
    const scraped = await scrapeNews();
    if (scraped && scraped.length > 0) return scraped;
  } catch {
    // fall through
  }

  // 2. Fallback: try Supabase
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      const supabase = createClient(url, key);
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) return data;
    }
  } catch {
    // fall through
  }

  // 3. Final fallback: sample data
  return SAMPLE_NEWS;
}

export default async function NoticiasPage() {
  const news = await getNews();

  return (
    <main className="min-h-screen px-6 py-16 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="font-bebas text-5xl text-white tracking-wider">
          NOTÍCIAS &{' '}
          <span className="text-brand-red">DIVULGAÇÕES</span>
        </h1>
        <p className="font-barlow text-white/50 mt-3 text-lg">
          Fique por dentro de tudo sobre o mundo das lutas
        </p>
      </div>

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {news.map((item) => (
          <NewsCard key={item.id} news={item} />
        ))}
      </div>
    </main>
  );
}
