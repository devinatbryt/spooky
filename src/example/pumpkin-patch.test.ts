// Testing an Effect service: build it from its real layer, but feed it fake
// dependencies, so the test — not the dice — decides what happens.
//
// `it.effect` runs an Effect as a test (with a TestClock, so Effect.sleep
// does not really wait). `Effect.flip` swaps success and failure, which is
// the easy way to assert on a typed error.
import { describe, expect, it } from '@effect/vitest';
import { Effect, Layer } from 'effect';

import { Chaos } from '../server/chaos';
import { ChaosRejected } from '../shared/errors';
import { PumpkinPatch } from './pumpkin-patch';

// The real Chaos layer starts at 0ms latency and 0% failure: no chaos.
const TestLayer = PumpkinPatch.layer.pipe(Layer.provide(Chaos.layer));

// A fake Chaos that rejects every write — a dependency swapped for a test
// double without touching PumpkinPatch at all.
const AlwaysRejects = Layer.succeed(
  Chaos,
  Chaos.of({
    settings: Effect.succeed({ latencyMs: 0, failureRate: 1 }),
    update: () => Effect.die('not used in this test'),
    read: Effect.void,
    write: (label) => Effect.fail(new ChaosRejected({ label })),
  }),
);

describe('PumpkinPatch', () => {
  it.effect('picks a pumpkin and reports what is left', () =>
    Effect.gen(function* () {
      const patch = yield* PumpkinPatch;
      const pick = yield* patch.pick({ size: 'medium', pickedBy: '  Ada  ' });
      expect(pick).toEqual({ size: 'medium', pickedBy: 'Ada', remaining: 2 });
    }).pipe(Effect.provide(TestLayer)),
  );

  it.effect('rejects bad input with the offending field named', () =>
    Effect.gen(function* () {
      const patch = yield* PumpkinPatch;
      const error = yield* Effect.flip(patch.pick({ size: 'medium', pickedBy: ' ' }));
      expect(error._tag).toBe('InvalidPick');
      if (error._tag === 'InvalidPick') expect(error.field).toBe('pickedBy');
    }).pipe(Effect.provide(TestLayer)),
  );

  it.effect('fails with PatchEmpty once a size runs out', () =>
    Effect.gen(function* () {
      const patch = yield* PumpkinPatch;
      yield* patch.pick({ size: 'giant', pickedBy: 'Ada' });
      const error = yield* Effect.flip(patch.pick({ size: 'giant', pickedBy: 'Grace' }));
      expect(error._tag).toBe('PatchEmpty');
    }).pipe(Effect.provide(TestLayer)),
  );

  it.effect('two simultaneous picks of the last giant: exactly one wins', () =>
    Effect.gen(function* () {
      const patch = yield* PumpkinPatch;
      const results = yield* Effect.all(
        [
          Effect.result(patch.pick({ size: 'giant', pickedBy: 'Ada' })),
          Effect.result(patch.pick({ size: 'giant', pickedBy: 'Grace' })),
        ],
        { concurrency: 'unbounded' },
      );
      const wins = results.filter((r) => r._tag === 'Success');
      expect(wins).toHaveLength(1);
    }).pipe(Effect.provide(TestLayer)),
  );

  it.effect('a rejected write leaves the stock untouched', () =>
    Effect.gen(function* () {
      const patch = yield* PumpkinPatch;
      yield* Effect.flip(patch.pick({ size: 'small', pickedBy: 'Ada' }));
      const stock = yield* patch.stock;
      expect(stock.small).toBe(5);
    }).pipe(Effect.provide(PumpkinPatch.layer.pipe(Layer.provide(AlwaysRejects)))),
  );
});
