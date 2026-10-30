// The bridge between Solid's server functions and Effect — provided
// infrastructure, leave it alone.
//
// One ManagedRuntime is built for the whole server process from AppLayer.
// Every 'use server' function body is one line:
//
//   export const getThing = query(async (id: string) => {
//     'use server';
//     return runServer(ThingService.use((s) => s.get(id)));
//   }, 'thing');
//
// What runServer does with the outcome:
//   - success          → returns the value
//   - typed failure    → throws a plain Error with `_tag` + the error's fields
//                        and NO server stack (see src/shared/errors.ts)
//   - defect / bug     → logs the full cause here, throws a generic
//                        { _tag: 'Defect' } error so nothing internal leaks
//   - client went away → the request's AbortSignal interrupts the effect
import 'server-only';

import { Cause, Effect, Exit, Layer, ManagedRuntime, Option } from 'effect';
import { getRequestEvent, markSafeError } from '@solidjs/web';

import { AdoptionLayer } from '../adoption/layer';
import { CatalogLayer } from '../catalog/layer';
import { PumpkinPatch } from '../example/pumpkin-patch';
import { BackgroundCheck } from './background-check';
import { Chaos } from './chaos';
import { MonsterRepo } from './monster-repo';

/** Shared infrastructure every slice can depend on. */
export const InfraLayer = Layer.mergeAll(MonsterRepo.layer, BackgroundCheck.layer).pipe(
  Layer.provideMerge(Chaos.layer),
);

/**
 * Everything the app can run. Each slice registers its services in its OWN
 * layer file (src/catalog/layer.ts, src/adoption/layer.ts) — never here — so
 * the two branches never touch the same line and merge cleanly.
 */
export const AppLayer = Layer.mergeAll(CatalogLayer, AdoptionLayer, PumpkinPatch.layer).pipe(
  Layer.provideMerge(InfraLayer),
);

export type AppServices = Layer.Success<typeof AppLayer>;

const runtime = ManagedRuntime.make(AppLayer);

export async function runServer<A, E>(effect: Effect.Effect<A, E, AppServices>): Promise<A> {
  const signal = getRequestEvent()?.request.signal;
  const exit = await runtime.runPromiseExit(effect, signal ? { signal } : undefined);
  if (Exit.isSuccess(exit)) return exit.value;

  const failure = Cause.findErrorOption(exit.cause);
  if (Option.isSome(failure)) throw toWireError(failure.value);

  if (Cause.hasInterruptsOnly(exit.cause)) {
    throw toWireError({ _tag: 'Interrupted', message: 'The request was cancelled.' });
  }

  console.error(Cause.pretty(exit.cause));
  throw toWireError({ _tag: 'Defect', message: 'Something went wrong on the server.' });
}

/**
 * Copy a typed failure into a fresh, plain Error: `_tag`, `message` and the
 * error's own fields survive serialisation; the class and the server stack
 * trace do not.
 *
 * `markSafeError` matters: outside the dev build, Solid replaces every thrown
 * server-function error with a generic one (so a driver error can't leak a
 * connection string). This error is built from fields we chose, so it is
 * branded safe to cross intact. Without it, production would lose `_tag`.
 */
function toWireError(error: unknown): Error {
  const source = (typeof error === 'object' && error !== null ? error : {}) as Record<string, unknown>;
  const fields: Record<string, unknown> = {};
  for (const key of Object.keys(source)) {
    if (key !== 'stack' && key !== 'cause') fields[key] = source[key];
  }
  const tag = typeof source._tag === 'string' ? source._tag : 'UnknownError';
  const message = typeof source.message === 'string' && source.message ? source.message : tag;

  const wire = Object.assign(new Error(message), fields, { _tag: tag });
  wire.name = tag;
  wire.stack = `${tag}: ${message}`;
  return markSafeError(wire);
}
