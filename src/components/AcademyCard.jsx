import Link from 'next/link';
import Avatar from './Avatar';
import Icon from './Icon';

export default function AcademyCard({ academy }) {
  const { id, full_name, status, avatar_url, city, phone, bio, instagram, facebook, youtube, tiktok } = academy;
  const hasSocials = instagram || facebook || youtube || tiktok;

  return (
    <Link href={`/academias/${id}`}>
      <div className="card-hover bg-gradient-to-b from-dark-card to-dark-card2 rounded-xl border border-white/5 p-5 transition-all duration-300 hover:border-blue-500/30 group">
        {/* Header: Avatar + Name + Status */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar name={full_name} url={avatar_url} size={48} />
          <div className="flex-1 min-w-0">
            <h3 className="font-bebas text-xl text-white tracking-wide truncate group-hover:text-blue-400 transition-colors">
              {full_name}
            </h3>
            {academy.handle && (
              <p className="text-xs text-white/40 font-barlow truncate -mt-0.5 mb-0.5">
                @{academy.handle}
              </p>
            )}
            {city && (
              <p className="text-xs text-white/35 font-barlow truncate -mt-0.5 mb-0.5">
                {city}
              </p>
            )}
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  status === 'active' ? 'bg-green-500' : 'bg-white/30'
                }`}
              />
              <span className="text-xs text-white/40 font-barlow-condensed uppercase tracking-wider">
                {status === 'active' ? 'Ativa' : status || 'Inativa'}
              </span>
            </div>
          </div>
        </div>

        {/* Bio Preview */}
        {bio ? (
          <p className="text-sm text-white/50 font-barlow leading-relaxed mb-4 line-clamp-3">
            {bio}
          </p>
        ) : (
          <p className="text-xs text-white/25 font-barlow italic mb-4">
            Nenhuma descricao cadastrada
          </p>
        )}

        {/* Contact & Social */}
        {(phone || hasSocials) && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/5">
            {phone && (
              <span className="flex items-center gap-1 text-[10px] text-white/35 font-barlow">
                <Icon name="phone" size={11} />
                {phone}
              </span>
            )}
            {instagram && (
              <span className="flex items-center gap-1 text-[10px] text-white/35 font-barlow">
                <Icon name="instagram" size={11} />
                {instagram}
              </span>
            )}
            {facebook && (
              <span className="flex items-center gap-1 text-[10px] text-white/35 font-barlow">
                <Icon name="facebook" size={11} />
                {facebook.startsWith('http') ? 'Facebook' : facebook}
              </span>
            )}
            {youtube && (
              <span className="flex items-center gap-1 text-[10px] text-white/35 font-barlow">
                <Icon name="youtube" size={11} />
                {youtube.startsWith('http') ? 'YouTube' : youtube}
              </span>
            )}
            {tiktok && (
              <span className="flex items-center gap-1 text-[10px] text-white/35 font-barlow">
                <Icon name="tiktok" size={11} />
                {tiktok}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
