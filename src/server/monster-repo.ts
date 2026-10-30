// The monster store — provided infrastructure, FROZEN on main.
//
// An in-memory "database" behind a service interface. Both slices read it;
// only the Adoption Desk writes it. Swapping this for SQLite is a bonus line
// in SPEC.md, and the point of that bonus is that nothing else changes: same
// `MonsterRepo` tag, different layer.
//
// Read this before you build on it: `save` is NOT atomic with `get`. It
// overwrites whatever is stored, no questions asked. If two requests both
// `get` a monster, both see "available", and both `save` it as adopted, the
// second one silently wins. Preventing that is the Desk's problem.
import 'server-only';

import { Context, Effect, Layer, Ref } from 'effect';

import { ChaosRejected, MonsterNotFound } from '../shared/errors';
import type { Monster } from '../shared/monster';
import { Chaos } from './chaos';

export class MonsterRepo extends Context.Service<
  MonsterRepo,
  {
    /** Every monster, in id order. */
    readonly list: Effect.Effect<ReadonlyArray<Monster>>;
    readonly get: (id: string) => Effect.Effect<Monster, MonsterNotFound>;
    /** Upsert by id. Last write wins. Subject to chaos write failures. */
    readonly save: (monster: Monster) => Effect.Effect<Monster, ChaosRejected>;
  }
>()('spooky/MonsterRepo') {
  static readonly layer = Layer.effect(
    MonsterRepo,
    Effect.gen(function* () {
      const chaos = yield* Chaos;
      const store = yield* Ref.make(
        new Map<string, Monster>(SEED.map((monster) => [monster.id, monster])),
      );

      return MonsterRepo.of({
        list: chaos.read.pipe(
          Effect.andThen(Ref.get(store)),
          Effect.map((map) => [...map.values()]),
        ),
        get: (id) =>
          chaos.read.pipe(
            Effect.andThen(Ref.get(store)),
            Effect.flatMap((map) => {
              const monster = map.get(id);
              return monster ? Effect.succeed(monster) : Effect.fail(new MonsterNotFound({ id }));
            }),
          ),
        save: (monster) =>
          chaos.write(`save ${monster.name}`).pipe(
            Effect.andThen(Ref.update(store, (map) => new Map(map).set(monster.id, monster))),
            Effect.as(monster),
          ),
      });
    }),
  );
}

const available = { status: 'available', adoptedBy: null, adoptedAt: null } as const;
const adopted = (by: string) =>
  ({ status: 'adopted', adoptedBy: by, adoptedAt: Date.UTC(2026, 9, 1) }) as const;

/** 24 monsters, 4 per species. A few are already adopted so every tab has data. */
export const SEED: ReadonlyArray<Monster> = [
  { id: 'mon_01', name: 'Count Snackula', species: 'vampire', emoji: '🧛', age: 412, bio: 'Only drinks tomato juice. Mostly. Sleeps in until sunset and asks you not to judge.', ...available },
  { id: 'mon_02', name: 'Vlad the Inhaler', species: 'vampire', emoji: '🧛', age: 589, bio: 'Asthmatic, dramatic, and very good with capes. Allergic to garlic and to mornings.', ...adopted('Mina H.') },
  { id: 'mon_03', name: 'Nosferatoo', species: 'vampire', emoji: '🧛', age: 301, bio: 'Silent-film star turned ballroom dancer. Will rearrange your furniture into a crypt.', ...available },
  { id: 'mon_04', name: 'Lady Bathory-Bubbles', species: 'vampire', emoji: '🧛', age: 444, bio: 'Insists on bubble baths at midnight. Excellent at board games, terrible loser.', ...available },

  { id: 'mon_05', name: 'Sir Barks-a-Lot', species: 'werewolf', emoji: '🐺', age: 34, bio: 'A gentleman 29 days a month. On the 30th, please hide the sofa cushions.', ...available },
  { id: 'mon_06', name: 'Fang Shui', species: 'werewolf', emoji: '🐺', age: 27, bio: 'Interior design enthusiast. Will howl if the energy in your hallway is wrong.', ...available },
  { id: 'mon_07', name: 'Moony McFurface', species: 'werewolf', emoji: '🐺', age: 19, bio: 'Sheds year-round, not only at the full moon. Loves fetch, hates silverware.', ...adopted('Remus L.') },
  { id: 'mon_08', name: 'Lady Howlsworth', species: 'werewolf', emoji: '🐺', age: 52, bio: 'Retired opera singer. Her full-moon aria has been described as "a lot".', ...available },

  { id: 'mon_09', name: 'Sheets McGee', species: 'ghost', emoji: '👻', age: 160, bio: 'A classic. Two eye holes, one sheet, zero chill. Rattles chains for attention.', ...available },
  { id: 'mon_10', name: 'Wispy Wanda', species: 'ghost', emoji: '👻', age: 211, bio: 'Floats through walls, never through doors. Will rearrange your fridge magnets.', ...available },
  { id: 'mon_11', name: 'The Grey Lady of Aisle 9', species: 'ghost', emoji: '👻', age: 97, bio: 'Haunted a supermarket for decades. Knows where everything is. Hates self-checkout.', ...available },
  { id: 'mon_12', name: 'Eugene the Unseen', species: 'ghost', emoji: '👻', age: 133, bio: 'So shy he is invisible even to other ghosts. Low maintenance. Probably here now.', ...adopted('Carol A.') },

  { id: 'mon_13', name: 'Brainy Bob', species: 'zombie', emoji: '🧟', age: 41, bio: 'Vegetarian zombie: only eats cauliflower, because it looks like brains.', ...available },
  { id: 'mon_14', name: 'Shambles', species: 'zombie', emoji: '🧟', age: 23, bio: 'Moves at 0.3 mph. Extremely loyal. Gets lost in apartments with more than one hallway.', ...available },
  { id: 'mon_15', name: 'Gary Gnawsworth', species: 'zombie', emoji: '🧟', age: 58, bio: 'Former accountant. Still does your taxes, slowly, while moaning.', ...available },
  { id: 'mon_16', name: 'Rotten Ruth', species: 'zombie', emoji: '🧟', age: 66, bio: 'Grandmotherly. Knits scarves that fall apart, much like Ruth.', ...available },

  { id: 'mon_17', name: 'Hazel Hexley', species: 'witch', emoji: '🧙', age: 128, bio: 'Brews a mean pumpkin-spice potion. Side effects include mild levitation.', ...available },
  { id: 'mon_18', name: 'Broomhilda Fizz', species: 'witch', emoji: '🧙', age: 76, bio: 'Commutes by broom, parks it anywhere. Comes with one opinionated black cat.', ...available },
  { id: 'mon_19', name: 'Granny Cauldron', species: 'witch', emoji: '🧙', age: 302, bio: 'Makes soup for the whole street. Do not ask what is in the soup.', ...available },
  { id: 'mon_20', name: 'Tabitha Toadwort', species: 'witch', emoji: '🧙', age: 45, bio: 'Turned her ex into a toad. They are on good terms now. The toad comes too.', ...adopted('Sabrina S.') },

  { id: 'mon_21', name: 'Tutankhamuffin', species: 'mummy', emoji: '🏺', age: 3346, bio: 'Bakes. Constantly. Wraps every muffin in linen, out of habit.', ...available },
  { id: 'mon_22', name: 'Ramses the Rewrapped', species: 'mummy', emoji: '🏺', age: 3250, bio: 'Recently re-bandaged and very proud of it. Do not pull the loose end.', ...available },
  { id: 'mon_23', name: 'Cleo Patrolla', species: 'mummy', emoji: '🏺', age: 2080, bio: 'Neighbourhood-watch captain. Has cursed four porch pirates so far.', ...available },
  { id: 'mon_24', name: 'Imhotep-Hop', species: 'mummy', emoji: '🏺', age: 4600, bio: 'Breakdances. Stiffly. Needs a crypt with good acoustics.', ...available },
];
