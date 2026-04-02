import Link from 'next/link';
import Avatar from './Avatar';
import Icon from './Icon';
import FightRecordDisplay from './FightRecordDisplay';
import VerifiedBadge from './VerifiedBadge';

function isPublic(fighter, field) {
  const pf = fighter.public_fields;
  if (!pf) return true;
  return pf[field] !== false;
}

export default function FighterCard({ fighter }) {
  const { id, full_name, status, avatar_url, city, phone, instagram, facebook, youtube, tiktok } = fighter;
  const pub = (field) => isPublic(fighter, field);
  const hasSocials = (instagram && pub('instagram')) || (facebook && pub('facebook')) || (youtube && pub('youtube')) || (tiktok && pub('tiktok'));
  const martial_arts = fighter.fighter_martial_arts || [];
  const fight_records = fighter.fight_records || [];

  return (
    <div className="card-hover bg-gradient-to-b from-dark-card to-dark-card2 rounded-xl border border-theme-border/5 transition-all duration-300 hover:border-brand-red/30 group overflow-hidden">
      {/* Top section - clickable to open profile */}
      <Link href={`/lutadores/${id}`} className="block p-5 pb-3">
        {/* Header: Avatar + Name + Status */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar name={full_name} url={avatar_url} size={48} />
          <div className="flex-1 min-w-0">
            <h3 className="font-bebas text-xl text-theme-text tracking-wide truncate group-hover:text-brand-red transition-colors flex items-center gap-1.5">
              {full_name}
              {(fighter.fighter_verified || fighter.coach_verified || fighter.verified) && <VerifiedBadge size={16} />}
            </h3>
            {fighter.handle && (
              <p className="text-xs text-theme-text/40 font-barlow truncate -mt-0.5 mb-0.5">
                @{fighter.handle}
              </p>
            )}
            {city && pub('city') && (
              <p className="text-xs text-theme-text/35 font-barlow truncate -mt-0.5 mb-0.5">
                {city}
              </p>
            )}
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  status === 'active' ? 'bg-green-500' : 'bg-theme-text/30'
                }`}
              />
              <span className="text-xs text-theme-text/40 font-barlow-condensed uppercase tracking-wider">
                {status === 'active' ? 'Ativo' : status || 'Inativo'}
              </span>
            </div>
          </div>
        </div>

        {/* Physical info */}
        {((fighter.height_cm && pub('height_cm')) || (fighter.weight_kg && pub('weight_kg')) || (fighter.blood_type && pub('blood_type'))) && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {fighter.height_cm && pub('height_cm') && (
              <span className="text-[10px] bg-theme-text/5 border border-theme-border/10 rounded-full px-2 py-0.5 text-theme-text/50 font-barlow">
                {fighter.height_cm}cm
              </span>
            )}
            {fighter.weight_kg && pub('weight_kg') && (
              <span className="text-[10px] bg-theme-text/5 border border-theme-border/10 rounded-full px-2 py-0.5 text-theme-text/50 font-barlow">
                {fighter.weight_kg}kg
              </span>
            )}
            {fighter.blood_type && pub('blood_type') && (
              <span className="text-[10px] bg-brand-red/10 border border-brand-red/20 rounded-full px-2 py-0.5 text-brand-red/60 font-barlow">
                {fighter.blood_type}
              </span>
            )}
          </div>
        )}

        {/* Martial Arts Tags */}
        {martial_arts.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {martial_arts.map((art, i) => (
              <span
                key={i}
                className="text-xs bg-theme-text/5 border border-theme-border/10 rounded-full px-2.5 py-0.5 text-theme-text/60 font-barlow-condensed"
              >
                {art.art_name}
                {art.level && (
                  <span className="text-brand-gold ml-1">
                    {art.level}
                  </span>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Contact & Social */}
        {((phone && pub('phone')) || hasSocials) && (
          <div className="flex flex-wrap items-center gap-2">
            {phone && pub('phone') && (
              <span className="flex items-center gap-1 text-[10px] text-theme-text/35 font-barlow">
                <Icon name="phone" size={11} />
                {phone}
              </span>
            )}
            {instagram && pub('instagram') && (
              <span className="flex items-center gap-1 text-[10px] text-theme-text/35 font-barlow">
                <Icon name="instagram" size={11} />
                {instagram}
              </span>
            )}
            {facebook && pub('facebook') && (
              <span className="flex items-center gap-1 text-[10px] text-theme-text/35 font-barlow">
                <Icon name="facebook" size={11} />
                {facebook.startsWith('http') ? 'Facebook' : facebook}
              </span>
            )}
            {youtube && pub('youtube') && (
              <span className="flex items-center gap-1 text-[10px] text-theme-text/35 font-barlow">
                <Icon name="youtube" size={11} />
                {youtube.startsWith('http') ? 'YouTube' : youtube}
              </span>
            )}
            {tiktok && pub('tiktok') && (
              <span className="flex items-center gap-1 text-[10px] text-theme-text/35 font-barlow">
                <Icon name="tiktok" size={11} />
                {tiktok}
              </span>
            )}
          </div>
        )}
      </Link>

      {/* Divider with margin */}
      <div className="mx-3 border-t border-theme-border/5" />

      {/* Bottom section - fight record (not clickable for profile) */}
      <div className="px-5 pb-5 pt-3">
        <FightRecordDisplay records={fight_records} size="sm" />
      </div>
    </div>
  );
}
