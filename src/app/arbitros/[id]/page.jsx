import { notFound } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

async function getData(id) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key);
  const { data } = await supabase.from('referees').select('*, owner:owner_id(full_name, handle, avatar_url, birth_date), federation:federation_id(id, official_name, abbreviation)').eq('id', id).eq('status', 'active').single();
  return data;
}

const LEVEL_LABELS = { regional: 'Regional', nacional: 'Nacional', internacional: 'Internacional' };

export default async function ArbitroDetailPage({ params }) {
  const { id } = await params;
  const item = await getData(id);
  if (!item) notFound();

  return (
    <main className="min-h-screen px-6 py-12 max-w-4xl mx-auto">
      <Link href="/arbitros" className="inline-flex items-center gap-2 text-brand-red font-barlow-condensed uppercase tracking-wider text-sm mb-8 hover:text-brand-red/80 transition-colors">
        <Icon name="chevronLeft" size={16} /> Voltar
      </Link>
      <div className="bg-gradient-to-br from-dark-card to-dark-card2 rounded-2xl border border-theme-border/[0.06] overflow-hidden">
        <div className="relative bg-gradient-to-br from-purple-500/20 to-purple-500/5 p-10">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-purple-500/20 border-2 border-purple-500/40 flex items-center justify-center overflow-hidden flex-shrink-0">
              {item.logo_url || item.owner?.avatar_url ? (
                <img src={item.logo_url || item.owner.avatar_url} alt={item.owner?.full_name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-bebas text-3xl text-purple-400">{item.owner?.full_name?.charAt(0)}</span>
              )}
            </div>
            <div className="text-center sm:text-left">
              <h1 className="font-bebas text-3xl text-theme-text tracking-wider">{item.owner?.full_name}</h1>
              {item.owner?.handle && <p className="font-barlow text-sm text-theme-text/50">@{item.owner.handle}</p>}
              <div className="flex items-center gap-2 mt-2 flex-wrap justify-center sm:justify-start">
                {item.level && <span className="text-xs bg-purple-500/15 border border-purple-500/30 text-purple-400 rounded-full px-3 py-0.5 font-barlow-condensed uppercase tracking-wider">{LEVEL_LABELS[item.level]}</span>}
                {item.license_number && <span className="text-xs bg-theme-text/5 border border-theme-border/10 rounded-full px-3 py-0.5 text-theme-text/50 font-barlow">Reg: {item.license_number}</span>}
              </div>
            </div>
          </div>
        </div>
        <div className="p-10 space-y-6">
          {item.federation && (
            <div>
              <h3 className="font-barlow-condensed text-brand-gold uppercase tracking-widest text-sm font-semibold mb-2">Federação Vinculada</h3>
              <Link href={`/federacoes/${item.federation.id}`} className="font-barlow text-theme-text/60 hover:text-brand-red transition-colors">
                {item.federation.abbreviation ? `${item.federation.official_name} (${item.federation.abbreviation})` : item.federation.official_name}
              </Link>
            </div>
          )}
          {item.specialties && item.specialties.length > 0 && (
            <div>
              <h3 className="font-barlow-condensed text-brand-gold uppercase tracking-widest text-sm font-semibold mb-2">Especialidades</h3>
              <div className="space-y-2">
                {item.specialties.map((s, i) => {
                  const years = s.start_date ? Math.floor((Date.now() - new Date(s.start_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 bg-theme-text/[0.02] rounded-lg border-l-2 border-purple-500">
                      <span className="font-barlow-condensed text-theme-text">{s.modality}</span>
                      {years !== null && years >= 0 && <span className="font-barlow text-xs text-theme-text/40">{years > 0 ? `${years} ${years === 1 ? 'ano' : 'anos'}` : 'Menos de 1 ano'}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {(item.city || item.email || item.phone) && (
            <div>
              <h3 className="font-barlow-condensed text-brand-gold uppercase tracking-widest text-sm font-semibold mb-2">Contato</h3>
              <div className="flex flex-wrap gap-4">
                {item.city && <span className="text-sm text-theme-text/50 font-barlow flex items-center gap-1"><Icon name="map-pin" size={14} /> {[item.city, item.state].filter(Boolean).join(', ')}</span>}
                {item.email && <span className="text-sm text-theme-text/50 font-barlow flex items-center gap-1"><Icon name="mail" size={14} /> {item.email}</span>}
                {item.phone && <span className="text-sm text-theme-text/50 font-barlow flex items-center gap-1"><Icon name="phone" size={14} /> {item.phone}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
