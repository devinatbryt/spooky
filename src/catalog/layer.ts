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
import { Layer, Context, Effect, Schema, SchemaIssue } from 'effect';
import { MonsterRepo } from '../server/monster-repo';
import type { Monster } from '../shared/monster';
import { MonsterNotFound } from '../shared/errors';
import { Species } from '../shared/monster';

// { monsters: [], total: 12, pages: 2}

type CatalogSearchResult = {
  monsters: Array<Monster>;
  total: number;
  pages: number;
}

export class InvalidSearch extends Schema.TaggedError<InvalidSearch>()('InvalidSearch', {
  field: Schema.String,
  reason: Schema.String,
}) {
  override get message() {
    return this.reason;
  }
}

const Search = Schema.Struct({
  name: Schema.optionalKey(Schema.String),
  species: Schema.optionalKey(Species),
  status: Schema.Literals(['all', 'available', 'adopted']).pipe(Schema.withDecodingDefaultKey(Effect.succeed('all'))),
  page: Schema.Number.pipe(Schema.withDecodingDefaultKey(Effect.succeed(1)))
})
export class MonsterCatalog extends Context.Service<MonsterCatalog, {
  search: (str: unknown) => Effect.Effect<CatalogSearchResult, InvalidSearch>;
  detail: (id: string) => Effect.Effect<Monster, MonsterNotFound>
}>()('spooky/MonsterCatalog') {
}

const searchIssues = SchemaIssue.makeFormatterStandardSchemaV1()

export const CatalogLayer = Layer.effect(
    MonsterCatalog,
    Effect.gen(function*(){
        const monsters = yield* MonsterRepo;
        const allMonsters = yield* monsters.list;

        return MonsterCatalog.of({
            search: (str) => Effect.gen(function*(){
                const decodedSearch = yield* Schema.decodeUnknownEffect(Search)(str).pipe(
                  Effect.mapError((err) => {
                    const [first] = searchIssues(err.issue).issues;
                    const field = first?.path?.[0]
                    return new InvalidSearch({
                      field: typeof field === 'object' ? String(field.key) : String(field ?? 'form'),
                      reason: first?.message ?? 'That search did not make sense.',
                    })
                  })
                )
                
                const {name, species, status, page} = decodedSearch; 

                const filteredMonsters = allMonsters.filter((monster) => {
                  monster.name.toLowerCase().includes(name?.toLowerCase() ?? '') &&
                  (species ? monster.species === species : true) &&
                  status === 'all' ? true : monster.status === status
                })

                const pageSize = 8;
                const total = filteredMonsters.length;

                const pages = Math.ceil(total / pageSize) 

                return {
                    monsters: filteredMonsters,
                    total,
                    pages,
                }
            }),
            detail: (id) => Effect.gen(function*(){
              const single = yield* monsters.get(id)
              return single ? single : yield* new MonsterNotFound({
                id: id
              });
            })
        })
    })

);

