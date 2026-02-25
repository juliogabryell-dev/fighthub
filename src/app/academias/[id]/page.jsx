import Link from 'next/link';
import Icon from '@/components/Icon';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function buildSocialUrl(platform, handle) {
  if (!handle) return null;
  const trimmed = handle.trim();

  switch (platform) {
    case 'instagram': {
      const clean = trimmed.replace(/^@/, '');
      return `https://instagram.com/${clean}`;
    }
    case 'facebook': {
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
      }
      return `https://facebook.com/${trimmed}`;
    }
    case 'youtube': {
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
      }
      return `https://youtube.com/@${trimmed}`;
    }
    case 'tiktok': {
      const clean = trimmed.replace(/^@/, '');
      return `https://tiktok.com/@${clean}`;
    }
    default:
      return null;
  }
}

async function getAcademy(id) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    const supabase = createClient(url, key);
    const { data: academy, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !academy) {
      console.error('Erro ao buscar academia:', error);
      return null;
    }
    return academy;
  } catch (e) {
    console.error('Erro ao buscar academia:', e);
    return null;
  }
}

export default async function AcademyProfile({ params }) {
  const { id } = await params;
  const academy = await getAcademy(id);

  if (!academy) {
    return (
      <main className="min-h-screen px-6 py-12 max-w-4xl mx-auto">
        <Link
          href="/academias"
          className="inline-flex items-center gap-2 text-brand-red font-barlow-condensed uppercase tracking-wider text-sm mb-8 hover:text-brand-red/80 transition-colors"
        >
          <Icon name="chevronLeft" size={16} />
          Voltar
        </Link>

        <div className="text-center py-20">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/[0.06] p-12 max-w-md mx-auto">
            <p className="font-bebas text-3xl text-white/30 mb-3">🏢</p>
            <p className="font-barlow-condensed text-xl text-white/40 uppercase tracking-wider">
              Perfil não encontrado
            </p>
            <p className="font-barlow text-sm text-white/25 mt-2">
              A academia pode ter sido removida ou o banco de dados não está configurado.
            </p>
            <Link
              href="/academias"
              className="inline-block mt-6 font-barlow-condensed uppercase tracking-wider text-sm font-semibold px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-blue-500/25 transition-all"
            >
              Ver Academias
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const hasBio = !!academy.bio;
  const hasLocation = !!(academy.city || academy.state);
  const hasPhone = !!academy.phone;
  const hasSocials = !!(academy.instagram || academy.facebook || academy.youtube || academy.tiktok);
  const hasSocialInfo = hasBio || hasLocation || hasPhone || hasSocials;

  const socialLinks = [
    { platform: 'instagram', handle: academy.instagram, label: 'Instagram' },
    { platform: 'facebook', handle: academy.facebook, label: 'Facebook' },
    { platform: 'youtube', handle: academy.youtube, label: 'YouTube' },
    { platform: 'tiktok', handle: academy.tiktok, label: 'TikTok' },
  ].filter((s) => s.handle);

  return (
    <main className="min-h-screen px-6 py-12 max-w-4xl mx-auto">
      {/* Back Button */}
      <Link
        href="/academias"
        className="inline-flex items-center gap-2 text-brand-red font-barlow-condensed uppercase tracking-wider text-sm mb-8 hover:text-brand-red/80 transition-colors"
      >
        <Icon name="chevronLeft" size={16} />
        Voltar
      </Link>

      {/* Profile Card */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/[0.06] overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-500/20 to-blue-500/5 p-10">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-blue-500/20 border-2 border-blue-500/40 flex items-center justify-center overflow-hidden flex-shrink-0">
              {academy.avatar_url ? (
                <img
                  src={academy.avatar_url}
                  alt={academy.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-bebas text-3xl text-blue-400">
                  {academy.full_name?.charAt(0) || '?'}
                </span>
              )}
            </div>

            <div className="text-center sm:text-left flex-1">
              <h1 className="font-bebas text-4xl text-white tracking-wider">
                {academy.full_name}
              </h1>
              <p className="font-barlow-condensed text-sm text-blue-400 uppercase tracking-wider mt-1">
                Academia
              </p>
              <span
                className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-barlow-condensed uppercase tracking-wider ${
                  academy.status === 'active'
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                    : 'bg-white/10 text-white/40 border border-white/10'
                }`}
              >
                {academy.status === 'active' ? 'Ativa' : academy.status}
              </span>
            </div>
          </div>
        </div>

        {/* Social Info Section */}
        {hasSocialInfo && (
          <div className="px-10 py-6 border-b border-white/[0.06]">
            {/* Bio / Description */}
            {hasBio && (
              <p className="font-barlow text-sm text-white/60 leading-relaxed mb-4">
                {academy.bio}
              </p>
            )}

            {/* Location and Phone */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {hasLocation && (
                <div className="flex items-center gap-2 text-white/40">
                  <Icon name="map-pin" size={16} />
                  <span className="font-barlow text-sm">
                    {[academy.city, academy.state].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}

              {hasPhone && (
                <div className="flex items-center gap-2 text-white/40">
                  <Icon name="phone" size={16} />
                  <span className="font-barlow text-sm">{academy.phone}</span>
                </div>
              )}
            </div>

            {/* Social Media Links */}
            {hasSocials && (
              <div className="flex flex-wrap items-center gap-3 mt-4">
                {socialLinks.map((social) => {
                  const url = buildSocialUrl(social.platform, social.handle);
                  if (!url) return null;
                  return (
                    <a
                      key={social.platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.15] transition-all"
                    >
                      <Icon name={social.platform} size={16} />
                      <span className="font-barlow-condensed text-xs uppercase tracking-wider">
                        {social.label}
                      </span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Content - Empty info for academy */}
        {!hasSocialInfo && (
          <div className="p-10">
            <div className="text-center py-8">
              <p className="font-barlow-condensed text-white/30 uppercase tracking-wider text-sm">
                Nenhuma informacao adicional cadastrada
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
