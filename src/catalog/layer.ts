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
import { Layer, Context, Effect, Schema } from 'effect';
import type { Monster } from '../shared/monster';
import { MonsterNotFound } from '../shared/errors';
import { Species } from '../shared/monster';

// { monsters: [], total: 12, pages: 2}

type CatalogSearchResult = {
  monsters: Array<Monster>;
  total: number;
  pages: number;
}

const Search = Schema.Struct({
  name: Schema.optionalKey(Schema.String),
  species: Schema.optionalKey(Species),
  status: Schema.Literals(['all', 'available', 'adopted']).pipe(Schema.withDecodingDefaultKey(Effect.succeed('all'))),
  page: Schema.Number.pipe(Schema.withDecodingDefaultKey(Effect.succeed(1)))
})
export class MonsterCatalog extends Context.Service<MonsterCatalog, {
  search: (str: string) => Effect.Effect<CatalogSearchResult>;
  detail: (id: number) => Effect.Effect<Monster, MonsterNotFound>
}>()('spooky/MonsterCatalog') {
  //
}

export const CatalogLayer = Layer.effect(
    MonsterCatalog,
    Effect.gen(function*(){
        return MonsterCatalog.of({
            search: (str) => Effect.gen(function*(){
                Schema.decodeUnknownSync(Search)(str)
                return {
                    monsters: [],
                    total: 1,
                    pages: 1,
                }
            }),
            detail: (id) => Effect.gen(function*(){})
        })
    })

);

