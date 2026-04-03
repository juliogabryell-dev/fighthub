export function isProfileVerified(profile) {
  if (!profile) return false;
  return !!(profile.verified || profile.fighter_verified || profile.coach_verified);
}
