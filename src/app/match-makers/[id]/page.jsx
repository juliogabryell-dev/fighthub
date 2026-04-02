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
  const { data } = await supabase.from('match_makers')
    .select('*, owner:owner_id(full_name, handle, avatar_url, city, state), match_maker_athletes(id, fighter:fighter_id(id, full_name, handle, avatar_url)), match_maker_teams(id, team:team_id(id, name, logo_url)), match_maker_federations(id, federation:federation_id(id, official_name, abbreviation))')
    .eq('id', id).eq('status', 'active').single();
  return data;
}

const SPEC_LABELS = { amador: 'Amador', profissional: 'Profissional', internacional: 'Internacional' };

export default async function MatchMakerDetailPage({ params }) {
  const { id } = await params;
  const item = await getData(id);
  if (!item) notFound();
  const athletes = (item.match_maker_athletes || []).filter((a) => a.fighter);
  const teams = (item.match_maker_teams || []).filter((t) => t.team);
  const federations = (item.match_maker_federations || []).filter((f) => f.federation);

  return (
    <main className="min-h-screen px-6 py-12 max-w-4xl mx-auto">
      <Link href="/match-makers" className="inline-flex items-center gap-2 text-brand-red font-barlow-condensed uppercase tracking-wider text-sm mb-8 hover:text-brand-red/80 transition-colors">
        <Icon name="chevronLeft" size={16} /> Voltar
      </Link>
      <div className="bg-gradient-to-br from-dark-card to-dark-card2 rounded-2xl border border-theme-border/[0.06] overflow-hidden">
        <div className="relative bg-gradient-to-br from-amber-500/20 to-amber-500/5 p-10">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center overflow-hidden flex-shrink-0">
              {item.logo_url || item.owner?.avatar_url ? (
                <img src={item.logo_url || item.owner.avatar_url} alt={item.owner?.full_name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-bebas text-3xl text-amber-400">{item.owner?.full_name?.charAt(0)}</span>
              )}
            </div>
            <div className="text-center sm:text-left">
              <h1 className="font-bebas text-3xl text-theme-text tracking-wider">{item.owner?.full_name}</h1>
              {item.owner?.handle && <p className="font-barlow text-sm text-theme-text/50">@{item.owner.handle}</p>}
              {item.specialty && <span className="inline-block mt-2 text-xs bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-full px-3 py-0.5 font-barlow-condensed uppercase tracking-wider">{SPEC_LABELS[item.specialty]}</span>}
            </div>
          </div>
        </div>
        <div className="p-10 space-y-6">
          {item.organizations && item.organizations.length > 0 && (
            <div>
              <h3 className="font-barlow-condensed text-brand-gold uppercase tracking-widest text-sm font-semibold mb-2">Organizações</h3>
              <div className="space-y-2">
                {item.organizations.map((o, i) => {
                  const years = o.start_date ? Math.floor((Date.now() - new Date(o.start_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 bg-theme-text/[0.02] rounded-lg border-l-2 border-amber-500">
                      <span className="font-barlow-condensed text-theme-text">{o.name}</span>
                      {years !== null && years >= 0 && <span className="font-barlow text-xs text-theme-text/40">{years > 0 ? `${years} anos` : 'Menos de 1 ano'}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {athletes.length > 0 && (
            <div>
              <h3 className="font-barlow-condensed text-brand-gold uppercase tracking-widest text-sm font-semibold mb-3">Atletas ({athletes.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {athletes.map((a) => (
                  <Link key={a.id} href={`/lutadores/${a.fighter.id}`} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-theme-text/[0.03] border border-theme-border/[0.06] hover:border-brand-red/30 transition-all group">
                    <Avatar name={a.fighter.full_name} url={a.fighter.avatar_url} size={32} />
                    <div className="min-w-0">
                      <p className="font-barlow-condensed text-sm text-theme-text truncate group-hover:text-brand-red transition-colors">{a.fighter.full_name}</p>
                      {a.fighter.handle && <p className="font-barlow text-[10px] text-theme-text/30 truncate">@{a.fighter.handle}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {teams.length > 0 && (
            <div>
              <h3 className="font-barlow-condensed text-brand-gold uppercase tracking-widest text-sm font-semibold mb-3">Equipes ({teams.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {teams.map((t) => (
                  <Link key={t.id} href={`/equipes/${t.team.id}`} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-theme-text/[0.03] border border-theme-border/[0.06] hover:border-brand-red/30 transition-all group">
                    <Avatar name={t.team.name} url={t.team.logo_url} size={32} />
                    <p className="font-barlow-condensed text-sm text-theme-text truncate group-hover:text-brand-red transition-colors">{t.team.name}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {federations.length > 0 && (
            <div>
              <h3 className="font-barlow-condensed text-brand-gold uppercase tracking-widest text-sm font-semibold mb-3">Federações ({federations.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {federations.map((f) => (
                  <Link key={f.id} href={`/federacoes/${f.federation.id}`} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-theme-text/[0.03] border border-theme-border/[0.06] hover:border-brand-red/30 transition-all group">
                    <p className="font-barlow-condensed text-sm text-theme-text truncate group-hover:text-brand-red transition-colors">{f.federation.abbreviation || f.federation.official_name}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {(item.email || item.instagram || item.facebook || item.tiktok || item.whatsapp) && (
            <div>
              <h3 className="font-barlow-condensed text-brand-gold uppercase tracking-widest text-sm font-semibold mb-2">Contato</h3>
              <div className="flex flex-wrap gap-3">
                {item.email && <span className="text-sm text-theme-text/50 font-barlow flex items-center gap-1"><Icon name="mail" size={14} /> {item.email}</span>}
                {item.whatsapp && <a href={`https://wa.me/${item.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="text-sm text-green-400/70 font-barlow flex items-center gap-1"><Icon name="phone" size={14} /> WhatsApp</a>}
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
