// The worked example's server functions. Each body is ONE runServer call —
// that is the whole Effect ↔ Solid seam. Validation, errors and state all
// live in the service (./pumpkin-patch.ts), never here.
import { formAction, query } from '@solidjs/router';

import { runServer } from '../server/runtime';
import { PumpkinPatch } from './pumpkin-patch';

/** A read: cached per key by the router, revalidated after writes. */
export const getPumpkinStock = query(async () => {
  'use server';
  return runServer(PumpkinPatch.use((patch) => patch.stock));
}, 'pumpkin-stock');

/**
 * A write bound to a <form>. The FormData goes to the service UNdecoded —
 * the service's Schema is the only thing that decides what is valid.
 */
export const pickPumpkin = formAction(async (form: FormData) => {
  'use server';
  return runServer(
    PumpkinPatch.use((patch) =>
      patch.pick({ size: form.get('size'), pickedBy: form.get('pickedBy') }),
    ),
  );
}, 'pick-pumpkin');

/** A plain server function, called from a click handler. */
export async function replantPatch() {
  'use server';
  return runServer(PumpkinPatch.use((patch) => patch.replant));
}
