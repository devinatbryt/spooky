// The Catalog's slot in the app runtime (src/server/runtime.ts imports it).
//
// When you write your Catalog service, register its layer here, e.g.
//
//   export const CatalogLayer = MonsterCatalog.layer;
//
// or several at once with Layer.mergeAll(...). Anything your layer needs from
// shared infrastructure (MonsterRepo, Chaos) is provided for you by the
// runtime — you do not provide it here.
//
// This is the ONLY file outside src/catalog and src/routes/monsters that the
// Catalog pair edits, and only the Catalog pair edits it.
import { Layer } from 'effect';

export const CatalogLayer = Layer.empty;
