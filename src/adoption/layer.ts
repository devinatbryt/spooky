// The Adoption Desk's slot in the app runtime (src/server/runtime.ts imports it).
//
// When you write your Desk service, register its layer here, e.g.
//
//   export const AdoptionLayer = AdoptionDesk.layer;
//
// or several at once with Layer.mergeAll(...). Anything your layer needs from
// shared infrastructure (MonsterRepo, BackgroundCheck, Chaos) is provided for
// you by the runtime — you do not provide it here.
//
// Only the Adoption Desk pair edits this file.
import { Layer } from 'effect';

export const AdoptionLayer = Layer.empty;
