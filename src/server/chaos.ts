// The Chaos Panel's engine — provided infrastructure, leave it alone.
//
// Why it exists: on localhost every server call resolves in ~1ms, so
// <Loading> fallbacks never paint, pending states never show and error
// paths never run. Turn latency up and they all become visible.
//
// It is also the worked example of a service that OTHER services depend on:
// MonsterRepo yields `Chaos` in its layer and calls `chaos.read` /
// `chaos.write(label)` around every operation. Nothing that uses MonsterRepo
// has to know chaos exists.
//
// Settings live in a Ref inside the one app runtime, so they are process-wide:
// both your browser windows share one server, so one slider moves both.
import 'server-only';

import { Context, Duration, Effect, Layer, Random, Ref } from 'effect';

import { ChaosRejected } from '../shared/errors';

export interface ChaosSettings {
  /** Artificial delay applied to every repo call, in ms. */
  readonly latencyMs: number;
  /** Probability (0..1) that a repo WRITE fails with ChaosRejected. */
  readonly failureRate: number;
}

export const CHAOS_DEFAULTS: ChaosSettings = { latencyMs: 0, failureRate: 0 };

export class Chaos extends Context.Service<
  Chaos,
  {
    readonly settings: Effect.Effect<ChaosSettings>;
    readonly update: (next: Partial<ChaosSettings>) => Effect.Effect<ChaosSettings>;
    /** Guard a READ: latency only. Reads that randomly explode are unreasonable. */
    readonly read: Effect.Effect<void>;
    /** Guard a WRITE: latency, then maybe fail. Call it BEFORE touching state. */
    readonly write: (label: string) => Effect.Effect<void, ChaosRejected>;
  }
>()('spooky/Chaos') {
  static readonly layer = Layer.effect(
    Chaos,
    Effect.gen(function* () {
      const ref = yield* Ref.make(CHAOS_DEFAULTS);

      // ±15% so repeated calls do not arrive in lockstep.
      const delay = Effect.gen(function* () {
        const { latencyMs } = yield* Ref.get(ref);
        if (latencyMs <= 0) return;
        const factor = yield* Random.nextBetween(0.85, 1.15);
        yield* Effect.sleep(Duration.millis(Math.round(latencyMs * factor)));
      });

      return Chaos.of({
        settings: Ref.get(ref),
        update: (next) =>
          Ref.updateAndGet(ref, (current) => ({
            latencyMs: clamp(next.latencyMs ?? current.latencyMs, 0, 5000),
            failureRate: clamp(next.failureRate ?? current.failureRate, 0, 1),
          })),
        read: delay,
        write: (label) =>
          Effect.gen(function* () {
            yield* delay;
            const { failureRate } = yield* Ref.get(ref);
            const roll = yield* Random.next;
            if (roll < failureRate) return yield* new ChaosRejected({ label });
          }),
      });
    }),
  );
}

function clamp(n: number, min: number, max: number): number {
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
}
