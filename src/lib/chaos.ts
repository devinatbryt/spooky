// Server functions for the Chaos Panel — provided infrastructure.
//
// Each body is one runServer(...) call: the Effect program runs on the
// server's app runtime, and the compiler turns the function into a fetch in
// the browser. `../server/*` is server-only and never reaches the client.
import { query } from '@solidjs/router';

import { Chaos, type ChaosSettings } from '../server/chaos';
import { runServer } from '../server/runtime';

export const getChaos = query(async () => {
  'use server';
  return runServer(Chaos.use((chaos) => chaos.settings));
}, 'chaos');

/**
 * A plain server function, called directly from an event handler. The router
 * revalidates queries after any server-function call, so every page re-reads
 * under the new settings.
 */
export async function updateChaos(next: Partial<ChaosSettings>) {
  'use server';
  return runServer(Chaos.use((chaos) => chaos.update(next)));
}

export type { ChaosSettings };
