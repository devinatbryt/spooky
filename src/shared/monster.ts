// The shared contract. FROZEN on main: both pairs read it, neither pair
// edits it on their branch. If you think it is wrong, say so out loud — do
// not change it, or the merge at the end stops being free.
//
// Schemas are the single source of truth: the TypeScript types below are
// derived from them, and the server decodes anything that arrives over the
// wire with them. Safe to import from client code (no server-only imports).
import { Schema } from 'effect';

export const Species = Schema.Literals([
  'vampire',
  'werewolf',
  'ghost',
  'zombie',
  'witch',
  'mummy',
]);
export type Species = typeof Species.Type;

export const Housing = Schema.Literals([
  'apartment',
  'house-with-yard',
  'haunted-mansion',
  'crypt',
]);
export type Housing = typeof Housing.Type;

export const AdoptionStatus = Schema.Literals(['available', 'adopted']);
export type AdoptionStatus = typeof AdoptionStatus.Type;

export const Monster = Schema.Struct({
  id: Schema.String, // 'mon_01'
  name: Schema.String,
  species: Species,
  emoji: Schema.String,
  age: Schema.Number,
  bio: Schema.String,
  status: AdoptionStatus,
  adoptedBy: Schema.NullOr(Schema.String),
  adoptedAt: Schema.NullOr(Schema.Number),
});
export type Monster = typeof Monster.Type;

/** Display labels, in the order the UI should list them. */
export const SPECIES_LABELS: Record<Species, string> = {
  vampire: 'Vampire',
  werewolf: 'Werewolf',
  ghost: 'Ghost',
  zombie: 'Zombie',
  witch: 'Witch',
  mummy: 'Mummy',
};

export const HOUSING_LABELS: Record<Housing, string> = {
  apartment: 'Apartment',
  'house-with-yard': 'House with a yard',
  'haunted-mansion': 'Haunted mansion',
  crypt: 'Crypt',
};

/**
 * The one URL both slices agree on. The Catalog links here; the Adoption
 * Desk serves it. Use this helper instead of building the string by hand.
 */
export const adoptPath = (monsterId: string) => `/adopt/${monsterId}`;
