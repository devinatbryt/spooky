// The worked example's server functions. Each body is ONE runServer call —
// that is the whole Effect ↔ Solid seam. Validation, errors and state all
// live in the service (./pumpkin-patch.ts), never here.
import { formAction, query } from '@solidjs/router';
import { MonsterCatalog } from './layer';
import { runServer } from '../server/runtime';

/** A read: cached per key by the router, revalidated after writes. */
// take in url search params and pass to service
export const getMonsters = query(async (searchParams: string) => {
  'use server';
  return runServer(MonsterCatalog.use((monsters) => monsters.search(searchParams)));
}, 'monsters');

/**
 * A write bound to a <form>. The FormData goes to the service UNdecoded —
 * the service's Schema is the only thing that decides what is valid.
 */
export const getMonsterById = query(async (id: string) => {
  'use server';
  return runServer(
    MonsterCatalog.use((monsters) =>
      monsters.detail(id),
    ),
  );
}, 'monsters-detail');

/** A plain server function, called from a click handler. */
