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
  const { data } = await supabase
    .from('federations')
    .select('*, owner:owner_id(full_name, handle, avatar_url)')
    .eq('id', id)
    .eq('status', 'active')
    .single();
  return data;
}

export default async function FederacaoDetailPage({ params }) {
  const { id } = await params;
  const item = await getData(id);
  if (!item) notFound();

  return (
    <main className="min-h-screen px-6 py-12 max-w-4xl mx-auto">
      <Link href="/federacoes" className="inline-flex items-center gap-2 text-brand-red font-barlow-condensed uppercase tracking-wider text-sm mb-8 hover:text-brand-red/80 transition-colors">
        <Icon name="chevronLeft" size={16} /> Voltar
      </Link>

      <div className="bg-gradient-to-br from-dark-card to-dark-card2 rounded-2xl border border-theme-border/[0.06] overflow-hidden">
        <div className="relative bg-gradient-to-br from-blue-500/20 to-blue-500/5 p-10">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-blue-500/20 border-2 border-blue-500/40 flex items-center justify-center overflow-hidden flex-shrink-0">
              {item.logo_url ? (
                <img src={item.logo_url} alt={item.official_name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-bebas text-3xl text-blue-400">{item.official_name?.charAt(0)}</span>
              )}
            </div>
            <div className="text-center sm:text-left">
              <h1 className="font-bebas text-3xl text-theme-text tracking-wider">{item.official_name}</h1>
              {item.abbreviation && <p className="font-barlow-condensed text-brand-gold uppercase tracking-wider text-sm">{item.abbreviation}</p>}
              {item.city && (
                <p className="font-barlow text-sm text-theme-text/40 mt-1 flex items-center gap-1">
                  <Icon name="map-pin" size={14} /> {[item.city, item.state, item.country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="p-10 space-y-6">
          {item.president && (
            <div>
              <h3 className="font-barlow-condensed text-brand-gold uppercase tracking-widest text-sm font-semibold mb-2">Presidente</h3>
              <p className="font-barlow text-theme-text/60">{item.president}</p>
            </div>
          )}
          {item.regulated_modalities && item.regulated_modalities.length > 0 && (
            <div>
              <h3 className="font-barlow-condensed text-brand-gold uppercase tracking-widest text-sm font-semibold mb-2">Modalidades</h3>
              <div className="flex flex-wrap gap-2">
                {item.regulated_modalities.map((m, i) => (
                  <span key={i} className="text-xs bg-theme-text/5 border border-theme-border/10 rounded-full px-3 py-1 text-theme-text/60 font-barlow-condensed">{m}</span>
                ))}
              </div>
            </div>
          )}
          {item.ranking_system && (
            <div>
              <h3 className="font-barlow-condensed text-brand-gold uppercase tracking-widest text-sm font-semibold mb-2">Sistema de Ranking</h3>
              <p className="font-barlow text-sm text-theme-text/60">{item.ranking_system}</p>
            </div>
          )}
          {(item.email || item.whatsapp || item.website || item.instagram || item.facebook || item.tiktok) && (
            <div>
              <h3 className="font-barlow-condensed text-brand-gold uppercase tracking-widest text-sm font-semibold mb-2">Contato</h3>
              <div className="flex flex-wrap gap-3">
                {item.email && <span className="text-sm text-theme-text/50 font-barlow flex items-center gap-1"><Icon name="mail" size={14} /> {item.email}</span>}
                {item.whatsapp && <a href={`https://wa.me/${item.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm text-green-400/70 font-barlow flex items-center gap-1"><Icon name="phone" size={14} /> WhatsApp</a>}
                {item.website && <a href={item.website} target="_blank" rel="noopener noreferrer" className="text-sm text-theme-text/50 font-barlow flex items-center gap-1"><Icon name="globe" size={14} /> Site</a>}
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
