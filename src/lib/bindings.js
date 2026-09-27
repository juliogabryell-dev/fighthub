// Binding (vínculo) types shared by the /api/bindings route and the UI.
// Each binding has two sides; the side that did NOT request must accept.
//
// Entity kinds:
//   fighter / coach / academy -> profiles.id
//   team / federation / match_maker -> id in their own table (owned via owner_id)

export const KIND_LABELS = {
  fighter: 'Lutador',
  coach: 'Treinador',
  academy: 'Academia',
  team: 'Equipe',
  federation: 'Federação',
  match_maker: 'Match Maker',
};

export const BINDING_TYPES = {
  fighter_coaches:    { a: { field: 'fighter_id', kind: 'fighter' }, b: { field: 'coach_id', kind: 'coach' }, modality: true, limitPerModality: 3 },
  fighter_academies:  { a: { field: 'fighter_id', kind: 'fighter' }, b: { field: 'academy_id', kind: 'academy' }, modality: true, limitPerModality: 2 },
  team_fighters:      { a: { field: 'team_id', kind: 'team' }, b: { field: 'fighter_id', kind: 'fighter' } },
  team_coaches:       { a: { field: 'team_id', kind: 'team' }, b: { field: 'coach_id', kind: 'coach' } },
  coach_academies:    { a: { field: 'coach_id', kind: 'coach' }, b: { field: 'academy_id', kind: 'academy' } },
  coach_federations:  { a: { field: 'coach_id', kind: 'coach' }, b: { field: 'federation_id', kind: 'federation' } },
  coach_match_makers: { a: { field: 'coach_id', kind: 'coach' }, b: { field: 'match_maker_id', kind: 'match_maker' } },
};

// Which kinds a user acting as <kind> may REQUEST a binding with, and through which table.
export const REQUEST_RULES = {
  fighter: [
    { targetKind: 'coach', type: 'fighter_coaches' },
    { targetKind: 'academy', type: 'fighter_academies' },
    { targetKind: 'team', type: 'team_fighters' },
  ],
  coach: [
    { targetKind: 'fighter', type: 'fighter_coaches' },
    { targetKind: 'academy', type: 'coach_academies' },
    { targetKind: 'federation', type: 'coach_federations' },
    { targetKind: 'team', type: 'team_coaches' },
    { targetKind: 'match_maker', type: 'coach_match_makers' },
  ],
  team: [
    { targetKind: 'fighter', type: 'team_fighters' },
    { targetKind: 'coach', type: 'team_coaches' },
  ],
};

export function findRule(myKind, targetKind) {
  return (REQUEST_RULES[myKind] || []).find((r) => r.targetKind === targetKind) || null;
}

// Public page for an entity of the given kind
export function entityHref(kind, id) {
  const base = { fighter: '/lutadores', coach: '/treinadores', academy: '/academias', team: '/equipes', federation: '/federacoes', match_maker: '/match-makers' }[kind];
  return base ? `${base}/${id}` : null;
}
