import { notFound } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/Icon';
import Avatar from '@/components/Avatar';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

async function getData(id) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key);
  const { data } = await supabase.from('teams').select('*, owner:owner_id(full_name, handle, avatar_url), team_fighters(id, fighter:fighter_id(id, full_name, handle, avatar_url))').eq('id', id).eq('status', 'active').single();
  return data;
}

export default async function EquipeDetailPage({ params }) {
  const { id } = await params;
  const item = await getData(id);
  if (!item) notFound();
  const fighters = (item.team_fighters || []).filter((tf) => tf.fighter);

  return (
    <main className="min-h-screen px-6 py-12 max-w-4xl mx-auto">
      <Link href="/equipes" className="inline-flex items-center gap-2 text-brand-red font-barlow-condensed uppercase tracking-wider text-sm mb-8 hover:text-brand-red/80 transition-colors">
        <Icon name="chevronLeft" size={16} /> Voltar
      </Link>
      <div className="bg-gradient-to-br from-dark-card to-dark-card2 rounded-2xl border border-theme-border/[0.06] overflow-hidden">
        <div className="relative bg-gradient-to-br from-brand-red/20 to-brand-red/5 p-10">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-brand-red/20 border-2 border-brand-red/40 flex items-center justify-center overflow-hidden flex-shrink-0">
              {item.logo_url ? <img src={item.logo_url} alt={item.name} className="w-full h-full object-cover" /> : <span className="font-bebas text-3xl text-brand-red">{item.name?.charAt(0)}</span>}
            </div>
            <div className="text-center sm:text-left">
              <h1 className="font-bebas text-3xl text-theme-text tracking-wider">{item.name}</h1>
              {item.owner?.handle && <p className="font-barlow text-sm text-theme-text/50">@{item.owner.handle}</p>}
              {item.trade_name && <p className="font-barlow text-sm text-theme-text/40">{item.trade_name}</p>}
              {item.city && <p className="font-barlow text-sm text-theme-text/40 mt-1 flex items-center gap-1"><Icon name="map-pin" size={14} /> {[item.city, item.state, item.country].filter(Boolean).join(', ')}</p>}
              {item.founding_date && <p className="font-barlow text-xs text-theme-text/30 mt-1">Fundada em {new Date(item.founding_date).toLocaleDateString('pt-BR')}</p>}
            </div>
          </div>
        </div>
        <div className="p-10 space-y-6">
          {item.head_coach_name && (
            <div>
              <h3 className="font-barlow-condensed text-brand-gold uppercase tracking-widest text-sm font-semibold mb-2">Head Coach</h3>
              <p className="font-barlow text-theme-text/60">{item.head_coach_name}</p>
            </div>
          )}
          {item.modalities && item.modalities.length > 0 && (
            <div>
              <h3 className="font-barlow-condensed text-brand-gold uppercase tracking-widest text-sm font-semibold mb-2">Modalidades</h3>
              <div className="flex flex-wrap gap-2">
                {item.modalities.map((m, i) => <span key={i} className="text-xs bg-theme-text/5 border border-theme-border/10 rounded-full px-3 py-1 text-theme-text/60 font-barlow-condensed">{m}</span>)}
              </div>
            </div>
          )}
          {fighters.length > 0 && (
            <div>
              <h3 className="font-barlow-condensed text-brand-gold uppercase tracking-widest text-sm font-semibold mb-3">Atletas ({fighters.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {fighters.map((tf) => (
                  <Link key={tf.id} href={`/lutadores/${tf.fighter.id}`} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-theme-text/[0.03] border border-theme-border/[0.06] hover:border-brand-red/30 transition-all group">
                    <Avatar name={tf.fighter.full_name} url={tf.fighter.avatar_url} size={32} />
                    <div className="min-w-0">
                      <p className="font-barlow-condensed text-sm text-theme-text truncate group-hover:text-brand-red transition-colors">{tf.fighter.full_name}</p>
                      {tf.fighter.handle && <p className="font-barlow text-[10px] text-theme-text/30 truncate">@{tf.fighter.handle}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {(item.instagram || item.facebook || item.tiktok) && (
            <div>
              <h3 className="font-barlow-condensed text-brand-gold uppercase tracking-widest text-sm font-semibold mb-2">Redes Sociais</h3>
              <div className="flex flex-wrap gap-3">
                {item.instagram && <a href={`https://instagram.com/${item.instagram.replace(/^@/,'')}`} target="_blank" rel="noopener noreferrer" className="text-sm text-theme-text/50 font-barlow flex items-center gap-1"><Icon name="instagram" size={14} /> {item.instagram}</a>}
                {item.facebook && <a href={item.facebook.startsWith('http') ? item.facebook : `https://facebook.com/${item.facebook}`} target="_blank" rel="noopener noreferrer" className="text-sm text-theme-text/50 font-barlow flex items-center gap-1"><Icon name="facebook" size={14} /> Facebook</a>}
                {item.tiktok && <a href={`https://tiktok.com/@${item.tiktok.replace(/^@/,'')}`} target="_blank" rel="noopener noreferrer" className="text-sm text-theme-text/50 font-barlow flex items-center gap-1"><Icon name="tiktok" size={14} /> {item.tiktok}</a>}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
